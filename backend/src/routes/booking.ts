import { Router, Request, Response } from 'express';
import { sendBookingNotification, sendClientConfirmation } from '../services/emailService';
import { bookingRateLimit } from '../middleware/rateLimiter';
import { logger } from '../lib/logger';

export const bookingRouter = Router();

bookingRouter.post('/request', bookingRateLimit, async (req: Request, res: Response) => {
  logger.info('Booking request received: ' + JSON.stringify(req.body));

  const { name, email, eventDate, notes, phone } = req.body;

  if (!name || !email || !eventDate || !notes) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  try {
    logger.info('Attempting to send notification email...');
    await sendBookingNotification({ name, email, phone, eventDate, notes });
    logger.info('Notification email sent!');

    await sendClientConfirmation({ name, email, phone, eventDate, notes });
    logger.info('Confirmation email sent!');

    res.json({ success: true, message: 'Your booking request has been received.' });
  } catch (error: any) {
    logger.error('Email error: ' + error.message);
    res.status(500).json({ success: false, error: 'Failed to send request.' });
  }
});
```

Save, then:
```
git add .
git commit -m "Simplify booking route"
git push origin main
import { Router, Request, Response } from 'express';
import { sendBookingNotification, sendClientConfirmation } from '../services/emailService';
import { bookingRateLimit } from '../middleware/rateLimiter';
import { logger } from '../lib/logger';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const bookingRouter = Router();

bookingRouter.post('/request', bookingRateLimit, upload.array('attachments', 10), async (req: Request, res: Response) => {
  const { name, email, eventDate, notes, phone, fileLink, website } = req.body;

  if (!name || !email || !eventDate || !notes) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const files = (req.files as Express.Multer.File[]) || [];

  try {
    await sendBookingNotification({ name, email, phone, eventDate, notes, fileLink, attachments: files });
    await sendClientConfirmation({ name, email, phone, eventDate, notes, fileLink, attachments: files });
    logger.info('Booking emails sent for ' + eventDate);
    res.json({ success: true, message: 'Your booking request has been received.' });
  } catch (error: any) {
    logger.error('Email error: ' + error.message);
    res.status(500).json({ success: false, error: 'Failed to send request.' });
  }
});

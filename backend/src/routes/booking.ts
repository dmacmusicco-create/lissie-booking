import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendBookingNotification, sendClientConfirmation } from '../services/emailService';
import { bookingRateLimit } from '../middleware/rateLimiter';
import { logger } from '../lib/logger';

export const bookingRouter = Router();

// Validation rules
const bookingValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number too long'),
  body('eventDate')
    .isDate()
    .withMessage('Valid event date required')
    .custom(value => {
      const date = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (date < now) throw new Error('Event date cannot be in the past');
      return true;
    }),
  body('notes')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Notes must be 10-2000 characters'),
  // Honeypot field — if filled, it's a bot
  body('website')
    .isEmpty()
    .withMessage('Bot detected'),
];

// POST /api/booking/request
bookingRouter.post(
  '/request',
  bookingRateLimit,
  bookingValidation,
  async (req: Request, res: Response) => {
    // Check honeypot
    if (req.body.website) {
      // Silently reject bots
      res.json({ success: true, message: 'Request received' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array().map(e => e.msg),
      });
      return;
    }

    const { name, email, phone, eventDate, notes } = req.body;

    try {
      // Send notification to Derrick
   try {
        await sendBookingNotification({ name, email, phone, eventDate, notes });
        logger.info(`Notification email sent for ${eventDate}`);
      } catch (emailErr: any) {
        logger.error(`Email failed: ${emailErr.message}`);
      }

      try {
        await sendClientConfirmation({ name, email, phone, eventDate, notes });
        logger.info(`Confirmation email sent to ${email}`);
      } catch (emailErr: any) {
        logger.error(`Confirmation email failed: ${emailErr.message}`);
      }

      logger.info(`Booking request processed: ${name} for ${eventDate}`);   
      res.json({
        success: true,
        message: 'Your booking request has been received. We will be in touch shortly.',
      });
    } catch (error) {
      logger.error('Failed to process booking request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send your request. Please try again or contact us directly.',
      });
    }
  }
);

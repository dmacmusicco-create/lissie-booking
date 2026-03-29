import { Router, Request, Response } from 'express';
import { fetchAvailability, invalidateCache } from '../services/googleCalendar';
import { generalRateLimit } from '../middleware/rateLimiter';
import { requireAdminSecret } from '../middleware/adminAuth';
import { logger } from '../lib/logger';

export const calendarRouter = Router();

calendarRouter.get('/availability', generalRateLimit, async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string || '60'), 180);
    const availability = await fetchAvailability(days);
    res.json({ success: true, data: availability, count: availability.length });
  } catch (error) {
    logger.error('Calendar route error:', error);
    res.status(503).json({
      success: false,
      error: 'Unable to fetch calendar data. Please try again shortly.',
    });
  }
});

calendarRouter.post('/refresh', requireAdminSecret, async (_req: Request, res: Response) => {
  try {
    invalidateCache();
    const availability = await fetchAvailability(180);
    res.json({ success: true, message: 'Cache refreshed', count: availability.length });
  } catch (error) {
    res.status(503).json({ success: false, error: 'Failed to refresh' });
  }
});

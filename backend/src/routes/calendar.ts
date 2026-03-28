import { Router, Request, Response } from 'express';
import { fetchAvailability, invalidateCache } from '../services/googleCalendar';
import { generalRateLimit } from '../middleware/rateLimiter';
import { requireAdminSecret } from '../middleware/adminAuth';
import { logger } from '../lib/logger';

export const calendarRouter = Router();

// GET /api/calendar/availability?days=60
calendarRouter.get('/availability', generalRateLimit, async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string || '90'), 365);
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

// POST /api/calendar/refresh (admin only - force refresh cache)
calendarRouter.post('/refresh', requireAdminSecret, async (_req: Request, res: Response) => {
  try {
    invalidateCache();
    const availability = await fetchAvailability(90);
    res.json({ success: true, message: 'Cache refreshed', count: availability.length });
  } catch (error) {
    res.status(503).json({ success: false, error: 'Failed to refresh' });
  }
});

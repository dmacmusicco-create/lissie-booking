import { Router, Request, Response } from 'express';
import { sendNewsletterToAll } from '../services/scheduler';
import { logger } from '../lib/logger';

export const cronRouter = Router();

/**
 * GET /api/cron/newsletter
 * Called by Vercel Cron on schedule defined in vercel.json
 * Vercel sends an Authorization header to verify the request is legitimate
 */
cronRouter.get('/newsletter', async (req: Request, res: Response) => {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron attempt');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    logger.info('Vercel cron triggered newsletter send');
    const result = await sendNewsletterToAll();
    logger.info('Cron newsletter complete:', result);
    res.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Cron newsletter failed:', error);
    res.status(500).json({ success: false, error: 'Newsletter send failed' });
  }
});

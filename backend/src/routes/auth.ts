import { Router, Request, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens } from '../services/googleCalendar';
import { requireAdminSecret } from '../middleware/adminAuth';
import { logger } from '../lib/logger';

export const authRouter = Router();

// GET /api/auth/google - Get Google OAuth URL (admin only)
authRouter.get('/google', requireAdminSecret, (_req: Request, res: Response) => {
  const authUrl = getAuthUrl();
  res.json({ authUrl });
});

// GET /api/auth/google/callback - Handle OAuth callback
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    logger.info('OAuth tokens received');
    logger.info('=== SAVE THIS REFRESH TOKEN TO YOUR .env ===');
    logger.info(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

    res.send(`
      <html>
        <body style="font-family:monospace;padding:40px;background:#1a1a2e;color:#d4af37">
          <h2>✅ Google Calendar Connected!</h2>
          <p>Copy this refresh token to your <code>.env</code> file:</p>
          <pre style="background:#000;padding:20px;border-radius:8px;color:#0f0;overflow-x:auto">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          <p style="color:#aaa">Then restart the server. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

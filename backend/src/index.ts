import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { calendarRouter } from './routes/calendar';
import { bookingRouter } from './routes/booking';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { cronRouter } from './routes/cron';
import { startNewsletterScheduler } from './services/scheduler';
import { logger } from './lib/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    calendarConfigured: !!process.env.GOOGLE_REFRESH_TOKEN,
    emailConfigured: !!process.env.GMAIL_APP_PASSWORD,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cron', cronRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
  if (!process.env.VERCEL) startNewsletterScheduler();
});

export default app;

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { sendNewsletterToClient, Client } from './emailService';
import { logger } from '../lib/logger';

const CLIENTS_FILE = path.join(__dirname, '../data/clients.json');
const CALENDAR_URL = process.env.FRONTEND_URL || 'https://your-booking-site.com';

// ─── Load Clients ─────────────────────────────────────────────────────────────
export function loadClients(): Client[] {
  try {
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    const clients: Client[] = JSON.parse(raw);
    return clients.filter(c => c.active);
  } catch (err) {
    logger.error('Failed to load clients.json:', err);
    return [];
  }
}

// ─── Send Newsletter to All Clients ──────────────────────────────────────────
export async function sendNewsletterToAll(): Promise<{ sent: number; failed: number }> {
  const clients = loadClients();
  logger.info(`Starting newsletter send to ${clients.length} active clients...`);

  let sent = 0;
  let failed = 0;

  // Send individually with a small delay to avoid SMTP rate limits
  for (const client of clients) {
    try {
      await sendNewsletterToClient(client, CALENDAR_URL);
      sent++;

      // Small delay between emails (250ms) to respect Gmail limits
      await delay(250);
    } catch (err) {
      logger.error(`Failed to send newsletter to ${client.email}:`, err);
      failed++;
    }
  }

  logger.info(`Newsletter complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// ─── Start Scheduler ─────────────────────────────────────────────────────────
export function startNewsletterScheduler(): void {
  // Default: every 14 days at 9am Monday
  // Customize via NEWSLETTER_CRON env var
  const cronExpression = process.env.NEWSLETTER_CRON || '0 9 */14 * *';

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  cron.schedule(cronExpression, async () => {
    logger.info('Newsletter cron triggered');
    const result = await sendNewsletterToAll();
    logger.info(`Newsletter cron complete:`, result);
  }, {
    timezone: 'America/Chicago', // Adjust to your timezone
  });

  logger.info(`Newsletter scheduled: "${cronExpression}"`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAdminSecret } from '../middleware/adminAuth';
import { adminRateLimit } from '../middleware/rateLimiter';
import { blockDate } from '../services/googleCalendar';
import { sendNewsletterToAll, loadClients } from '../services/scheduler';
import { Client } from '../services/emailService';
import { logger } from '../lib/logger';

export const adminRouter = Router();

const CLIENTS_FILE = path.join(__dirname, '../data/clients.json');

adminRouter.use(requireAdminSecret);
adminRouter.use(adminRateLimit);

function saveClients(clients: Client[]): void {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
}

function getAllClients(): Client[] {
  try {
    const raw = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// GET /api/admin/clients
adminRouter.get('/clients', (_req: Request, res: Response) => {
  const clients = getAllClients();
  res.json({ success: true, data: clients, count: clients.length });
});

// POST /api/admin/clients
adminRouter.post(
  '/clients',
  [body('name').trim().isLength({ min: 1, max: 100 }), body('email').isEmail().normalizeEmail()],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }

    const clients = getAllClients();
    const { name, email } = req.body;

    if (clients.find(c => c.email === email)) {
      res.status(409).json({ success: false, error: 'Client already exists' }); return;
    }

    const newClient: Client = {
      id: uuidv4(), name, email, active: true,
      addedAt: new Date().toISOString().split('T')[0],
    };
    clients.push(newClient);
    saveClients(clients);
    logger.info(`Added client: ${email}`);
    res.json({ success: true, data: newClient });
  }
);

// PUT /api/admin/clients/:id
adminRouter.put('/clients/:id', (req: Request, res: Response) => {
  const clients = getAllClients();
  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) { res.status(404).json({ success: false, error: 'Client not found' }); return; }
  clients[idx] = { ...clients[idx], ...req.body };
  saveClients(clients);
  res.json({ success: true, data: clients[idx] });
});

// DELETE /api/admin/clients/:id
adminRouter.delete('/clients/:id', (req: Request, res: Response) => {
  const clients = getAllClients();
  const filtered = clients.filter(c => c.id !== req.params.id);
  if (filtered.length === clients.length) { res.status(404).json({ success: false, error: 'Client not found' }); return; }
  saveClients(filtered);
  logger.info(`Deleted client: ${req.params.id}`);
  res.json({ success: true });
});

// POST /api/admin/block-date
adminRouter.post(
  '/block-date',
  [body('date').isDate(), body('reason').optional().trim().isLength({ max: 100 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return; }
    try {
      await blockDate(req.body.date, req.body.reason || 'Blocked');
      res.json({ success: true, message: `Date ${req.body.date} blocked` });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to block date' });
    }
  }
);

// POST /api/admin/send-newsletter (manual trigger)
adminRouter.post('/send-newsletter', async (_req: Request, res: Response) => {
  try {
    logger.info('Manual newsletter triggered via admin');
    const result = await sendNewsletterToAll();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Newsletter send failed' });
  }
});

// GET /api/admin/stats
adminRouter.get('/stats', (_req: Request, res: Response) => {
  const all = getAllClients();
  const active = all.filter(c => c.active);
  res.json({ success: true, data: { totalClients: all.length, activeClients: active.length } });
});

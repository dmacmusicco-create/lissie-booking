import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BookingRequest {
  name: string;
  email: string;
  phone?: string;
  eventDate: string;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  active: boolean;
  addedAt: string;
}

// ─── Transporter ─────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
// ─── Send Booking Notification to Derrick ────────────────────────────────────
export async function sendBookingNotification(booking: BookingRequest): Promise<void> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background: #f8f6f2; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; }
    .header p { color: #a0a8c0; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; }
    .body { padding: 40px; }
    .alert { background: #fff8e1; border-left: 4px solid #d4af37; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px; }
    .alert p { margin: 0; color: #5d4e37; font-size: 15px; }
    .field { margin-bottom: 24px; }
    .field label { display: block; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .field .value { font-size: 16px; color: #1a1a2e; font-weight: 500; padding: 12px 16px; background: #f8f6f2; border-radius: 8px; }
    .notes-value { white-space: pre-wrap; line-height: 1.6; }
    .footer { background: #f8f6f2; padding: 24px 40px; text-align: center; border-top: 1px solid #ece9e3; }
    .footer p { color: #aaa; font-size: 12px; margin: 0; }
    .date-badge { display: inline-block; background: linear-gradient(135deg, #d4af37, #f0c040); color: #1a1a2e; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 18px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Lissie Marion Show Productions</h1>
      <p>New Booking Request</p>
    </div>
    <div class="body">
      <div class="alert">
        <p>⚠️ <strong>Action Required:</strong> A new booking request has been submitted. Please review and respond directly to the client.</p>
      </div>

      <div class="field">
        <label>Requested Date</label>
        <div class="value">
          <span class="date-badge">${formatEventDate(booking.eventDate)}</span>
        </div>
      </div>

      <div class="field">
        <label>Client Name</label>
        <div class="value">${escapeHtml(booking.name)}</div>
      </div>

      <div class="field">
        <label>Email Address</label>
        <div class="value"><a href="mailto:${escapeHtml(booking.email)}" style="color:#1a4fa0">${escapeHtml(booking.email)}</a></div>
      </div>

      ${booking.phone ? `
      <div class="field">
        <label>Phone Number</label>
        <div class="value">${escapeHtml(booking.phone)}</div>
      </div>
      ` : ''}

      <div class="field">
        <label>Event Details / Notes</label>
        <div class="value notes-value">${escapeHtml(booking.notes)}</div>
      </div>
    </div>
    <div class="footer">
      <p>This is a booking REQUEST only — no date has been confirmed.</p>
      <p style="margin-top:8px">Sent via Lissie Marion Booking System</p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Booking System" <${process.env.GMAIL_USER}>`,
    to: process.env.BOOKING_NOTIFICATION_EMAIL,
    replyTo: booking.email,
    subject: `📅 New Booking Request — ${formatEventDate(booking.eventDate)} — ${booking.name}`,
    html,
    text: `
NEW BOOKING REQUEST
===================
Date: ${formatEventDate(booking.eventDate)}
Name: ${booking.name}
Email: ${booking.email}
Phone: ${booking.phone || 'Not provided'}
Notes: ${booking.notes}

This is a request only — no date has been confirmed.
    `.trim(),
  });

  logger.info(`Booking notification sent for ${booking.eventDate} from ${booking.email}`);
}

// ─── Send Confirmation to Client ─────────────────────────────────────────────
export async function sendClientConfirmation(booking: BookingRequest): Promise<void> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background: #f8f6f2; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 40px; color: #333; line-height: 1.7; }
    .highlight { color: #1a1a2e; font-weight: 600; }
    .footer { background: #f8f6f2; padding: 24px 40px; text-align: center; border-top: 1px solid #ece9e3; }
    .footer p { color: #aaa; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Lissie Marion Show Productions</h1>
    </div>
    <div class="body">
      <p>Dear <span class="highlight">${escapeHtml(booking.name)}</span>,</p>
      <p>Thank you for submitting your booking request for <span class="highlight">${formatEventDate(booking.eventDate)}</span>.</p>
      <p>We have received your request and will review it shortly. Please note that <strong>this is not a confirmation</strong> — a member of our team will be in touch to confirm availability and discuss details.</p>
      <p>If you have any urgent questions, please reach out directly.</p>
      <p style="margin-top:32px">Warm regards,<br><strong>Lissie Marion Show Productions</strong></p>
    </div>
    <div class="footer">
      <p>You submitted a booking request for ${formatEventDate(booking.eventDate)}</p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Lissie Marion Show Productions" <${process.env.GMAIL_USER}>`,
    to: booking.email,
    subject: `Your Booking Request — ${formatEventDate(booking.eventDate)}`,
    html,
  });

  logger.info(`Client confirmation sent to ${booking.email}`);
}

// ─── Send Newsletter to Individual Client ─────────────────────────────────────
export async function sendNewsletterToClient(
  client: Client,
  calendarUrl: string
): Promise<void> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background: #f8f6f2; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 48px 40px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0 0 8px; font-size: 26px; letter-spacing: 3px; text-transform: uppercase; }
    .header p { color: #a0a8c0; margin: 0; font-size: 14px; letter-spacing: 1px; }
    .body { padding: 48px 40px; color: #444; line-height: 1.8; }
    .cta { text-align: center; margin: 40px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #d4af37, #f0c040); color: #1a1a2e; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; }
    .divider { border: none; border-top: 1px solid #ece9e3; margin: 32px 0; }
    .footer { background: #f8f6f2; padding: 24px 40px; text-align: center; border-top: 1px solid #ece9e3; }
    .footer p { color: #aaa; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Lissie Marion</h1>
      <p>Show Productions — Availability Update</p>
    </div>
    <div class="body">
      <p>Dear ${escapeHtml(client.name)},</p>
      <p>I wanted to reach out personally to share my latest availability. Whether you're planning an upcoming event, celebration, or production, I'd love to be a part of it.</p>
      <p>Click the button below to view my real-time booking calendar and request your preferred date:</p>

      <div class="cta">
        <a href="${calendarUrl}">View My Availability →</a>
      </div>

      <hr class="divider">

      <p>Dates are updated in real time — green days are available, red days are booked. Simply click any available date to submit a request and our team will follow up promptly.</p>
      <p>Looking forward to working with you.</p>
      <p style="margin-top:32px">With appreciation,<br><strong>Derrick Mackey</strong><br>Lissie Marion Show Productions</p>
    </div>
    <div class="footer">
      <p>You are receiving this because you are a valued client of Lissie Marion Show Productions.</p>
      <p>© ${new Date().getFullYear()} Lissie Marion Show Productions. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"Derrick Mackey — Lissie Marion" <${process.env.GMAIL_USER}>`,
    to: client.email,
    subject: `My Latest Availability — ${getMonthYear()}`,
    html,
  });

  logger.info(`Newsletter sent to ${client.email} (${client.name})`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getMonthYear(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

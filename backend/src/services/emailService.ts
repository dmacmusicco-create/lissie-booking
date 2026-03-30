import { Resend } from 'resend';

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

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export async function sendBookingNotification(booking: BookingRequest): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: process.env.BOOKING_NOTIFICATION_EMAIL!,
    replyTo: booking.email,
    subject: `New Booking Request — ${formatEventDate(booking.eventDate)} — ${booking.name}`,
    html: `
      <h2>New Booking Request</h2>
      <p><strong>Date:</strong> ${formatEventDate(booking.eventDate)}</p>
      <p><strong>Name:</strong> ${booking.name}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Phone:</strong> ${booking.phone || 'Not provided'}</p>
      <p><strong>Notes:</strong> ${booking.notes}</p>
      <p><em>This is a request only — not a confirmation.</em></p>
    `,
  });
}

export async function sendClientConfirmation(booking: BookingRequest): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: booking.email,
    subject: `Your Booking Request — ${formatEventDate(booking.eventDate)}`,
    html: `
      <p>Dear ${booking.name},</p>
      <p>Thank you for your booking request for <strong>${formatEventDate(booking.eventDate)}</strong>.</p>
      <p>We have received your request and will be in touch shortly. This is <strong>not a confirmation</strong>.</p>
      <p>Warm regards,<br>Derrick Mackey<br>Audio Engineer · Lissie Marion Show Productions</p>
    `,
  });
}

export async function sendNewsletterToClient(client: Client, calendarUrl: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: client.email,
    subject: `My Latest Availability`,
    html: `
      <p>Dear ${client.name},</p>
      <p>I wanted to share my latest availability with you.</p>
      <p><a href="${calendarUrl}">View My Booking Calendar</a></p>
      <p>Green days are available — simply click to request your date.</p>
      <p>Warm regards,<br>Derrick Mackey<br>Audio Engineer · Lissie Marion Show Productions</p>
    `,
  });
}

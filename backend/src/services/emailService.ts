import { Resend } from 'resend';

export interface BookingRequest {
  name: string;
  email: string;
  phone?: string;
  eventDate: string;
  notes: string;
  website?: string;
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

function formatSingleDate(dateStr: string): string {
  return new Date(dateStr.trim() + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatEventDates(eventDate: string): string {
  const dates = eventDate.split(',').map(d => d.trim()).sort();

  if (dates.length === 1) {
    return formatSingleDate(dates[0]);
  }

  // Check if dates are consecutive
  const isConsecutive = dates.every((date, i) => {
    if (i === 0) return true;
    const prev = new Date(dates[i - 1] + 'T12:00:00');
    const curr = new Date(date + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    return diff === 1;
  });

  if (isConsecutive) {
    // Show as a range: Monday, April 6 through Friday, April 10, 2026
    const first = formatSingleDate(dates[0]);
    const last = formatSingleDate(dates[dates.length - 1]);
    return `${first} through ${last}`;
  }

  // Non-consecutive — list each date separately
  return dates.map(d => formatSingleDate(d)).join(', ');
}

function formatSubjectDates(eventDate: string): string {
  const dates = eventDate.split(',').map(d => d.trim()).sort();
  if (dates.length === 1) {
    return formatSingleDate(dates[0]);
  }
  const isConsecutive = dates.every((date, i) => {
    if (i === 0) return true;
    const prev = new Date(dates[i - 1] + 'T12:00:00');
    const curr = new Date(date + 'T12:00:00');
    return (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1;
  });
  if (isConsecutive) {
    const first = new Date(dates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const last = new Date(dates[dates.length - 1] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${first}–${last}`;
  }
  return dates.length + ' dates';
}

export async function sendBookingNotification(booking: BookingRequest): Promise<void> {
  const resend = getResend();
  const formattedDates = formatEventDates(booking.eventDate);
  const subjectDates = formatSubjectDates(booking.eventDate);
  const dates = booking.eventDate.split(',').map(d => d.trim()).sort();
  const isMultiple = dates.length > 1;

  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: process.env.BOOKING_NOTIFICATION_EMAIL!,
    replyTo: booking.email,
    subject: `New Booking Request — ${subjectDates} — ${booking.name}`,
    html: `
      <h2>New Booking Request</h2>
      <p><strong>${isMultiple ? 'Dates Requested' : 'Date Requested'}:</strong> ${formattedDates}</p>
      ${isMultiple ? `<p><strong>Number of Days:</strong> ${dates.length}</p>` : ''}
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
  const formattedDates = formatEventDates(booking.eventDate);
  const subjectDates = formatSubjectDates(booking.eventDate);
  const dates = booking.eventDate.split(',').map(d => d.trim()).sort();
  const isMultiple = dates.length > 1;

  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: booking.email,
    subject: `Your Booking Request — ${subjectDates}`,
    html: `
      <p>Dear ${booking.name},</p>
      <p>Thank you for your booking request for <strong>${formattedDates}</strong>${isMultiple ? ` (${dates.length} days)` : ''}.</p>
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
    subject: `Derrick Mackey's Availability`,
    html: `
      <p>Dear ${client.name},</p>
      <p>I wanted to share my latest availability with you.</p>
      <p><a href="${calendarUrl}">View My Booking Calendar</a></p>
      <p>Green days are available — simply click or tap to select a single day or multiple days, then submit your request in seconds.</p>
      <p><strong>Pro tip:</strong> Save this link to your phone! Copy <strong>https://booking.derrickmackey.com</strong> and add it to my contact card on your device. Next time you need to book me, just open my contact, tap the link, and instantly see my availability.</p>
      <p>Warm regards,<br>Derrick Mackey<br>Audio Engineer · Lissie Marion Show Productions</p>
    `,
  });
}

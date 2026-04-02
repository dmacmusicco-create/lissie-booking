import { Resend } from 'resend';

export interface BookingRequest {
  name: string;
  email: string;
  phone?: string;
  eventDate: string;
  notes: string;
  website?: string;
  fileLink?: string;
  attachments?: Express.Multer.File[];
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

function groupConsecutiveDates(dates: string[]): string[][] {
  const sorted = [...dates].sort();
  const groups: string[][] = [];
  let current: string[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current.push(sorted[i]);
    } else {
      groups.push(current);
      current = [sorted[i]];
    }
  }
  groups.push(current);
  return groups;
}

function formatGroups(groups: string[][]): string {
  return groups.map(group => {
    if (group.length === 1) return formatSingleDate(group[0]);
    return formatSingleDate(group[0]) + ' through ' + formatSingleDate(group[group.length - 1]);
  }).join(', and ');
}

function formatSubjectGroups(groups: string[][]): string {
  if (groups.length === 1 && groups[0].length === 1) return formatSingleDate(groups[0][0]);
  return groups.map(group => {
    if (group.length === 1) {
      return new Date(group[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    const first = new Date(group[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const last = new Date(group[group.length - 1] + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${first}–${last}`;
  }).join(', ');
}

export async function sendBookingNotification(booking: BookingRequest): Promise<void> {
  const resend = getResend();
  const dates = booking.eventDate.split(',').map(d => d.trim()).filter(Boolean);
  const groups = groupConsecutiveDates(dates);
  const formattedDates = formatGroups(groups);
  const subjectDates = formatSubjectGroups(groups);
  const isMultiple = dates.length > 1;

  const attachments = (booking.attachments || []).map(file => ({
    filename: file.originalname,
    content: file.buffer,
  }));

  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: process.env.BOOKING_NOTIFICATION_EMAIL!,
    replyTo: booking.email,
    subject: `New Booking Request — ${subjectDates} — ${booking.name}`,
    attachments,
    html: `
      <h2>New Booking Request</h2>
      <p><strong>${isMultiple ? 'Dates Requested' : 'Date Requested'}:</strong> ${formattedDates}</p>
      ${isMultiple ? `<p><strong>Total Days:</strong> ${dates.length}</p>` : ''}
      <p><strong>Name:</strong> ${booking.name}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Phone:</strong> ${booking.phone || 'Not provided'}</p>
      <p><strong>Notes:</strong> ${booking.notes}</p>
      ${booking.fileLink ? `<p><strong>File Link:</strong> <a href="${booking.fileLink}">${booking.fileLink}</a></p>` : ''}
      ${attachments.length > 0 ? `<p><strong>Attachments:</strong> ${attachments.map(a => a.filename).join(', ')}</p>` : ''}
      <p><em>This is a request only — not a confirmation.</em></p>
    `,
  });
}

export async function sendClientConfirmation(booking: BookingRequest): Promise<void> {
  const resend = getResend();
  const dates = booking.eventDate.split(',').map(d => d.trim()).filter(Boolean);
  const groups = groupConsecutiveDates(dates);
  const formattedDates = formatGroups(groups);
  const subjectDates = formatSubjectGroups(groups);
  const isMultiple = dates.length > 1;

  await resend.emails.send({
    from: 'Derrick Mackey <booking@derrickmackey.com>',
    to: booking.email,
    subject: `Your Booking Request — ${subjectDates}`,
    html: `
      <p>Dear ${booking.name},</p>
      <p>Thank you for your booking request for <strong>${formattedDates}</strong>${isMultiple ? ` (${dates.length} days total)` : ''}.</p>
      ${booking.fileLink ? `<p>Your file link has been received: <a href="${booking.fileLink}">${booking.fileLink}</a></p>` : ''}
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

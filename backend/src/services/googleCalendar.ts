import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface DayAvailability {
  date: string; // YYYY-MM-DD
  available: boolean;
  events: EventSummary[];
}

export interface EventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
}

interface CacheEntry {
  data: DayAvailability[];
  timestamp: number;
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
let cache: CacheEntry | null = null;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_MS || '120000'); // 2 min default

// ─── OAuth2 Client ───────────────────────────────────────────────────────────
export function getOAuth2Client(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
  }

  return client;
}

// ─── Generate Auth URL (first-time setup) ────────────────────────────────────
export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
    prompt: 'consent',
  });
}

// ─── Exchange code for tokens ────────────────────────────────────────────────
export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// ─── Fetch Availability ──────────────────────────────────────────────────────
export async function fetchAvailability(days: number = 90): Promise<DayAvailability[]> {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL && cache.data.length >= days) {
    return cache.data.slice(0, days);
  }

  logger.info('Fetching fresh calendar data from Google...');

  try {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    // Fetch events from primary calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500,
    });

    const events = response.data.items || [];

   

    // Build day-by-day availability map
    const availability: DayAvailability[] = [];

    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const dateStr = formatDate(day);

      // Check if any busy slot overlaps this day
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const isBusy = dayEvents.length > 0;
      // Get events for this specific day
      const dayEvents: EventSummary[] = events
        .filter(event => {
          const eventStart = event.start?.dateTime || event.start?.date;
          if (!eventStart) return false;
          const eventDate = new Date(eventStart);
          return formatDate(eventDate) === dateStr || isAllDayEventOnDate(event, dateStr);
        })
        .map(event => ({
          id: event.id || '',
          summary: event.summary || 'Busy',
          start: event.start?.dateTime || event.start?.date || '',
          end: event.end?.dateTime || event.end?.date || '',
          allDay: !event.start?.dateTime,
        }));

      availability.push({
        date: dateStr,
        available: !isBusy,
        events: dayEvents,
      });
    }

    // Update cache
    cache = { data: availability, timestamp: Date.now() };
    logger.info(`Fetched ${availability.length} days of availability`);

    return availability;
  } catch (error) {
    logger.error('Failed to fetch Google Calendar data:', error);

    // Return stale cache if available
    if (cache) {
      logger.warn('Returning stale cache due to API error');
      return cache.data;
    }

    throw error;
  }
}

// ─── Manually block a date ───────────────────────────────────────────────────
export async function blockDate(date: string, reason: string = 'Blocked'): Promise<void> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `[BLOCKED] ${reason}`,
      start: { date },
      end: { date: getNextDay(date) },
      description: 'Manually blocked via booking system admin',
    },
  });

  // Invalidate cache
  cache = null;
  logger.info(`Blocked date: ${date}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

function isAllDayEventOnDate(event: any, dateStr: string): boolean {
  if (!event.start?.date) return false;
  const eventStart = event.start.date;
  const eventEnd = event.end?.date || event.start.date;
  return dateStr >= eventStart && dateStr < eventEnd;
}

export function invalidateCache(): void {
  cache = null;
  logger.info('Calendar cache invalidated');
}



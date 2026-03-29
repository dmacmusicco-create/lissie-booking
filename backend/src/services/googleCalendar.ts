import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../lib/logger';

export interface DayAvailability {
  date: string;
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

let cache: CacheEntry | null = null;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_MS || '120000');
const TIMEZONE = 'America/Chicago';

// ─── Work Client Keywords ─────────────────────────────────────────────────────
// Only events containing these keywords will mark a day as Booked
const WORK_KEYWORDS = [
  'alliant',
  'audio visual one',
  'av leads',
  'avent techs',
  'avts',
  'bytegraph',
  'christian house of prayer',
  'cornerstone',
  'crewtex',
  'dhsystems',
  'dwayne',
  'evanta',
  'event eq',
  'freeman',
  'funknug',
  'genesis av',
  'grit productions',
  'imprint group',
  'inspire',
  'jfdi',
  'jsav',
  'lmg technical services',
  'manor hill',
  'mark mccarroll',
  'mertz productions',
  'murray media',
  'op team',
  'panavid',
  'parker university',
  'pearson technology',
  'perfect sound',
  'pmsiav',
  'precision productions',
  'prg',
  'projection',
  'revolution event',
  'rocket man media',
  'select media resources',
  'showmasters',
  'sightline productions',
  'simple science',
  'soul purpose',
  'soundorama',
  'spygoat',
  'talent crewing',
  'tbaal',
  'tcg',
  'ten eighty media',
  'tse',
  '[blocked]',
];

function isWorkEvent(summary: string): boolean {
  const lower = summary.toLowerCase();
  return WORK_KEYWORDS.some(keyword => lower.includes(keyword));
}

export function getOAuth2Client(): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  }
  return client;
}

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

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

function formatDateCT(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function getTodayCT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function getEventDateCT(dateTimeStr: string): string {
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

export async function fetchAvailability(days: number = 60): Promise<DayAvailability[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL && cache.data.length >= days) {
    return cache.data.slice(0, days);
  }

  logger.info('Fetching fresh calendar data from Google...');

  try {
    const auth = getOAuth2Client();
    const calendyEventOnDate(event: any, dateStr: string): boolean {
  if (!event.start?.date) return false;
  const eventStart = event.start.date;
  const eventEnd = event.end?.date || event.start.date;
  return dateStr >= eventStart && dateStr < eventEnd;
}

export function invalidateCache(): void {
  cache = null;
  logger.info('Calendar cache invalidated');
}

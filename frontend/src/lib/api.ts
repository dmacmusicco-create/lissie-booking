const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface DayAvailability {
  date: string;
  available: boolean;
  events: {
    id: string;
    summary: string;
    start: string;
    end: string;
    allDay: boolean;
  }[];
}

export interface BookingPayload {
  name: string;
  email: string;
  phone?: string;
  eventDate: string;
  notes: string;
  website?: string; // honeypot
}

export async function fetchAvailability(days: number = 60): Promise<DayAvailability[]> {
  const res = await fetch(`${API_BASE}/api/calendar/availability?days=${days}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch availability');
  const json = await res.json();
  return json.data;
}

export async function submitBookingRequest(payload: BookingPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/booking/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.errors?.[0] || 'Submission failed');
  }
}

export async function adminFetch(path: string, options: RequestInit = {}) {
  const secret = typeof window !== 'undefined' ? localStorage.getItem('admin_secret') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret || '',
      ...options.headers,
    },
  });
  return res.json();
}



'use client';
import { useMemo, useState, useRef } from 'react';
import { DayAvailability } from '@/lib/api';
import DayCard from './DayCard';

interface CalendarGridProps {
  availability: DayAvailability[];
  loading: boolean;
  onDayClick: (date: string, available: boolean) => void;
  onRangeSelect: (dates: string[]) => void;
  daysToShow: number;
}

interface MonthGroup {
  label: string;
  days: DayAvailability[];
}

function groupByMonth(days: DayAvailability[]): MonthGroup[] {
  const groups: Record<string, DayAvailability[]> = {};
  for (const day of days) {
    const d = new Date(day.date + 'T12:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(day);
  }
  return Object.entries(groups).map(([label, days]) => ({ label, days }));
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ availability, loading, onDayClick, onRangeSelect }: CalendarGridProps) {
  const months = useMemo(() => groupByMonth(availability), [availability]);
  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDayTap = (date: string, available: boolean) => {
    if (!available || date < today) return;
    setSelected(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      }
      return [...prev, date];
    });
  };

  const handleRequest = () => {
    if (selected.length === 1) {
      onDayClick(selected[0], true);
    } else if (selected.length > 1) {
      onRangeSelect(selected.sort());
    }
    setSelected([]);
  };

  const clearSelection = () => setSelected([]);

  if (loading) {
    return (
      <div className="space-y-10">
        {[0, 1].map(i => (
          <div key={i}>
            <div className="shimmer h-6 w-40 rounded mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: 35 }).map((_, j) => (
                <div key={j} className="shimmer rounded-xl" style={{ paddingBottom: '100%', background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-10" style={{ userSelect: 'none' }}>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginBottom: -24 }}>
        💡 Tap or click days to select them, then tap <strong>Request</strong>
      </div>

      {months.map(({ label, days }) => {
        const firstDay = new Date(days[0].date + 'T12:00:00');
        const offset = firstDay.getDay();
        return (
          <div key={label}>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#d4af37', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: 8 }}
            >
              {label}
            </h3>
            <div className="grid mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#6b7280', letterSpacing: '0.5px' }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day, idx) => (
                <DayCard
                  key={day.date}
                  day={day}
                  isToday={day.date === today}
                  isPast={day.date < today}
                  isSelected={selected.includes(day.date)}
                  onClick={() => handleDayTap(day.date, day.available)}
                  style={{ animationDelay: `${(idx % 30) * 15}ms` }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {selected.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            onClick={clearSelection}
            style={{
              padding: '12px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#a0a8c0',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
          <button
            onClick={handleRequest}
            style={{
              padding: '14px 28px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #d4af37, #f0c040)',
              border: 'none',
              color: '#1a1a2e',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
            }}
          >
            Request {selected.length} Day{selected.length > 1 ? 's' : ''} →
          </button>
        </div>
      )}
    </div>
  );
}

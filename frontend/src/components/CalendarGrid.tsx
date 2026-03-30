'use client';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDates = useMemo(() => {
    if (!dragStart || !dragEnd) return [];
    const start = dragStart < dragEnd ? dragStart : dragEnd;
    const end = dragStart < dragEnd ? dragEnd : dragStart;
    return availability
      .filter(d => d.date >= start && d.date <= end && d.available && d.date >= today)
      .map(d => d.date);
  }, [dragStart, dragEnd, availability, today]);

  const finishDrag = useCallback(() => {
    if (isDragging && selectedDates.length > 1) {
      onRangeSelect(selectedDates);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, selectedDates, onRangeSelect]);

  useEffect(() => {
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('touchend', finishDrag);
    return () => {
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('touchend', finishDrag);
    };
  }, [finishDrag]);

  // Handle touch move — find which day card the finger is over
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el) {
      const card = el.closest('[data-date]') as HTMLElement;
      if (card && card.dataset.date) {
        const date = card.dataset.date;
        const day = availability.find(d => d.date === date);
        if (day && day.available && date >= today) {
          setDragEnd(date);
        }
      }
    }
  }, [isDragging, availability, today]);

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
    <div
      ref={containerRef}
      className="space-y-10"
      style={{ userSelect: 'none', touchAction: isDragging ? 'none' : 'auto' }}
      onTouchMove={handleTouchMove}
    >
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginBottom: -24 }}>
        💡 Click a single day or <strong>tap and drag</strong> to select multiple days
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
                  isSelected={selectedDates.includes(day.date)}
                  data-date={day.date}
                  onMouseDown={() => {
                    if (day.available && day.date >= today) {
                      setDragStart(day.date);
                      setDragEnd(day.date);
                      setIsDragging(true);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isDragging && day.available && day.date >= today) {
                      setDragEnd(day.date);
                    }
                  }}
                  onTouchStart={() => {
                    if (day.available && day.date >= today) {
                      setDragStart(day.date);
                      setDragEnd(day.date);
                      setIsDragging(true);
                    }
                  }}
                  onClick={() => {
                    if (!isDragging) {
                      onDayClick(day.date, day.available);
                    }
                  }}
                  style={{ animationDelay: `${(idx % 30) * 15}ms` }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

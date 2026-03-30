'use client';
import { CSSProperties } from 'react';
import { DayAvailability } from '@/lib/api';

interface DayCardProps {
  day: DayAvailability;
  isToday: boolean;
  isPast: boolean;
  onClick: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  isSelected?: boolean;
  style?: CSSProperties;
}

export default function DayCard({ day, isToday, isPast, onClick, onMouseDown, onMouseEnter, isSelected, style }: DayCardProps) {
  const dayNum = new Date(day.date + 'T12:00:00').getDate();

  const getCardStyle = (): CSSProperties => {
    if (isPast) {
      return {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'default',
        opacity: 0.5,
      };
    }
    if (isSelected && day.available) {
      return {
        background: 'linear-gradient(135deg, rgba(212,175,55,0.6), rgba(240,192,64,0.4))',
        border: '2px solid rgba(212,175,55,0.8)',
        cursor: 'pointer',
        transform: 'scale(1.05)',
      };
    }
    if (!day.available) {
      return {
        background: 'linear-gradient(135deg, rgba(127,29,29,0.8), rgba(153,27,27,0.6))',
        border: '1px solid rgba(248,113,113,0.2)',
        cursor: 'not-allowed',
      };
    }
    return {
      background: 'linear-gradient(135deg, rgba(20,83,45,0.9), rgba(22,101,52,0.7))',
      border: '1px solid rgba(74,222,128,0.3)',
      cursor: 'pointer',
    };
  };

  const getLabelStyle = (): CSSProperties => {
    if (isPast) return { color: '#6b7280', fontSize: 9 };
    if (isSelected && day.available) return { color: '#1a1a2e', fontSize: 9, fontWeight: 800 };
    if (!day.available) return { color: '#fca5a5', fontSize: 9 };
    return { color: '#86efac', fontSize: 9 };
  };

  const label = isPast ? '' : isSelected && day.available ? 'Selected' : day.available ? 'Available' : 'Booked';

  return (
    <div
      className="day-card relative rounded-xl overflow-hidden transition-all duration-200 group"
      style={{
        ...getCardStyle(),
        ...style,
        paddingBottom: '90%',
        position: 'relative',
        userSelect: 'none',
      }}
      onClick={!isPast && day.available ? onClick : undefined}
      onMouseDown={!isPast && day.available ? onMouseDown : undefined}
      onMouseEnter={!isPast && day.available ? onMouseEnter : undefined}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '8px 6px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {isToday && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 11,
              border: '2px solid #d4af37',
              pointerEvents: 'none',
            }}
          />
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: isToday ? 800 : 600,
            color: isPast ? '#4b5563' : isSelected && day.available ? '#1a1a2e' : isToday ? '#d4af37' : day.available ? '#dcfce7' : '#fecaca',
            lineHeight: 1,
          }}
        >
          {dayNum}
        </span>
        <span
          className="uppercase tracking-wide font-semibold text-center leading-tight"
          style={{ ...getLabelStyle(), letterSpacing: '0.5px' }}
        >
          {label}
        </span>
        {!isPast && day.available && !isSelected && (
          <div
            className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 11 }}
          >
            <span
              style={{
                fontSize: 8,
                background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                color: '#1a1a2e',
                padding: '2px 6px',
                borderRadius: 8,
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Request →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

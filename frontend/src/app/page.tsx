'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import CalendarGrid from '@/components/CalendarGrid';
import BookingModal from '@/components/BookingModal';
import Legend from '@/components/Legend';
import AdminPanel from '@/components/AdminPanel';
import { fetchAvailability, DayAvailability } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default function HomePage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daysToShow, setDaysToShow] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const loadAvailability = useCallback(async (days: number, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await fetchAvailability(days);
      setAvailability(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to load calendar. Please refresh the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAvailability(daysToShow);
  }, [daysToShow, loadAvailability]);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      loadAvailability(daysToShow, true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [daysToShow, loadAvailability]);

  const handleDayClick = (date: string, available: boolean) => {
    if (available) setSelectedDate(date);
  };

  const handleShowMore = () => setDaysToShow(prev => prev + 60);
  const handleShowLess = () => setDaysToShow(60);

  // Secret admin trigger: click logo 5 times
  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    setLogoClicks(n => {
      if (n + 1 >= 5) { setShowAdmin(true); return 0; }
      return n + 1;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Header onLogoClick={handleLogoClick} />

      <main className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'Georgia, serif', color: '#d4af37' }}
            >
              Booking Availability
            </h2>
            <p className="text-sm" style={{ color: '#a0a8c0' }}>
              Showing next {daysToShow} days · Updates every 2 minutes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs hidden sm:block" style={{ color: '#6b7280' }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => loadAvailability(daysToShow, true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#d4af37',
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <Legend />

        {error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => loadAvailability(daysToShow)}
              className="px-6 py-3 rounded-xl font-medium"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <CalendarGrid
              availability={availability}
              loading={loading}
              onDayClick={handleDayClick}
              daysToShow={daysToShow}
            />

            <div className="flex justify-center gap-4 mt-10">
              {daysToShow > 60 && (
                <button
                  onClick={handleShowLess}
                  className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#a0a8c0', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Show Less
                </button>
              )}
              <button
                onClick={handleShowMore}
                className="px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(240,192,64,0.1))',
                  color: '#d4af37',
                  border: '1px solid rgba(212,175,55,0.4)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(240,192,64,0.2))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(240,192,64,0.1))')}
              >
                Show More Dates →
              </button>
            </div>
          </>
        )}
      </main>

      {selectedDate && (
        <BookingModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}


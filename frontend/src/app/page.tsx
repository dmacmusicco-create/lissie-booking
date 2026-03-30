'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import CalendarGrid from '@/components/CalendarGrid';
import BookingModal from '@/components/BookingModal';
import Legend from '@/components/Legend';
import AdminPanel from '@/components/AdminPanel';
import { fetchAvailability, DayAvailability } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 2 * 60 * 1000;

export default function HomePage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
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

  useEffect(() => {
    loadAvailability(daysToShow);
  }, [daysToShow, loadAvailability]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAvailability(daysToShow, true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [daysToShow, loadAvailability]);

  const handleDayClick = (date: string, available: boolean) => {
    if (available) {
      setSelectedDates([]);
      setSelectedDate(date);
    }
  };

  const handleRangeSelect = (dates: string[]) => {
    if (dates.length === 1) {
      setSelectedDates([]);
      setSelectedDate(dates[0]);
    } else if (dates.length > 1) {
      setSelectedDate(null);
      setSelectedDates(dates);
    }
  };

  const handleShowMore = () => setDaysToShow(prev => prev + 60);
  const handleShowLess = () => setDaysToShow(60);

  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    setLogoClicks(n => {
      if (n + 1 >= 5) { setShowAdmin(true); return 0; }
      return n + 1;
    });
  };

  const showModal = selectedDate !== null || selectedDates.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
      <Header onLogoClick={handleLogoClick} />

      <main className="max-w-6xl mx-auto px-4 py-8 pb-20">
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

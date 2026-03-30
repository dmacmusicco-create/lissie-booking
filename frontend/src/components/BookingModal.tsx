'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Mail, Phone, FileText, Loader2 } from 'lucide-react';
import { submitBookingRequest } from '@/lib/api';

interface BookingModalProps {
  date: string;
  dates?: string[];
  onClose: () => void;
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 1) return formatDisplayDate(dates[0]);
  const sorted = [...dates].sort();
  const first = formatDisplayDate(sorted[0]);
  const last = formatDisplayDate(sorted[sorted.length - 1]);
  return first + ' to ' + last + ' (' + dates.length + ' days)';
}

export default function BookingModal({ date, dates, onClose }: BookingModalProps) {
  const selectedDates = dates && dates.length > 0 ? dates : [date];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !notes.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (notes.trim().length < 10) {
      setErrorMsg('Please provide more detail in the notes field.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await submitBookingRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        eventDate: selectedDates.sort().join(', '),
        notes: notes.trim(),
        website: website,
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#f5f0e8',
    fontSize: 14,
    outline: 'none',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#a0a8c0',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #1e2340 0%, #16213e 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            borderBottom: '1px solid rgba(212,175,55,0.2)',
            padding: '24px 28px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 20,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 6,
              }}
            >
              {selectedDates.length > 1 ? 'Request ' + selectedDates.length + ' Days' : 'Request Booking'}
            </h2>
            <div style={{ color: '#86efac', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />
              {formatDateRange(selectedDates)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.1)',
                border: '2px solid rgba(74,222,128,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
              }}
            >
              ✓
            </div>
            <h3 sty

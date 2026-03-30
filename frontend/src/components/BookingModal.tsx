'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Mail, Phone, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
  return `${first} — ${last} (${dates.length} days)`;
}

export default function BookingModal({ date, dates, onClose }: BookingModalProps) {
  const selectedDates = dates && dates.length > 0 ? dates : [date];
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.notes.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (form.notes.trim().length < 10) {
      toast.error('Please provide more detail in the notes field.');
      return;
    }

    setLoading(true);
    try {
      await submitBookingRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        eventDate: selectedDates.sort().join(', '),
        notes: form.notes.trim(),
        website: form.website,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
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
        {/* Header */}
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
              {selectedDates.length > 1 ? `Request ${selectedDates.length} Days` : 'Request Booking'}
            </h2>
            <div className="flex items-center gap-2" style={{ color: '#86efac', fontSize: 13 }}>
              <Calendar size={13} />
              {formatDateRange(selectedDates)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors"
            style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4af37')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
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
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#4ade80', marginBottom: 12 }}>
              Request Sent!
            </h3>
            <p style={{ color: '#a0a8c0', lineHeight: 1.7, marginBottom: 8 }}>
              Your request for <strong style={{ color: '#d4af37' }}>{formatDateRange(selectedDates)}</strong> has been received.
            </p>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
              We'll be in touch at <strong style={{ color: '#a0a8c0' }}>{form.email}</strong> shortly.
              Please note this is not a confirmation.
            </p>
            <button
              onClick={onClose}
              className="mt-8 px-8 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#1a1a2e' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: '28px' }}>
            <p style={{ color: '#a0a8c0', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              {selectedDates.length > 1
                ? `You've selected ${selectedDates.length} days. Fill out the form below and we'll review your request.`
                : "Fill out the form below and our team will review your request. This does not confirm the date."}
            </p>

            <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <Field
                icon={<User size={15} />}
                label="Full Name *"
                placeholder="Your name"
                value={form.name}
                onChange={v => setForm(f => ({ ...f, name: v }))}
              />
              <Field
                icon={<Mail size={15} />}
                label="Email Address *"
                placeholder="your@email.com"
                type="email"
                value={form.email}
                onChange={v => setForm(f => ({ ...f, email: v }))}
              />
              <Field
                icon={<Phone size={15} />}
                label="Phone Number (optional)"
                placeholder="+1 (555) 000-0000"
                type="tel"
                value={form.phone}
                onChange={v => setForm(f => ({ ...f, phone: v }))}
              />
              <Field
                icon={<Calendar size={15} />}
                label={selectedDates.length > 1 ? `Selected Dates (${selectedDates.length})` : 'Event Date'}
                value={formatDateRange(selectedDates)}
                disabled
              />

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#a0a8c0',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: '#d4af37' }}><FileText size={15} /></span>
                  Event Details / Notes *
                </label>
                <textarea
                  placeholder="Tell us about your event — type of show, venue, expected attendance, any special requirements..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={5}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#f5f0e8',
                    fontSize: 14,
                    fontFamily: 'Georgia, serif',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  {form.notes.length} / 2000
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg, #d4af37, #f0c040)',
                color: '#1a1a2e',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 15,
                letterSpacing: '0.5px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Sending Request...</>
              ) : (
                `Send Booking Request${selectedDates.length > 1 ? ` for ${selectedDates.length} Days` : ''} →`
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', marginTop: 12 }}>
              Your date is <em>not</em> reserved until confirmed by our team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  icon, label, placeholder, value, onChange, type = 'text', disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#a0a8c0',
          letterSpacing:

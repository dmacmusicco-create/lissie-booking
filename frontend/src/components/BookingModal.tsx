'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Mail, Phone, FileText, Loader2, Paperclip, Link } from 'lucide-react';
import { submitBookingRequest } from '@/lib/api';

interface BookingModalProps {
  date: string;
  dates?: string[];
  onClose: () => void;
}

function formatSingleDate(dateStr: string): string {
  return new Date(dateStr.trim() + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function groupConsecutiveDates(dates: string[]): string[][] {
  const sorted = [...dates].sort();
  const groups: string[][] = [];
  let current: string[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const curr = new Date(sorted[i] + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current.push(sorted[i]);
    } else {
      groups.push(current);
      current = [sorted[i]];
    }
  }
  groups.push(current);
  return groups;
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 1) return formatSingleDate(dates[0]);
  const groups = groupConsecutiveDates(dates);
  return groups.map(group => {
    if (group.length === 1) return formatSingleDate(group[0]);
    return formatSingleDate(group[0]) + ' through ' + formatSingleDate(group[group.length - 1]);
  }).join(', and ');
}

export default function BookingModal({ date, dates, onClose }: BookingModalProps) {
  const selectedDates = dates && dates.length > 0 ? dates : [date];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [fileLink, setFileLink] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(f => f.size <= maxSize);
    if (validFiles.length < files.length) {
      setErrorMsg('Some files were too large (max 10MB each) and were not added.');
    }
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !notes.trim()) { setErrorMsg('Please fill in all required fields.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErrorMsg('Please enter a valid email address.'); return; }
    if (notes.trim().length < 10) { setErrorMsg('Please provide more detail in the notes field.'); return; }
    setErrorMsg('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('eventDate', selectedDates.sort().join(', '));
      formData.append('notes', notes.trim());
      formData.append('fileLink', fileLink.trim());
      formData.append('website', website);
      attachments.forEach(file => formData.append('attachments', file));

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_BASE}/api/booking/request`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send');
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px', color: '#f5f0e8', fontSize: 14, outline: 'none' };
  const lStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a0a8c0', letterSpacing: '0.5px', textTransform: 'uppercase' as const, marginBottom: 8 };
  const gold = { color: '#d4af37' };

  const formattedDates = formatDateRange(selectedDates);
  const totalDays = selectedDates.length;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
        <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(180deg, #1e2340 0%, #16213e 100%)', border: '1px solid rgba(212,175,55,0.25)', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#4ade80', marginBottom: 12 }}>Request Sent!</h3>
          <p style={{ color: '#a0a8c0', lineHeight: 1.7, marginBottom: 8 }}>
            Your request for <strong style={gold}>{formattedDates}</strong>{totalDays > 1 ? ` (${totalDays} days)` : ''} has been received.
          </p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>We will be in touch at <strong style={{ color: '#a0a8c0' }}>{email}</strong> shortly. This is not a confirmation.</p>
          <button onClick={onClose} style={{ marginTop: 32, padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#1a1a2e', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={modalRef} className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, #1e2340 0%, #16213e 100%)', border: '1px solid rgba(212,175,55,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '24px 28px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg, #d4af37, #f0c040)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6 }}>
              {totalDays > 1 ? `Request ${totalDays} Days` : 'Request Booking'}
            </h2>
            <div style={{ color: '#86efac', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />{formattedDates}
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 28 }}>
          <p style={{ color: '#a0a8c0', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            {totalDays > 1 ? `You have selected ${totalDays} days. Fill out the form below and we will review your request.` : 'Fill out the form below. This does not confirm the date.'}
          </p>

          <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
            <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
          </div>

          {errorMsg && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{errorMsg}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lStyle}><span style={gold}><User size={15} /></span>Full Name *</label>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label style={lStyle}><span style={gold}><Mail size={15} /></span>Email Address *</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label style={lStyle}><span style={gold}><Phone size={15} /></span>Phone Number (optional)</label>
              <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label style={lStyle}><span style={gold}><Calendar size={15} /></span>{totalDays > 1 ? `Selected Dates (${totalDays})` : 'Event Date'}</label>
              <input type="text" value={formattedDates} disabled style={{ ...iStyle, background: 'rgba(255,255,255,0.03)', color: '#6b7280', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={lStyle}><span style={gold}><FileText size={15} /></span>Event Details / Notes *</label>
              <textarea placeholder="Tell us about your event..." value={notes} onChange={e => setNotes(e.target.value)} rows={5} style={{ ...iStyle, resize: 'vertical', lineHeight: 1.6 }} />
              <div style={{ textAlign: 'right', fontSize: 11, color: '#6b7280', marginTop: 4 }}>{notes.length} / 2000</div>
            </div>

            {/* File attachment */}
            <div>
              <label style={lStyle}><span style={gold}><Paperclip size={15} /></span>Attach Files (optional, max 10MB each)</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  color: '#a0a8c0',
                  fontSize: 13,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Paperclip size={15} style={gold} />
                Click to attach files
              </button>
              {attachments.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachments.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: '#d4af37' }}>📎 {file.name} ({(file.size / 1024).toFixed(0)}KB)</span>
                      <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File link */}
            <div>
              <label style={lStyle}><span style={gold}><Link size={15} /></span>Or paste a file link (optional)</label>
              <input
                type="url"
                placeholder="Google Drive, iCloud, OneDrive, Dropbox..."
                value={fileLink}
                onChange={e => setFileLink(e.target.value)}
                style={iStyle}
              />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: 24, padding: 16, borderRadius: 12, background: loading ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#1a1a2e', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Loader2 size={16} />Sending...</> : 'Send Booking Request' + (totalDays > 1 ? ` for ${totalDays} Days` : '') + ' →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', marginTop: 12 }}>Your date is not reserved until confirmed by our team.</p>
        </div>
      </div>
    </div>
  );
}

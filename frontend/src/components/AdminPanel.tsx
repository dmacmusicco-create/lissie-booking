'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Lock, Send, CalendarOff, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/api';

interface AdminPanelProps {
  onClose: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
  active: boolean;
  addedAt: string;
}

type Tab = 'clients' | 'block' | 'newsletter';

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '' });
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const handleAuth = async () => {
    localStorage.setItem('admin_secret', secret);
    const result = await adminFetch('/api/admin/stats');
    if (result.success) {
      setAuthenticated(true);
      setStats(result.data);
    } else {
      toast.error('Invalid admin secret');
      localStorage.removeItem('admin_secret');
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    const result = await adminFetch('/api/admin/clients');
    if (result.success) setClients(result.data);
    setLoadingClients(false);
  };

  useEffect(() => {
    if (authenticated && tab === 'clients') loadClients();
  }, [authenticated, tab]);

  const addClient = async () => {
    if (!newClient.name || !newClient.email) { toast.error('Name and email required'); return; }
    const result = await adminFetch('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(newClient),
    });
    if (result.success) {
      toast.success('Client added!');
      setNewClient({ name: '', email: '' });
      loadClients();
    } else {
      toast.error(result.error || 'Failed to add client');
    }
  };

  const toggleClient = async (client: Client) => {
    await adminFetch(`/api/admin/clients/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !client.active }),
    });
    loadClients();
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await adminFetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
    toast.success('Client removed');
    loadClients();
  };

  const handleBlockDate = async () => {
    if (!blockDate) { toast.error('Select a date'); return; }
    const result = await adminFetch('/api/admin/block-date', {
      method: 'POST',
      body: JSON.stringify({ date: blockDate, reason: blockReason || 'Blocked' }),
    });
    if (result.success) {
      toast.success(`${blockDate} blocked on Google Calendar`);
      setBlockDate('');
      setBlockReason('');
    } else {
      toast.error('Failed to block date');
    }
  };

  const handleSendNewsletter = async () => {
    if (!confirm('Send newsletter to all active clients now?')) return;
    setSendingNewsletter(true);
    const result = await adminFetch('/api/admin/send-newsletter', { method: 'POST' });
    if (result.success) {
      toast.success(`Newsletter sent: ${result.sent} delivered, ${result.failed} failed`);
    } else {
      toast.error('Newsletter failed');
    }
    setSendingNewsletter(false);
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#f5f0e8',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    fontFamily: 'Georgia, serif',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(212,175,55,0.3)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(212,175,55,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: '#d4af37' }} />
            <span style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
              Admin Dashboard
            </span>
            {stats && (
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                {stats.activeClients} active clients
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!authenticated ? (
          /* Login */
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Lock size={32} style={{ color: '#d4af37', margin: '0 auto 16px' }} />
            <p style={{ color: '#a0a8c0', marginBottom: 24 }}>Enter admin secret to continue</p>
            <input
              type="password"
              placeholder="Admin secret"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <button
              onClick={handleAuth}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              Unlock
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '12px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}
            >
              {(['clients', 'block', 'newsletter'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: tab === t ? 700 : 400,
                    background: tab === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                    color: tab === t ? '#d4af37' : '#6b7280',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {t === 'clients' ? '👥 Clients' : t === 'block' ? '🚫 Block Date' : '📧 Newsletter'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
              {tab === 'clients' && (
                <div>
                  {/* Add client */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                    }}
                  >
                    <p style={{ color: '#a0a8c0', fontSize: 13, marginBottom: 12 }}>Add New Client</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        placeholder="Full name"
                        value={newClient.name}
                        onChange={e => setNewClient(n => ({ ...n, name: e.target.value }))}
                        style={inputStyle}
                      />
                      <input
                        placeholder="Email address"
                        type="email"
                        value={newClient.email}
                        onChange={e => setNewClient(n => ({ ...n, email: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={addClient}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        background: 'rgba(212,175,55,0.15)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: 8,
                        color: '#d4af37',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} /> Add Client
                    </button>
                  </div>

                  {/* Client list */}
                  {loadingClients ? (
                    <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading...</p>
                  ) : (
                    <div className="space-y-2">
                      {clients.map(client => (
                        <div
                          key={client.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${client.active ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 10,
                          }}
                        >
                          <div>
                            <p style={{ color: client.active ? '#f5f0e8' : '#6b7280', fontSize: 14, fontWeight: 500 }}>
                              {client.name}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: 12 }}>{client.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleClient(client)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600,
                                background: client.active ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                                color: client.active ? '#4ade80' : '#6b7280',
                              }}
                            >
                              {client.active ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {clients.length === 0 && (
                        <p style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>No clients yet. Add one above.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'block' && (
                <div>
                  <p style={{ color: '#a0a8c0', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                    Block a date on your Google Calendar directly from here. It will show as "Booked" on the booking calendar.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label style={{ fontSize: 12, color: '#a0a8c0', display: 'block', marginBottom: 8 }}>Date to Block</label>
                      <input
                        type="date"
                        value={blockDate}
                        onChange={e => setBlockDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{ ...inputStyle, colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#a0a8c0', display: 'block', marginBottom: 8 }}>Reason (optional)</label>
                      <input
                        placeholder="e.g., Personal, Hold, Tentative..."
                        value={blockReason}
                        onChange={e => setBlockReason(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={handleBlockDate}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10,
                        color: '#f87171',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      <CalendarOff size={16} /> Block This Date
                    </button>
                  </div>
                </div>
              )}

              {tab === 'newsletter' && (
                <div>
                  <p style={{ color: '#a0a8c0', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                    The newsletter is automatically sent every 2 weeks to all active clients. You can also trigger a manual send below.
                  </p>
                  <div
                    style={{
                      background: 'rgba(212,175,55,0.05)',
                      border: '1px solid rgba(212,175,55,0.15)',
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 24,
                    }}
                  >
                    <p style={{ fontSize: 13, color: '#a0a8c0', marginBottom: 4 }}>Schedule</p>
                    <p style={{ color: '#d4af37', fontFamily: 'monospace', fontSize: 14 }}>
                      {process.env.NEXT_PUBLIC_NEWSLETTER_SCHEDULE || 'Every 2 weeks (Monday 9:00 AM)'}
                    </p>
                  </div>
                  <button
                    onClick={handleSendNewsletter}
                    disabled={sendingNewsletter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 28px',
                      background: sendingNewsletter ? 'rgba(212,175,55,0.1)' : 'linear-gradient(135deg, #d4af37, #f0c040)',
                      border: 'none',
                      borderRadius: 12,
                      color: sendingNewsletter ? '#d4af37' : '#1a1a2e',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: sendingNewsletter ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {sendingNewsletter ? (
                      <><RefreshCw size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={16} /> Send Newsletter Now</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

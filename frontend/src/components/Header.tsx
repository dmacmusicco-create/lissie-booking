'use client';
import { useState } from 'react';

interface HeaderProps {
  onLogoClick: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://booking.derrickmackey.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header
      style={{
        background: 'rgba(26,26,46,0.95)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 group"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #f0c040)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              color: '#1a1a2e',
              flexShrink: 0,
            }}
          >
            DM
          </div>
          <div className="text-left">
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                fontSize: 17,
                background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}
            >
              Derrick Mackey
            </div>
            <div style={{ fontSize: 11, color: '#a0a8c0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Audio Engineer · Lissie Marion Show Productions
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(212,175,55,0.1)',
              border: copied ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(212,175,55,0.3)',
              color: copied ? '#4ade80' : '#d4af37',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.5px',
            }}
          >
            {copied ? '✓ Copied!' : '🔗 Copy Link'}
          </button>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.2)',
              color: '#4ade80',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ade80',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }}
            />
            Live Calendar
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}

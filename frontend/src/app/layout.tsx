import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lissie Marion Show Productions — Book Now',
  description: 'Check real-time availability and request a booking with Lissie Marion Show Productions.',
  openGraph: {
    title: 'Lissie Marion Show Productions — Booking',
    description: 'Check availability and request your date.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1a1a2e',
              color: '#f5f0e8',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Georgia, serif',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#1a1a2e' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#1a1a2e' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}

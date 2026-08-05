'use client';

import { useEffect } from 'react';

// Replaces the root layout entirely, so it cannot rely on app CSS or shared components.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAF7',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#1A1A2E',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '360px', textAlign: 'center' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>💔</p>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '13px', opacity: 0.6, margin: '0 0 24px', lineHeight: 1.5 }}>
            The app hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '16px',
              border: 'none',
              background: '#F43F5E',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

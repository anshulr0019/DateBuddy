'use client';

import React, { useState } from 'react';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleSignInModal({ isOpen, onClose }: GoogleSignInModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRealGoogleOAuth = () => {
    setIsSubmitting(true);
    window.location.href = '/api/auth/google/login';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-md transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)]"
        style={{ willChange: 'backdrop-filter, opacity' }}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl border border-white/60 overflow-hidden flex flex-col">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-[#1A1A2E]/15 rounded-full mx-auto mb-4" />

        {/* Google Header Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-[#1A1A2E]/[0.03] border border-[#1A1A2E]/10 flex items-center justify-center mb-3 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-extrabold text-[#1A1A2E]">Sign in with Google</h2>
          <p className="text-[13px] text-[#1A1A2E]/55 mt-1">Connect your Google account to Dil Se</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRealGoogleOAuth}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#4285F4] text-white text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,133,244,0.5)] hover:bg-[#3367D6] transition-all active:scale-[0.985] cursor-pointer disabled:opacity-60"
          >
            <div className="bg-white p-1 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <span>{isSubmitting ? 'Opening Google…' : 'Continue with Google'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-[#1A1A2E]/15 text-[14px] font-bold text-[#1A1A2E]/60 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-[#1A1A2E]/[0.06] text-center">
          <p className="text-[11px] text-[#1A1A2E]/55 leading-relaxed">
            🔒 Secured by Google OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticWarning } from '../../lib/haptics';

const BackChevron = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(['', '', '', '', '', '']);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('onboarding_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filled = ['', '', '', '', '', ''];
          parsed.forEach((p, idx) => { if (idx < 6 && p) filled[idx] = p; });
          setPhotos(filled);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const triggerFileInput = (index: number) => {
    setActiveSlot(index);
    hapticLight();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;
    const targetIndex = activeSlot;
    setUploadingIndex(targetIndex);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        const next = [...photos];
        next[targetIndex] = data.url;
        setPhotos(next);
        hapticLight();
      } else {
        hapticWarning();
        setError(data.message || 'Upload failed. Please try again.');
      }
    } catch {
      hapticWarning();
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingIndex(null);
      setActiveSlot(null);
    }
  };

  const handleRemove = (index: number) => {
    hapticLight();
    const next = [...photos];
    next[index] = '';
    setPhotos(next);
  };

  const handleNext = () => {
    const valid = photos.filter(p => p?.trim());
    if (valid.length < 2) {
      hapticWarning();
      setError('Please add at least 2 photos to continue.');
      return;
    }
    setError('');
    try {
      localStorage.setItem('onboarding_photos', JSON.stringify(valid));
    } catch {
      hapticWarning();
      setError('Your photos are too large to save. Please remove them and add smaller images.');
      return;
    }
    hapticMedium();
    router.push('/onboarding/bio');
  };

  const validCount = photos.filter(p => p?.trim()).length;

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#FF6B9D]/08 blur-[60px]" />
          <div className="absolute -right-16 bottom-1/3 h-64 w-64 rounded-full bg-[#7B68EE]/07 blur-[60px]" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.12)] backdrop-blur-xl transition-all duration-200 active:scale-[0.92] cursor-pointer"
            >
              {BackChevron}
            </button>
            <div
              className="flex-1 h-[6px] rounded-full bg-[#1A1A2E]/[0.06] overflow-hidden"
              role="progressbar"
              aria-valuenow={3}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding step 3 of 7"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: '42.8%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-[#1A1A2E]/45">3 of 7</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold leading-snug">
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-[28px] font-black text-[#1A1A2E] tracking-tight leading-[1.1]">Add your best photos</h1>
            <p className="text-[14.5px] text-[#1A1A2E]/55 mt-1.5">At least 2 photos · Profiles with 4+ photos get 3× more matches</p>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const url = photos[index];
              const uploading = uploadingIndex === index;
              const required = index < 2;

              return (
                <div key={index} className="relative">
                  <button
                    type="button"
                    onClick={() => triggerFileInput(index)}
                    disabled={uploading}
                    aria-label={url ? `Replace photo ${index + 1}` : `Add photo ${index + 1}${required ? ' (required)' : ' (optional)'}`}
                    className={`aspect-[3/4] w-full rounded-[22px] overflow-hidden transition-all duration-200 cursor-pointer ${
                      url
                        ? 'shadow-[0_8px_24px_-8px_rgba(26,26,46,0.25)]'
                        : `border-2 border-dashed flex flex-col items-center justify-center ${
                            required
                              ? 'border-[#FF6B9D]/40 bg-[#FF6B9D]/[0.04] hover:border-[#FF6B9D]/70 hover:bg-[#FF6B9D]/[0.08]'
                              : 'border-[#1A1A2E]/15 bg-white/60 hover:border-[#1A1A2E]/30 hover:bg-white/80'
                          }`
                    }`}
                    style={url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm rounded-[22px]">
                        <svg className="animate-spin mb-1.5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                        </svg>
                        <span className="text-[11px] font-bold text-[#FF6B9D]">Uploading…</span>
                      </div>
                    )}
                    {!url && !uploading && (
                      <div className="flex flex-col items-center text-center p-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full mb-1.5 ${required ? 'bg-[#FF6B9D]/15' : 'bg-[#1A1A2E]/[0.06]'}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={required ? '#FF6B9D' : '#1A1A2E'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: required ? 1 : 0.45 }}>
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </div>
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider ${required ? 'text-[#FF6B9D]' : 'text-[#1A1A2E]/35'}`}>
                          {required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    )}
                  </button>

                  {url && !uploading && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border border-white/60 text-[#1A1A2E]/70 shadow-md hover:bg-white active:scale-90 transition-all cursor-pointer backdrop-blur-md"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}

                  {/* Primary photo indicator */}
                  {index === 0 && url && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/50 backdrop-blur-md px-2 py-0.5">
                      <span className="text-[10px] font-bold text-white">Main</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Counter */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  photos[i] ? 'w-5 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE]' : 'w-1.5 bg-[#1A1A2E]/15'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[12.5px] font-medium text-[#1A1A2E]/45">
            {validCount} of 6 photos added
            {validCount < 2 && (
              <span className="text-[#FF6B9D] font-bold"> · Add {2 - validCount} more to continue</span>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/[0.04]">
          <button
            onClick={handleNext}
            disabled={validCount < 2}
            className="w-full h-14 rounded-2xl text-[15px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_10px_28px_-8px_rgba(255,107,157,0.5)] active:scale-[0.985]"
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
          parsed.forEach((p, idx) => {
            if (idx < 6 && p) filled[idx] = p;
          });
          setPhotos(filled);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const triggerFileInput = (index: number) => {
    setActiveSlot(index);
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        const newPhotos = [...photos];
        newPhotos[targetIndex] = data.url;
        setPhotos(newPhotos);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingIndex(null);
      setActiveSlot(null);
    }
  };

  const handleNext = () => {
    const validPhotos = photos.filter(p => p && p.trim().length > 0);
    if (validPhotos.length < 2) {
      setError('Please add at least 2 photos');
      return;
    }
    setError('');

    try {
      localStorage.setItem('onboarding_photos', JSON.stringify(validPhotos));
    } catch {
      setError('Your photos are too large to save. Please remove them and add smaller images.');
      return;
    }
    router.push('/onboarding/bio');
  };

  const validCount = photos.filter(p => p && p.trim().length > 0).length;

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Progress Bar Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-[#1A1A2E]/10 text-[#1A1A2E] shadow-sm backdrop-blur-md hover:bg-white transition-all cursor-pointer"
            >
              ←
            </button>
            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/60">
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '42%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">3/7</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-semibold text-center leading-snug">
              {error}
            </div>
          )}
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Add your best photos</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">Add at least 2 photos to show off your vibe</p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const photoUrl = photos[index];
              const isUploading = uploadingIndex === index;

              return (
                <div key={index} className="relative">
                  <button
                    type="button"
                    onClick={() => triggerFileInput(index)}
                    disabled={isUploading}
                    className={`aspect-[3/4] w-full rounded-[22px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-sm ${
                      photoUrl
                        ? 'border-transparent shadow-md'
                        : 'border-[#FF6B9D]/30 bg-white/80 hover:border-[#FF6B9D] hover:bg-white'
                    }`}
                    style={{
                      backgroundImage: photoUrl ? `url(${photoUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl inset-0 absolute justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF6B9D] border-t-transparent" />
                        <span className="text-[11px] font-bold text-[#FF6B9D]">Uploading…</span>
                      </div>
                    ) : !photoUrl ? (
                      <div className="flex flex-col items-center text-center p-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] text-xl font-bold mb-1">
                          +
                        </div>
                        {index < 2 ? (
                          <span className="text-[11px] font-bold text-[#FF6B9D] uppercase tracking-wider">Required</span>
                        ) : (
                          <span className="text-[11px] text-[#1A1A2E]/40 font-medium">Optional</span>
                        )}
                      </div>
                    ) : null}
                  </button>
                  {photoUrl && !isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newPhotos = [...photos];
                        newPhotos[index] = '';
                        setPhotos(newPhotos);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-rose-500/90 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-rose-600 cursor-pointer backdrop-blur-md"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Counter */}
          <div className="mt-5 text-center">
            <span className="text-[13px] font-semibold text-[#1A1A2E]/60">
              {validCount} of 6 photos added
            </span>
            {validCount < 2 && (
              <p className="text-[12px] font-bold text-[#FF6B9D] mt-1">
                Add {2 - validCount} more photo{2 - validCount > 1 ? 's' : ''} to continue
              </p>
            )}
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5">
          <button
            onClick={handleNext}
            disabled={validCount < 2}
            className={`w-full h-14 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
              validCount >= 2
                ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985]'
                : 'bg-black/10 text-[#1A1A2E]/35 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

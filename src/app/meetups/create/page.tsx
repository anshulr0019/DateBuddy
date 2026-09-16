'use client';

import { useState, useRef, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { AuroraBackground, SafeImage } from '@/app/components/shared';
import { VenuePickerModal } from '@/app/components/VenuePickerModal';
import { getCategoryCoverImage, PRESET_IMAGE_OPTIONS } from '@/app/lib/meetup-media';
import { getCachedUserProfile, loadUserProfile } from '@/app/lib/userProfileCache';

const CATEGORIES = [
  { id: 'sports', icon: '⚽', label: 'Sports & Fitness', desc: 'Gym, badminton, football & running' },
  { id: 'social', icon: '🎉', label: 'Social & Parties', desc: 'House parties, mixers & meetups' },
  { id: 'food', icon: '☕', label: 'Food & Coffee', desc: 'Café hops, dinners & street food' },
  { id: 'outdoors', icon: '🏔️', label: 'Outdoors & Trips', desc: 'Hikes, weekend getaways & nature' },
  { id: 'arts', icon: '🎨', label: 'Arts & Culture', desc: 'Museums, live gigs & theatre' },
  { id: 'tech', icon: '💻', label: 'Tech & Gaming', desc: 'Hackathons, LAN parties & co-working' },
];

export default function CreateMeetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [userCity, setUserCity] = useState(() => getCachedUserProfile()?.city || 'Mumbai');
  const [showVenuePicker, setShowVenuePicker] = useState(false);

  // Fetch user's city for meetup location
  useEffect(() => {
    loadUserProfile()
      .then(user => { if (user.city) setUserCity(user.city); })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    category: 'sports',
    description: '',
    venueName: '',
    address: '',
    date: '',
    time: '',
    maxAttendees: 8,
    imageUrl: getCategoryCoverImage('sports', ''),
  });

  const handleCreate = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      let dateTimeIso = new Date(Date.now() + 86400000 * 2).toISOString();
      if (formData.date) {
        const timePart = formData.time || '18:00';
        dateTimeIso = new Date(`${formData.date}T${timePart}`).toISOString();
      }

      const response = await fetch('/api/meetups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          description: formData.description.trim(),
          venueName: formData.venueName.trim() || 'City Center',
          address: formData.address.trim(),
          city: userCity,
          date: dateTimeIso,
          maxAttendees: formData.maxAttendees,
          imageUrl: formData.imageUrl || getCategoryCoverImage(formData.category, formData.title, formData.venueName),
        }),
      });

      const data = await response.json();
      if (data.success && data.meetup) {
        router.push(`/meetups/${data.meetup.id}`);
      } else {
        setErrorMessage(data.message || 'Failed to create squad. Please try again.');
      }
    } catch (error) {
      console.error('Error creating squad:', error);
      setErrorMessage('Network error while creating meetup. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setErrorMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setUploadedPreview(data.url);
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        setErrorMessage(data.message || 'Upload failed. Please try again.');
      }
    } catch {
      setErrorMessage('Upload failed. Check your connection.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="h-dvh w-full min-h-screen bg-infyn-paper flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col justify-between bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-ink/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            {/* Header with notch clearance */}
            <div className="flex-shrink-0 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-4 bg-infyn-surface/80 backdrop-blur-md border-b border-infyn-ink/5">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-infyn-ink shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  ←
                </button>
                <div className="text-center">
                  <h1 className="text-[17px] font-normal text-infyn-ink font-display">Host a Squad</h1>
                  <p className="text-[12px] font-medium text-infyn-ink/50">Step {step} of 3</p>
                </div>
                <div className="w-10" />
              </div>

              {/* Step Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-infyn-ink/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose transition-all duration-300 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 scrollbar-none space-y-5">
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-[13px] font-medium text-rose-700 backdrop-blur-md animate-fade-in flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button onClick={() => setErrorMessage('')} className="text-rose-500 font-bold ml-2">✕</button>
                </div>
              )}

              {/* STEP 1: Basic Info & Category */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div>
                    <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                      Squad Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leg Day Workout, Badminton Match, Coffee Hop..."
                      value={formData.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          title: newTitle,
                          imageUrl: uploadedPreview ? prev.imageUrl : getCategoryCoverImage(prev.category, newTitle, prev.venueName),
                        }));
                      }}
                      className="w-full h-13 px-4 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink placeholder-infyn-ink/30 focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-3">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map((cat) => {
                        const isSelected = formData.category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              category: cat.id,
                              imageUrl: uploadedPreview ? prev.imageUrl : getCategoryCoverImage(cat.id, prev.title, prev.venueName),
                            }))}
                            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-br from-infyn-rose/10 to-infyn-rose/10 border-infyn-rose shadow-sm ring-1 ring-infyn-rose/30'
                                : 'bg-infyn-surface/80 border-infyn-ink/10 hover:border-infyn-ink/20'
                            }`}
                          >
                            <div className="text-[26px] mb-1">{cat.icon}</div>
                            <div className="text-[14px] font-bold text-infyn-ink">{cat.label}</div>
                            <div className="text-[11px] text-infyn-ink/50 mt-0.5 line-clamp-1">{cat.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Venue, Time & Capacity */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60">
                        Venue Name <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowVenuePicker(true)}
                        className="text-[12px] font-bold text-infyn-rose hover:underline cursor-pointer flex items-center gap-1"
                      >
                        📍 Select from popular {formData.category} locations →
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={`Tap to select ${formData.category} location...`}
                      value={formData.venueName}
                      onFocus={() => setShowVenuePicker(true)}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      className="w-full h-13 px-4 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink placeholder-infyn-ink/30 focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Phoenix Mall, Lower Parel West"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full h-13 px-4 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink placeholder-infyn-ink/30 focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                        Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full h-13 px-3.5 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                        Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full h-13 px-3.5 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-infyn-ink/10 bg-infyn-surface p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-infyn-ink">Max Squad Size</span>
                      <span className="text-[15px] font-bold text-infyn-rose">{formData.maxAttendees} Members</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={formData.maxAttendees}
                      onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                      className="w-full accent-infyn-rose"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Description & Cover Image */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div>
                    <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                      Description & Vibe
                    </label>
                    <textarea
                      placeholder="Tell members what to bring, skill level needed, or meetup rules..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      maxLength={300}
                      className="w-full p-4 rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-[16px] font-medium text-infyn-ink placeholder-infyn-ink/30 focus:outline-none focus:ring-2 focus:ring-infyn-rose/40 focus:border-infyn-rose transition-all shadow-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold uppercase tracking-wider text-infyn-ink/60 mb-2">
                      Cover Image
                    </label>

                    {/* Upload your own photo */}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full mb-3 h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-infyn-rose/40 bg-infyn-rose/5 text-[13px] font-semibold text-infyn-rose hover:bg-infyn-rose/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isUploadingPhoto ? (
                        <><div className="h-4 w-4 rounded-full border-2 border-infyn-rose border-t-transparent animate-spin" /><span>Uploading…</span></>
                      ) : uploadedPreview ? (
                        <><span>✓</span><span>Custom photo uploaded — tap to change</span></>
                      ) : (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Upload Custom Photo</span></>
                      )}
                    </button>

                    {/* Preset images */}
                    <p className="text-[11px] font-semibold text-infyn-ink/40 uppercase tracking-wider mb-2">Or choose from curated activity presets</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {PRESET_IMAGE_OPTIONS.map((preset) => {
                        const isSel = formData.imageUrl === preset.url && !uploadedPreview;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => { setUploadedPreview(null); setFormData({ ...formData, imageUrl: preset.url }); }}
                            className={`relative h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                              isSel ? 'border-infyn-rose ring-2 ring-infyn-rose/30 scale-102 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            <SafeImage src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-1.5">
                              <span className="text-[10px] text-white font-bold leading-tight line-clamp-1">{preset.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Preview */}
                  <div className="rounded-2xl bg-gradient-to-br from-infyn-rose/10 to-infyn-rose/10 border border-infyn-rose/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-infyn-rose text-white text-[10px] font-bold uppercase tracking-wider">
                        {formData.category || 'Squad'}
                      </span>
                      <span className="text-[12px] font-semibold text-infyn-ink/60">Max {formData.maxAttendees} members</span>
                    </div>
                    <h3 className="text-[16px] font-extrabold text-infyn-ink">{formData.title || 'Squad Title'}</h3>
                    <p className="text-[12px] font-medium text-infyn-ink/60 mt-0.5">
                      📍 {formData.venueName || 'Venue'} {formData.date ? `· 📅 ${formData.date}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex-shrink-0 p-5 bg-infyn-surface/90 backdrop-blur-md border-t border-infyn-ink/5">
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.title.trim()}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose text-white font-bold text-[15px] shadow-lg shadow-infyn-ink/25 disabled:opacity-40 disabled:shadow-none active:scale-[0.99] transition-all cursor-pointer"
                >
                  Continue: Location & Time →
                </button>
              )}

              {step === 2 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 h-13 rounded-2xl bg-infyn-surface border border-infyn-ink/15 text-infyn-ink font-bold text-[14px] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.venueName.trim() || !formData.date}
                    className="flex-2 h-13 rounded-2xl bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose text-white font-bold text-[15px] shadow-lg shadow-infyn-ink/25 disabled:opacity-40 disabled:shadow-none active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Continue: Details →
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 h-13 rounded-2xl bg-infyn-surface border border-infyn-ink/15 text-infyn-ink font-bold text-[14px] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="flex-2 h-13 rounded-2xl bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose text-white font-bold text-[15px] shadow-lg shadow-infyn-ink/25 disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-infyn-border border-t-transparent animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Publish Squad 🚀</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </AuroraBackground>
      </div>

      <VenuePickerModal
        isOpen={showVenuePicker}
        category={formData.category}
        onSelect={(venueName, address) => {
          setFormData(prev => ({
            ...prev,
            venueName,
            address: address || prev.address,
          }));
        }}
        onClose={() => setShowVenuePicker(false)}
      />
    </div>
  );
}

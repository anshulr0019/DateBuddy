'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
    const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
    const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
    const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]');

    let age = 24;
    if (basicInfo.dateOfBirth) {
      const dobYear = new Date(basicInfo.dateOfBirth).getFullYear();
      if (!isNaN(dobYear)) {
        age = new Date().getFullYear() - dobYear;
      }
    }

    const validPhotos = Array.isArray(photos) ? photos.filter((p: string) => p && p.trim().length > 0) : [];

    setProfileData({
      name: basicInfo.name || 'Alex',
      age,
      photo: validPhotos[0] || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=800&fit=crop&crop=faces',
      bio: bio.bio || bio.promptAnswer || 'Finding more of myself these days ✨',
      interests: Array.isArray(interests) ? interests.slice(0, 3) : ['Coffee', 'Travel', 'Design'],
    });
  }, []);

  const handleStartDiscovering = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
      const location = localStorage.getItem('onboarding_location') || 'Mumbai';
      const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
      const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
      const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]');
      const preferences = JSON.parse(localStorage.getItem('onboarding_preferences') || '{}');

      const response = await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basicInfo, location, photos, bio, interests, preferences }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        router.push('/welcome');
        return;
      }

      if (!response.ok || !data.success) {
        setError(data.message || 'Could not save your profile. Please try again.');
        return;
      }

      router.push('/discover');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProfileStrength = () => {
    let strength = 40;
    const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
    const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
    
    if (Array.isArray(photos)) {
      strength += photos.filter((p: string) => p && p.trim().length > 0).length * 10;
    }
    if (bio.bio || bio.promptAnswer) strength += 10;
    
    return Math.min(strength, 100);
  };

  if (!profileData) {
    return (
      <div className="h-dvh w-full bg-[#FAFAF7] flex items-center justify-center font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#FF6B9D] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Progress Bar Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/60">
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500 w-full" />
            </div>
            <span className="text-[12px] font-bold text-[#FF6B9D]">Ready!</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Looking good! 🔥</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">Here is a sneak peek of your profile in Discover</p>
          </div>

          {/* Profile Preview Card */}
          <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_10px_30px_-15px_rgba(26,26,46,0.12)] backdrop-blur-md mb-5">
            <div className="relative mb-3 overflow-hidden rounded-[20px]">
              <div
                className="w-full aspect-[3/4] bg-cover bg-center"
                style={{ backgroundImage: `url(${profileData.photo})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <h2 className="text-white text-2xl font-black drop-shadow-md">
                  {profileData.name}, {profileData.age}
                </h2>
              </div>
            </div>
            
            <p className="text-[13.5px] font-medium text-[#1A1A2E]/80 mb-3 px-1">{profileData.bio}</p>
            
            <div className="flex flex-wrap gap-2 px-1">
              {profileData.interests.map((interest: string) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-[#FF6B9D]/10 text-[#FF6B9D] rounded-full text-[12px] font-semibold"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Profile Strength Card */}
          <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_10px_30px_-15px_rgba(26,26,46,0.12)] backdrop-blur-md flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E0E0E0"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - calculateProfileStrength() / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#7B68EE" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[15px] font-black text-[#1A1A2E]">
                {calculateProfileStrength()}%
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[#1A1A2E]">Profile Strength</h3>
              <p className="text-[12px] text-[#1A1A2E]/55 mt-0.5">
                Your profile is live and ready for nearby matches!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5 space-y-2.5">
          {error && (
            <p role="alert" className="text-[13px] font-semibold text-[#D92D5E] text-center">
              {error}
            </p>
          )}
          <button
            onClick={handleStartDiscovering}
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving Profile…
              </>
            ) : (
              'Start Discovering ✨'
            )}
          </button>
          <button
            onClick={() => router.push('/onboarding/basic-info')}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl border border-[#1A1A2E]/10 bg-white/80 text-[#1A1A2E] text-[13.5px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            Edit Profile Details
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
    const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
    const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
    const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]');

    setProfileData({
      name: basicInfo.name,
      age: new Date().getFullYear() - new Date(basicInfo.dateOfBirth).getFullYear(),
      photo: photos[0] || 'https://picsum.photos/400/600',
      bio: bio.bio || bio.promptAnswer || 'No bio yet',
      interests: interests.slice(0, 3),
    });
  }, []);

  const calculateProfileStrength = () => {
    let strength = 40; // Base for completing onboarding
    const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
    const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
    
    strength += photos.filter((p: string) => p).length * 5; // 5% per photo
    if (bio.bio || bio.promptAnswer) strength += 10;
    
    return Math.min(strength, 100);
  };

  if (!profileData) {
    return <div className="mobile-container min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="spinner"></div>
    </div>;
  }

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar - Complete */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '100%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 7 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Looking good! 🔥</h1>
        <p className="text-gray-600 mb-6">Here's how others will see your profile</p>

        {/* Profile Preview Card */}
        <div className="card mb-6">
          <div className="relative mb-4">
            <div
              className="w-full aspect-[3/4] rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${profileData.photo})` }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-xl">
              <h2 className="text-white text-2xl font-bold">
                {profileData.name}, {profileData.age}
              </h2>
            </div>
          </div>
          
          <p className="text-sm text-[#1A1A2E] mb-3">{profileData.bio}</p>
          
          <div className="flex flex-wrap gap-2">
            {profileData.interests.map((interest: string) => (
              <span
                key={interest}
                className="px-3 py-1 bg-pink-50 text-[#FF6B9D] rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Profile Strength */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#E0E0E0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - calculateProfileStrength() / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#7B68EE" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1A1A2E]">
                {calculateProfileStrength()}%
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1A1A2E] mb-1">Profile Strength</h3>
              <p className="text-sm text-gray-600">
                You can add more details later to boost your profile
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <button
          onClick={() => router.push('/onboarding/tutorial')}
          className="btn-primary w-full"
        >
          Start Swiping
        </button>
        <button
          onClick={() => router.push('/onboarding/basic-info')}
          className="btn-secondary w-full"
        >
          Add More Details
        </button>
      </div>
    </div>
  );
}

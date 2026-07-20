'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const userData = {
    name: 'Rahul',
    age: 25,
    city: 'Mumbai',
    photos: [
      'https://picsum.photos/400/600?random=10',
      'https://picsum.photos/400/600?random=11',
      'https://picsum.photos/400/600?random=12',
    ],
    bio: 'Coffee enthusiast ☕ | Love exploring Mumbai street food | Weekend hiker 🏔️',
    interests: ['📷 Photography', '✈️ Travel', '☕ Coffee', '🏃 Running', '🎵 Music'],
    prompts: [
      { question: "My perfect weekend is...", answer: "Exploring new cafes and taking photos" },
    ],
    verified: false,
    profileStrength: 68,
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Profile</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/profile/edit')}
            className="text-[#FF6B9D] font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="text-xl"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Photos Carousel */}
        <div className="bg-white p-4 mb-2">
          <div className="flex gap-3 overflow-x-auto">
            {userData.photos.map((photo, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-32 h-40 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${photo})` }}
              >
                <button className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-sm">
                  📷
                </button>
              </div>
            ))}
            <button className="flex-shrink-0 w-32 h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <span className="text-3xl mb-2">+</span>
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
        </div>

        {/* Profile Strength */}
        <div className="card mx-4 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#1A1A2E]">Profile Strength</h3>
            <span className="text-2xl font-bold gradient-text">{userData.profileStrength}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-bg"
              style={{ width: `${userData.profileStrength}%` }}
            />
          </div>
          <button className="text-sm text-[#FF6B9D] mt-2">
            Complete your profile to get more matches →
          </button>
        </div>

        {/* Basic Info */}
        <div className="card mx-4 mb-2">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">Basic Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Name</span>
              <span className="font-medium">{userData.name}, {userData.age}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Location</span>
              <span className="font-medium">{userData.city}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="card mx-4 mb-2">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">About Me</h3>
          <p className="text-gray-700">{userData.bio}</p>
        </div>

        {/* Prompts */}
        {userData.prompts.length > 0 && (
          <div className="card mx-4 mb-2">
            <h3 className="font-semibold text-[#1A1A2E] mb-3">My Answers</h3>
            {userData.prompts.map((prompt, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <p className="text-sm text-gray-600 mb-1">{prompt.question}</p>
                <p className="text-[#1A1A2E]">{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Interests */}
        <div className="card mx-4 mb-2">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {userData.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 bg-pink-50 text-[#FF6B9D] rounded-full text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Verification */}
        {!userData.verified && (
          <div className="card mx-4 mb-2 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✓</div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A1A2E] mb-1">Get Verified</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Stand out and get 50% more matches
                </p>
                <button
                  onClick={() => router.push('/verification')}
                  className="btn-primary text-sm py-2"
                >
                  Start Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Profile */}
        <div className="p-4">
          <button
            onClick={() => router.push('/profile/preview')}
            className="btn-secondary w-full"
          >
            Preview Profile
          </button>
        </div>

        {/* Premium Upgrade */}
        <div className="card mx-4 mb-4 bg-gradient-bg text-white">
          <h3 className="font-bold text-xl mb-2">Upgrade to Premium ✨</h3>
          <p className="text-sm opacity-90 mb-4">
            Get unlimited likes, see who liked you, and more!
          </p>
          <button
            onClick={() => router.push('/premium')}
            className="bg-white text-[#FF6B9D] font-semibold py-3 px-6 rounded-lg w-full"
          >
            Starting at ₹50/day
          </button>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'matches') router.push('/matches');
    if (tab === 'profile') router.push('/profile');
    if (tab === 'discover') router.push('/discover');
  };

  return (
    <div className="bottom-nav">
      <button
        onClick={() => handleTabClick('discover')}
        className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">🔥</span>
        <span className="text-xs">Discover</span>
      </button>
      <button
        onClick={() => handleTabClick('matches')}
        className={`bottom-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">💬</span>
        <span className="text-xs">Matches</span>
      </button>
      <button
        onClick={() => handleTabClick('profile')}
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">👤</span>
        <span className="text-xs">Profile</span>
      </button>
    </div>
  );
}

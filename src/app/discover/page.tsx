'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sample profiles for demo
const SAMPLE_PROFILES = [
  {
    id: 1,
    name: 'Priya',
    age: 24,
    photos: [
      'https://picsum.photos/400/600?random=1',
      'https://picsum.photos/400/600?random=2',
    ],
    bio: 'Coffee addict ☕ | Love exploring Mumbai street food',
    interests: ['📷 Photography', '✈️ Travel', '☕ Coffee'],
    distance: 2,
    verified: true,
  },
  {
    id: 2,
    name: 'Arjun',
    age: 26,
    photos: [
      'https://picsum.photos/400/600?random=3',
      'https://picsum.photos/400/600?random=4',
    ],
    bio: 'Fitness enthusiast 💪 | Bollywood buff',
    interests: ['💪 Fitness', '🎬 Movies', '🎵 Music'],
    distance: 5,
    verified: false,
  },
  {
    id: 3,
    name: 'Ananya',
    age: 23,
    photos: [
      'https://picsum.photos/400/600?random=5',
      'https://picsum.photos/400/600?random=6',
    ],
    bio: "Let's debate about pineapple on pizza 🍕",
    interests: ['🍕 Food', '📚 Reading', '🎨 Art'],
    distance: 3,
    verified: true,
  },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState(SAMPLE_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [swipeAction, setSwipeAction] = useState<'like' | 'pass' | null>(null);
  const [activeTab, setActiveTab] = useState('discover');

  const currentProfile = profiles[currentIndex];

  const handleSwipe = (action: 'like' | 'pass' | 'super_like') => {
    setSwipeAction(action === 'super_like' ? 'like' : action);
    
    setTimeout(() => {
      setSwipeAction(null);
      setCurrentPhotoIndex(0);
      
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // No more profiles
        setProfiles([]);
      }
    }, 500);
  };

  if (!currentProfile) {
    return (
      <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
        <TopBar />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">No more profiles nearby</h2>
          <p className="text-gray-600 text-center mb-6">
            Try expanding your distance range or come back later for new people!
          </p>
          <button className="btn-primary">Adjust Preferences</button>
        </div>
        
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      <TopBar />

      {/* Main Swipe Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-32 pt-4">
        <div className="relative w-full max-w-sm">
          {/* Profile Card */}
          <div className="card p-0 overflow-hidden relative">
            {/* Photo */}
            <div
              className="relative w-full aspect-[3/4] bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${currentProfile.photos[currentPhotoIndex]})` }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (clickX > rect.width / 2 && currentPhotoIndex < currentProfile.photos.length - 1) {
                  setCurrentPhotoIndex(currentPhotoIndex + 1);
                } else if (clickX <= rect.width / 2 && currentPhotoIndex > 0) {
                  setCurrentPhotoIndex(currentPhotoIndex - 1);
                }
              }}
            >
              {/* Photo Dots */}
              <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
                {currentProfile.photos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Swipe Overlays */}
              {swipeAction === 'like' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="text-green-500 text-6xl font-black border-4 border-green-500 px-8 py-4 rounded-2xl rotate-[-20deg]">
                    LIKE
                  </div>
                </div>
              )}
              {swipeAction === 'pass' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <div className="text-red-500 text-6xl font-black border-4 border-red-500 px-8 py-4 rounded-2xl rotate-[20deg]">
                    NOPE
                  </div>
                </div>
              )}

              {/* Profile Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-white text-2xl font-bold">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.verified && <span className="text-blue-400">✓</span>}
                </div>
                <p className="text-white/90 text-sm mb-2">📍 {currentProfile.distance} km away</p>
              </div>
            </div>

            {/* Bio and Interests */}
            <div className="p-4">
              <p className="text-[#1A1A2E] mb-3">{currentProfile.bio}</p>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-pink-50 text-[#FF6B9D] rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-6 mt-6">
            <button
              onClick={() => handleSwipe('pass')}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform"
            >
              ❌
            </button>
            <button
              onClick={() => handleSwipe('super_like')}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
            >
              ⭐
            </button>
            <button
              onClick={() => handleSwipe('like')}
              className="w-16 h-16 rounded-full bg-gradient-bg shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform"
            >
              💖
            </button>
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="text-2xl font-bold gradient-text">💕 Dil Se</div>
      <div className="flex items-center gap-4">
        <button className="relative">
          <span className="text-2xl">🔔</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B9D] text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        <button className="text-2xl">⚙️</button>
      </div>
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
        <span className="badge">2</span>
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

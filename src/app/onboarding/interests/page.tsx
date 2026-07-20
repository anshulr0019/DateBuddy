'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERESTS = [
  '📷 Photography', '✈️ Travel', '🎵 Music', '💪 Fitness', '🍕 Food',
  '🎨 Art', '🎮 Gaming', '📚 Reading', '🎬 Movies', '💃 Dancing',
  '👨‍🍳 Cooking', '⚽ Sports', '👗 Fashion', '🐶 Pets', '🏃 Running',
  '🧘 Yoga', '🎤 Karaoke', '🌱 Plants', '☕ Coffee', '🍺 Beer',
  '🎭 Theater', '📱 Tech', '🏔️ Hiking', '🏖️ Beach', '🌃 Nightlife',
];

export default function InterestsPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleNext = () => {
    if (selectedInterests.length < 5) {
      alert('Please select at least 5 interests');
      return;
    }

    localStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests));
    router.push('/onboarding/preferences');
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '70%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 5 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">What are you into?</h1>
        <p className="text-gray-600 mb-6">
          Select at least 5 interests ({selectedInterests.length}/5)
        </p>

        {/* Interests Grid */}
        <div className="flex flex-wrap gap-3">
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                selectedInterests.includes(interest)
                  ? 'border-transparent bg-gradient-bg text-white'
                  : 'border-gray-300 text-[#1A1A2E]'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={selectedInterests.length < 5}
          className="btn-primary w-full"
        >
          Next
        </button>
      </div>
    </div>
  );
}

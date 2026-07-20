'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SLIDES = [
  {
    emoji: '💖',
    title: 'Swipe right to like',
    subtitle: 'Show interest in profiles you like',
  },
  {
    emoji: '⭐',
    title: 'Tap the star for Super Like',
    subtitle: 'Stand out from the crowd!',
  },
  {
    emoji: '💕',
    title: "When they like you back, it's a match!",
    subtitle: 'Then you can start chatting',
  },
];

export default function TutorialPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/discover');
    }
  };

  const handleSkip = () => {
    router.push('/discover');
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Skip Button */}
      {currentSlide < SLIDES.length - 1 && (
        <div className="p-4 text-right">
          <button onClick={handleSkip} className="text-gray-600">
            Skip
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Emoji */}
        <div className="text-8xl mb-8 pulse">{slide.emoji}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-4 text-center">
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-8">
          {slide.subtitle}
        </p>

        {/* Dots Indicator */}
        <div className="flex gap-2 mb-12">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-[#FF6B9D] w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-6 border-t border-gray-200">
        <button onClick={handleNext} className="btn-primary w-full">
          {currentSlide === SLIDES.length - 1 ? 'Got it!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

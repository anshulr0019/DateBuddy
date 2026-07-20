'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROMPTS = [
  "My perfect weekend is...",
  "I'm weirdly good at...",
  "Let's debate about...",
  "My go-to karaoke song is...",
  "The way to my heart is...",
  "I'm looking for someone who...",
];

export default function BioPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [promptAnswer, setPromptAnswer] = useState('');

  const handleNext = () => {
    localStorage.setItem('onboarding_bio', JSON.stringify({ bio, selectedPrompt, promptAnswer }));
    router.push('/onboarding/interests');
  };

  const handleSkip = () => {
    router.push('/onboarding/interests');
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '56%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 4 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Tell us about yourself</h1>

        {/* Bio Input */}
        <div className="mb-6">
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Write a short bio..."
              className="input-field min-h-[100px] resize-none"
              maxLength={150}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {bio.length}/150
            </div>
          </div>
        </div>

        {/* Prompts Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-3">Or answer a fun prompt:</h2>
          <div className="space-y-3">
            {PROMPTS.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setPromptAnswer('');
                }}
                className={`card w-full text-left transition-all ${
                  selectedPrompt === prompt
                    ? 'ring-2 ring-[#FF6B9D]'
                    : ''
                }`}
              >
                <p className="text-sm font-medium text-[#1A1A2E]">{prompt}</p>
                {selectedPrompt === prompt && (
                  <input
                    type="text"
                    value={promptAnswer}
                    onChange={(e) => setPromptAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="mt-2 w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B9D]"
                    autoFocus
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <button onClick={handleNext} className="btn-primary w-full">
          Next
        </button>
        <button onClick={handleSkip} className="text-gray-600 w-full text-center">
          Skip for now
        </button>
      </div>
    </div>
  );
}

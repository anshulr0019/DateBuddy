'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BasicInfoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
  });

  const handleNext = () => {
    if (!formData.name || !formData.dateOfBirth || !formData.gender || !formData.lookingFor) {
      alert('Please fill all fields');
      return;
    }

    // Calculate age
    const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
    if (age < 18) {
      alert('You must be at least 18 years old');
      return;
    }

    localStorage.setItem('onboarding_basic', JSON.stringify(formData));
    router.push('/onboarding/location');
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '14%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 1 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Let's get to know you</h1>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your first name"
              className="input-field"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female', 'Non-binary', 'Other'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setFormData({ ...formData, gender: gender.toLowerCase() })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.gender === gender.toLowerCase()
                      ? 'border-[#FF6B9D] bg-pink-50'
                      : 'border-gray-200'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">Looking for</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'men', label: 'Men' },
                { value: 'women', label: 'Women' },
                { value: 'everyone', label: 'Everyone' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, lookingFor: option.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.lookingFor === option.value
                      ? 'border-[#FF6B9D] bg-pink-50'
                      : 'border-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="p-6 border-t border-gray-200">
        <button onClick={handleNext} className="btn-primary w-full">
          Next
        </button>
      </div>
    </div>
  );
}

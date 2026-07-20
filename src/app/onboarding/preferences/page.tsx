'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();
  const [ageRange, setAgeRange] = useState([18, 30]);
  const [distance, setDistance] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  const handleNext = async () => {
    console.log('🟢 Next button clicked');
    
    const preferences = { ageRange, distance };
    localStorage.setItem('onboarding_preferences', JSON.stringify(preferences));
    
    setIsLoading(true);
    setErrorDetails('');

    try {
      // Get all data from localStorage
      const phoneNumber = localStorage.getItem('phoneNumber');
      const basicInfoStr = localStorage.getItem('onboarding_basic');
      const location = localStorage.getItem('onboarding_location');
      const photosStr = localStorage.getItem('onboarding_photos');
      const bioStr = localStorage.getItem('onboarding_bio');
      const interestsStr = localStorage.getItem('onboarding_interests');

      console.log('📦 LocalStorage Data:', {
        phoneNumber,
        hasBasicInfo: !!basicInfoStr,
        hasLocation: !!location,
        hasPhotos: !!photosStr,
        hasBio: !!bioStr,
        hasInterests: !!interestsStr,
      });

      // Validate we have required data
      if (!phoneNumber) {
        alert('Phone number missing! Please restart onboarding.');
        router.push('/welcome');
        return;
      }

      if (!basicInfoStr) {
        alert('Basic info missing! Going back to basic info.');
        router.push('/onboarding/basic-info');
        return;
      }

      const payload = {
        phoneNumber,
        basicInfo: basicInfoStr ? JSON.parse(basicInfoStr) : {},
        location: location || 'Mumbai',
        photos: photosStr ? JSON.parse(photosStr) : [],
        bio: bioStr ? JSON.parse(bioStr) : {},
        interests: interestsStr ? JSON.parse(interestsStr) : [],
        preferences,
      };

      console.log('📤 Sending payload:', payload);

      const url = '/api/users/complete-onboarding';
      console.log('🌐 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response received');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('OK:', response.ok);

      // Try to parse response
      let data;
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        const text = await response.text();
        console.log('📄 Response text:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (response.ok && data.success) {
        console.log('✅ Success! User ID:', data.userId);
        localStorage.setItem('userId', data.userId);
        router.push('/onboarding/review');
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        console.error('❌ Server error:', errorMsg);
        setErrorDetails(errorMsg);
        alert(`Server Error: ${errorMsg}`);
      }

    } catch (error) {
      console.error('❌ Caught exception:', error);
      
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error - cannot reach server. Is the dev server running?';
      }

      setErrorDetails(errorMessage);
      alert(`Error: ${errorMessage}`);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '84%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 6 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Who would you like to meet?</h1>

        {errorDetails && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errorDetails}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-4">
              Age Range: {ageRange[0]} - {ageRange[1]}
            </label>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600">Min Age: {ageRange[0]}</label>
                <input
                  type="range"
                  min="18"
                  max="50"
                  value={ageRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    if (newMin < ageRange[1]) {
                      setAgeRange([newMin, ageRange[1]]);
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Max Age: {ageRange[1]}</label>
                <input
                  type="range"
                  min="18"
                  max="50"
                  value={ageRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    if (newMax > ageRange[0]) {
                      setAgeRange([ageRange[0], newMax]);
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-4">
              Maximum Distance: {distance} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            These can be changed later in settings
          </p>
        </div>
      </div>

      {/* Next Button */}
      <div className="p-6 border-t border-gray-200">
        <button 
          onClick={handleNext} 
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
}
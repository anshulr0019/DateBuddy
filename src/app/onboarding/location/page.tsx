'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
];

export default function LocationPage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredCities = city
    ? INDIAN_CITIES.filter(c => c.toLowerCase().includes(city.toLowerCase()))
    : INDIAN_CITIES;

  const handleNext = () => {
    if (!city) {
      alert('Please select your city');
      return;
    }

    localStorage.setItem('onboarding_location', city);
    router.push('/onboarding/photos');
  };

  const handleAutoDetect = () => {
    // Simulate GPS detection
    setCity('Mumbai');
    setShowSuggestions(false);
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '28%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 2 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Where are you located?</h1>
        <p className="text-gray-600 mb-6">This helps us find people nearby</p>

        <div className="space-y-4">
          {/* Auto Detect Button */}
          <button
            onClick={handleAutoDetect}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <span>📍</span>
            <span>Auto-detect my location</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* City Input */}
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter your city"
              className="input-field"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.map((cityName) => (
                  <button
                    key={cityName}
                    onClick={() => {
                      setCity(cityName);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {cityName}
                  </button>
                ))}
                {filteredCities.length === 0 && (
                  <div className="px-4 py-3 text-gray-500">No cities found</div>
                )}
              </div>
            )}
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

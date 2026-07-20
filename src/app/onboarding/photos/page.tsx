'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (index: number) => {
    // Simulate photo upload - in real app, use file input
    const newPhotos = [...photos];
    newPhotos[index] = `https://picsum.photos/400/600?random=${index}`;
    setPhotos(newPhotos);
  };

  const handleNext = () => {
    if (photos.filter(p => p).length < 2) {
      alert('Please add at least 2 photos');
      return;
    }

    localStorage.setItem('onboarding_photos', JSON.stringify(photos));
    router.push('/onboarding/bio');
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-bg" style={{ width: '42%' }}></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Step 3 of 7</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Add your best photos</h1>
        <p className="text-gray-600 mb-6">Add at least 2 photos to continue</p>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="relative">
              <button
                onClick={() => handlePhotoUpload(index)}
                className={`aspect-[3/4] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  photos[index]
                    ? 'border-transparent'
                    : 'border-gray-300 hover:border-[#FF6B9D]'
                }`}
                style={{
                  backgroundImage: photos[index] ? `url(${photos[index]})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!photos[index] && (
                  <>
                    <div className="text-4xl mb-2">+</div>
                    {index < 2 && (
                      <div className="text-xs text-[#FF6B9D] font-medium">Required</div>
                    )}
                  </>
                )}
              </button>
              {photos[index] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newPhotos = [...photos];
                    newPhotos[index] = '';
                    setPhotos(newPhotos);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Counter */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {photos.filter(p => p).length} / 6 photos added
          {photos.filter(p => p).length < 2 && (
            <div className="text-[#FF6B9D] mt-1">
              Add {2 - photos.filter(p => p).length} more photo{2 - photos.filter(p => p).length > 1 ? 's' : ''} to continue
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={photos.filter(p => p).length < 2}
          className="btn-primary w-full"
        >
          Next
        </button>
      </div>
    </div>
  );
}

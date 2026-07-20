'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'sports', icon: '⚽', label: 'Sports & Fitness' },
  { id: 'arts', icon: '🎨', label: 'Arts & Culture' },
  { id: 'tech', icon: '💻', label: 'Tech & Gaming' },
  { id: 'food', icon: '🍕', label: 'Food & Drinks' },
  { id: 'outdoors', icon: '🏔️', label: 'Outdoors' },
  { id: 'social', icon: '🎉', label: 'Social' },
];

export default function CreateMeetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    venueName: '',
    address: '',
    date: '',
    time: '',
    maxAttendees: 10,
    imageUrl: '',
  });

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('userId') || '1';
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const response = await fetch('/api/meetups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          ...formData,
          date: dateTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Meetup created!');
        router.push(`/meetups/${data.meetupId}`);
      } else {
        alert(data.message || 'Failed to create meetup');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create meetup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      <div className="p-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-2xl">←</button>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Host a Meetup</h1>
          <p className="text-sm text-gray-600">Step {step} of 3</p>
        </div>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">What are you planning?</label>
              <input
                type="text"
                placeholder="e.g., Sunday Morning Hike, Board Game Night..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B9D]"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block font-medium mb-3 text-[#1A1A2E]">Category</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({...formData, category: cat.id})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.category === cat.id 
                        ? 'border-[#FF6B9D] bg-pink-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium text-[#1A1A2E]">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.category}
              className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Location & Time
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">Venue Name</label>
              <input
                type="text"
                placeholder="e.g., Cubbon Park, Blue Tokai Coffee"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B9D]"
                value={formData.venueName}
                onChange={(e) => setFormData({...formData, venueName: e.target.value})}
              />
            </div>

            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">Address</label>
              <textarea
                placeholder="Full address..."
                className="w-full p-3 border border-gray-200 rounded-xl h-24 focus:outline-none focus:border-[#FF6B9D]"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2 text-[#1A1A2E]">Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B9D]"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-medium mb-2 text-[#1A1A2E]">Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B9D]"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">
                Max Attendees: {formData.maxAttendees}
              </label>
              <input
                type="range"
                min="2"
                max="50"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({...formData, maxAttendees: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!formData.venueName || !formData.date || !formData.time}
                className="flex-1 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                Next: Details
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">Description</label>
              <textarea
                placeholder="Tell people what to expect..."
                className="w-full p-3 border border-gray-200 rounded-xl h-32 focus:outline-none focus:border-[#FF6B9D]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/300</p>
            </div>

            <div>
              <label className="block font-medium mb-2 text-[#1A1A2E]">Cover Image URL (optional)</label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B9D]"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>

            <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
              <h3 className="font-semibold mb-2 text-[#1A1A2E]">Preview</h3>
              <div className="text-sm text-gray-700">
                <p className="font-bold">{formData.title}</p>
                <p className="text-gray-600 capitalize">{formData.category} • {formData.venueName}</p>
                <p className="text-xs text-gray-500 mt-1">{formData.date} at {formData.time}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Back
              </button>
              <button 
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Meetup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
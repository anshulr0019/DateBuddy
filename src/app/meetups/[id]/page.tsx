'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface MeetupDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  venueName: string;
  address: string;
  date: string;
  maxAttendees: number;
  imageUrl: string;
  host: {
    id: number;
    name: string;
    photo: string;
    verified: boolean;
  } | null;
  attendees: any[];
  attendeesCount: number;
}

export default function MeetupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [meetup, setMeetup] = useState<MeetupDetail | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMeetup();
  }, [params.id]);

  const fetchMeetup = async () => {
    try {
      const response = await fetch(`/api/meetups/${params.id}`);
      const data = await response.json();
      
      console.log('Meetup data:', data);
      
      if (data.success) {
        setMeetup(data.meetup);
        
        // Check if current user is attending
        const userId = localStorage.getItem('userId');
        if (userId && data.meetup.attendees) {
          setIsJoined(data.meetup.attendees.some((a: any) => a.id === parseInt(userId)));
        }
      }
    } catch (error) {
      console.error('Error fetching meetup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const userId = localStorage.getItem('userId') || '1';
      
      const response = await fetch(`/api/meetups/${params.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId) }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsJoined(data.action === 'joined');
        fetchMeetup(); // Refresh data
      } else {
        alert(data.message || 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('Error joining:', error);
      alert('Failed to update RSVP');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!meetup) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">😕</div>
          <p className="text-gray-600">Meetup not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#FF6B9D]">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFull = meetup.attendeesCount >= meetup.maxAttendees;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Hero Image */}
      <div className="relative h-72 bg-gray-200">
        <img 
          src={meetup.imageUrl || 'https://picsum.photos/400/300?random=1'} 
          alt={meetup.title}
          className="w-full h-full object-cover"
        />
        <button 
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-xl shadow-md"
        >
          ←
        </button>
        <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {meetup.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{meetup.title}</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📅 {new Date(meetup.date).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 mt-1">
            <span>📍 {meetup.venueName}</span>
          </div>
        </div>

        {/* Host Section */}
        {meetup.host && (
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 mb-3">Hosted by</p>
            <div className="flex items-center gap-3">
              <img 
                src={meetup.host.photo || 'https://picsum.photos/100/100'} 
                className="w-12 h-12 rounded-full object-cover"
                alt={meetup.host.name}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#1A1A2E]">{meetup.host.name}</h3>
                  {meetup.host.verified && <span className="text-blue-500">✓</span>}
                </div>
                <p className="text-sm text-gray-600">Event organizer</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold mb-2 text-[#1A1A2E]">About this event</h3>
          <p className="text-gray-700 leading-relaxed">
            {meetup.description || 'No description provided.'}
          </p>
        </div>

        {/* Attendees */}
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#1A1A2E]">
              Attendees ({meetup.attendeesCount}/{meetup.maxAttendees})
            </h3>
          </div>
          <div className="flex -space-x-2 overflow-hidden">
            {meetup.attendees && meetup.attendees.length > 0 ? (
              <>
                {meetup.attendees.slice(0, 5).map((attendee, i) => (
                  <img 
                    key={i}
                    src={attendee.photo || 'https://picsum.photos/100/100'} 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    alt={attendee.name}
                  />
                ))}
                {meetup.attendeesCount > 5 && (
                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                    +{meetup.attendeesCount - 5}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No attendees yet</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-100 p-4 rounded-xl">
          <h3 className="font-semibold mb-2 text-[#1A1A2E]">Location</h3>
          <p className="text-sm text-gray-700">{meetup.address}</p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-8">
        <button
          onClick={handleJoin}
          disabled={isFull && !isJoined}
          className={`w-full py-3 rounded-full font-semibold text-lg transition-all ${
            isJoined 
              ? 'border-2 border-gray-300 text-gray-700' 
              : isFull 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-lg'
          }`}
        >
          {isJoined ? 'Leave Meetup' : isFull ? 'Event Full' : 'Join Meetup'}
        </button>
      </div>
    </div>
  );
}
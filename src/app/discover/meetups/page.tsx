'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meetup {
  id: number;
  title: string;
  category: string;
  date: string;
  venueName: string;
  imageUrl: string;
  maxAttendees: number;
  attendeesCount: number;
  host: {
    id: number;
    name: string;
    photo: string;
  };
}

const CATEGORIES = ['All', 'Sports', 'Arts', 'Food', 'Tech', 'Nightlife', 'Outdoors', 'Learning'];

export default function MeetupsPage() {
  const router = useRouter();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMeetups();
  }, [filter]);

  const fetchMeetups = async () => {
    try {
      const response = await fetch('/api/meetups');
      const data = await response.json();
      if (data.success) {
        setMeetups(data.meetups);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeetups = filter === 'All' 
    ? meetups 
    : meetups.filter(m => m.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Meetups Near You</h1>
          <button 
            onClick={() => router.push('/meetups/create')}
            className="bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md"
          >
            + Host
          </button>
        </div>
        
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Meetup Cards */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMeetups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">No meetups yet</h3>
            <p className="text-gray-600 mb-4">Be the first to create one!</p>
            <button 
              onClick={() => router.push('/meetups/create')}
              className="btn-primary"
            >
              Create Meetup
            </button>
          </div>
        ) : (
          filteredMeetups.map((meetup) => (
            <div 
              key={meetup.id}
              onClick={() => router.push(`/meetups/${meetup.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                <img 
                  src={meetup.imageUrl || 'https://picsum.photos/400/200'} 
                  alt={meetup.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-[#1A1A2E]">
                  {meetup.category}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center gap-2 text-white">
                    <img 
                      src={meetup.host?.photo || 'https://picsum.photos/100/100'} 
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      alt={meetup.host?.name}
                    />
                    <div>
                      <p className="text-sm font-medium">Hosted by {meetup.host?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 text-[#1A1A2E]">{meetup.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span>📍 {meetup.venueName}</span>
                  <span>•</span>
                  <span>📅 {new Date(meetup.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />
                    ))}
                    {meetup.attendeesCount > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                        +{meetup.attendeesCount - 3}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {meetup.attendeesCount} / {meetup.maxAttendees} spots filled
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
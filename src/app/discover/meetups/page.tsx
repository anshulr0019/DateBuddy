'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/app/components/shared';

const CATEGORIES = [
  { id: 'all', label: 'All Squads', icon: '✨' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'social', label: 'Social', icon: '🎉' },
  { id: 'food', label: 'Food & Drinks', icon: '☕' },
  { id: 'outdoors', label: 'Outdoors', icon: '🏔️' },
  { id: 'arts', label: 'Arts', icon: '🎨' },
  { id: 'tech', label: 'Tech', icon: '💻' },
];

interface Meetup {
  id: string | number;
  title: string;
  description: string;
  venueName?: string;
  location?: string;
  address?: string;
  date?: string;
  category: string;
  maxAttendees?: number;
  attendeesCount?: number;
  imageUrl?: string;
  hostName?: string;
  hostAvatar?: string;
}

export default function DiscoverMeetupsPage() {
  const router = useRouter();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    async function fetchMeetups() {
      try {
        const res = await fetch('/api/meetups');
        if (!res.ok) throw new Error('Failed to fetch meetups');
        const data = await res.json();
        if (data.success && data.meetups) {
          setMeetups(data.meetups);
        }
      } catch (err) {
        console.warn('Error fetching meetups:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetups();
  }, []);

  const filteredMeetups = meetups.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.venueName || m.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || m.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-dvh w-full bg-[#FAFBF9] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFBF9] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            
            {/* Header with notch clearance */}
            <div className="flex-shrink-0 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/80 backdrop-blur-md border-b border-[#1A1A2E]/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B9D]">Community Squads</span>
                  <h1 className="text-[24px] font-extrabold tracking-tight text-[#1A1A2E]">Discover Meetups</h1>
                </div>
                <button
                  onClick={() => router.push('/meetups/create')}
                  className="h-10 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-bold text-[13px] shadow-md shadow-[#FF6B9D]/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Host Squad</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1A1A2E]/40">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search squads, venues, or activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-[#1A1A2E]/10 text-[16px] font-medium text-[#1A1A2E] placeholder-[#1A1A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D] transition-all shadow-sm"
                />
              </div>

              {/* Category Pills Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-6 px-6">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#1A1A2E] text-white shadow-sm scale-102'
                          : 'bg-white/80 border border-[#1A1A2E]/10 text-[#1A1A2E]/70 hover:bg-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meetup Cards Container */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 scrollbar-none pb-24">
              {loading ? (
                <div className="w-full p-10 text-center rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-sm space-y-2">
                  <div className="h-6 w-6 rounded-full border-2 border-[#FF6B9D] border-t-transparent animate-spin mx-auto" />
                  <p className="text-[14px] font-semibold text-[#1A1A2E]/60">Loading squads...</p>
                </div>
              ) : filteredMeetups.length === 0 ? (
                <div className="w-full p-10 text-center rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-sm space-y-3">
                  <div className="text-[36px]">🚀</div>
                  <h3 className="text-[17px] font-bold text-[#1A1A2E]">No Squads Found</h3>
                  <p className="text-[13px] text-[#1A1A2E]/55 max-w-[260px] mx-auto">
                    Be the first one to host an activity or try changing your search filter!
                  </p>
                  <button
                    onClick={() => router.push('/meetups/create')}
                    className="mt-2 inline-flex h-11 px-5 rounded-2xl bg-[#FF6B9D] text-white text-[13px] font-bold shadow-md shadow-[#FF6B9D]/30 active:scale-95 transition-all cursor-pointer"
                  >
                    + Host a Squad
                  </button>
                </div>
              ) : (
                filteredMeetups.map((meetup) => {
                  const coverImg =
                    meetup.imageUrl ||
                    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80';
                  
                  return (
                    <div
                      key={meetup.id}
                      onClick={() => router.push(`/meetups/${meetup.id}`)}
                      className="group w-full rounded-[24px] bg-white border border-[#1A1A2E]/8 overflow-hidden shadow-[0_10px_30px_-15px_rgba(26,26,46,0.1)] hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer flex flex-col"
                    >
                      {/* Event Banner */}
                      <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                        <img
                          src={coverImg}
                          alt={meetup.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
                          {meetup.category || 'Squad'}
                        </span>

                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1A1A2E] text-[11px] font-extrabold shadow-sm">
                          👥 {meetup.attendeesCount || 1} {meetup.maxAttendees ? `/ ${meetup.maxAttendees}` : ''}
                        </span>

                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <h2 className="text-[17px] font-extrabold leading-snug drop-shadow-sm line-clamp-1">
                            {meetup.title}
                          </h2>
                        </div>
                      </div>

                      {/* Details Content */}
                      <div className="p-4 space-y-2.5">
                        <p className="text-[13px] text-[#1A1A2E]/70 line-clamp-2 leading-relaxed">
                          {meetup.description || 'Join this community squad to meet awesome people and vibe together!'}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1A1A2E]/5 text-[12px] font-medium text-[#1A1A2E]/60">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-[#FF6B9D]">📍</span>
                            <span className="truncate">{meetup.venueName || meetup.location || 'Mumbai'}</span>
                          </span>
                          
                          <span className="text-[#7B68EE] font-bold flex items-center gap-1 flex-shrink-0">
                            Join Squad →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
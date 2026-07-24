'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meetup {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  attendeesCount: number;
}

export default function DiscoverMeetupsPage() {
  const router = useRouter();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/meetups')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch meetups');
        return res.json();
      })
      .then((data) => {
        setMeetups(data.meetups || data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  }, []);

  const filteredMeetups = meetups.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-between p-6 sm:p-8 pb-24 overflow-hidden bg-[#FAFAF7] text-[#1A1A2E] font-sans mx-auto max-w-[420px]">
      {/* Aurora Background with 4 blurred color blobs & dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#FF6B9D]/20 blur-[80px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[320px] h-[320px] rounded-full bg-[#B76CFF]/20 blur-[90px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#E86AC7]/15 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#7B68EE]/15 blur-[80px]" />
        
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.20]" style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Top Header Section */}
      <div className="w-full flex items-center justify-between z-10 pt-2 mb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wide font-medium text-[#1A1A2E]/60">Community</span>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] leading-[1.05] text-[#1A1A2E]">
            Discover Meetups
          </h1>
        </div>
        <button
          onClick={() => router.push('/meetups/create')}
          className="h-12 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-medium text-[14px] shadow-[0_12px_30px_-12px_rgba(123,104,238,0.7)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </button>
      </div>

      {/* Search Input */}
      <div className="w-full z-10 mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A2E]/40">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search meetups or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/80 border border-[#1A1A2E]/10 text-[15px] text-[#1A1A2E] placeholder-[#1A1A2E]/25 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 focus:border-[#FF6B9D] transition-all shadow-sm backdrop-blur-md"
          />
        </div>
      </div>

      {/* Main Content List Container */}
      <div className="w-full z-10 flex-1 flex flex-col gap-4 overflow-y-auto pb-4">
        {loading ? (
          <div className="w-full p-12 text-center text-[15px] text-[#1A1A2E]/60 rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm">
            Loading meetups...
          </div>
        ) : error ? (
          <div className="w-full p-6 text-center text-[15px] text-red-500 rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm">
            {error}
          </div>
        ) : filteredMeetups.length === 0 ? (
          <div className="w-full p-12 text-center text-[15px] text-[#1A1A2E]/60 rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm">
            No meetups found matching your search.
          </div>
        ) : (
          filteredMeetups.map((meetup) => (
            <div
              key={meetup.id}
              onClick={() => router.push(`/meetups/${meetup.id}`)}
              className="w-full p-6 rounded-[28px] bg-white/70 border border-white/60 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(26,26,46,0.25)] hover:scale-[1.01] transition-all cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] text-[11px] uppercase tracking-wide font-medium">
                  {meetup.category || 'Meetup'}
                </span>
                <span className="text-[12px] text-[#1A1A2E]/40 font-medium">
                  {meetup.attendeesCount || 0} attending
                </span>
              </div>

              <h2 className="text-[18px] font-semibold text-[#1A1A2E] leading-snug">
                {meetup.title}
              </h2>

              <p className="text-[14px] leading-relaxed text-[#1A1A2E]/60 line-clamp-2">
                {meetup.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#1A1A2E]/5 text-[13px] text-[#1A1A2E]/60 font-medium">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#FF6B9D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {meetup.location || 'Location TBA'}
                </span>
                <span className="text-[#7B68EE] font-semibold flex items-center gap-1">
                  View Details →
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Caption */}
      <div className="w-full text-center z-10 pt-4">
        <p className="text-[12px] uppercase tracking-wide font-medium text-[#1A1A2E]/40">
          Dil Se Design System • Community
        </p>
      </div>
    </main>
  );
}
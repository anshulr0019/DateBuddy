'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuroraBackground } from '@/app/components/shared';

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
    if (params?.id) {
      fetchMeetup();
    }
  }, [params?.id]);

  const fetchMeetup = async () => {
    try {
      const response = await fetch(`/api/meetups/${params.id}`);
      const data = await response.json();
      
      if (data.success && data.meetup) {
        setMeetup(data.meetup);
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
        fetchMeetup();
      }
    } catch (error) {
      console.error('Error joining:', error);
    }
  };

  const isFull = meetup ? meetup.attendeesCount >= meetup.maxAttendees : false;

  return (
    <div className="h-dvh w-full bg-[#FAFBF9] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFBF9] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 rounded-full border-3 border-[#FF6B9D] border-t-transparent animate-spin" />
                <p className="text-[14px] font-semibold text-[#1A1A2E]/60">Loading squad details...</p>
              </div>
            ) : !meetup ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="text-[40px]">🔍</div>
                <h2 className="text-[20px] font-extrabold text-[#1A1A2E]">Squad Not Found</h2>
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-2xl bg-[#FF6B9D] text-white text-[13px] font-bold shadow-md cursor-pointer"
                >
                  ← Go Back
                </button>
              </div>
            ) : (
              <>
                {/* Scrollable Body */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pb-24">
                  {/* Hero Banner */}
                  <div className="relative h-64 w-full bg-gray-900">
                    <img
                      src={meetup.imageUrl || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80'}
                      alt={meetup.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Back Button with Notch Clearance */}
                    <button
                      onClick={() => router.back()}
                      className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md text-[#1A1A2E] shadow-lg active:scale-95 transition-all cursor-pointer z-20"
                    >
                      ←
                    </button>

                    <span className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider z-20">
                      {meetup.category}
                    </span>

                    <div className="absolute bottom-4 left-5 right-5 text-white z-20">
                      <h1 className="text-[22px] font-extrabold leading-snug drop-shadow-md">{meetup.title}</h1>
                      <p className="text-[13px] text-white/80 mt-1 flex items-center gap-1.5 font-medium">
                        <span>📍 {meetup.venueName || 'Mumbai'}</span>
                        <span>·</span>
                        <span>👥 {meetup.attendeesCount || 1} / {meetup.maxAttendees}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    {/* Date & Time Pill */}
                    <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#FF6B9D]/10 flex items-center justify-center text-[18px]">
                          📅
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#1A1A2E]">
                            {meetup.date ? new Date(meetup.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Upcoming Date'}
                          </div>
                          <div className="text-[11px] text-[#1A1A2E]/50 font-medium">
                            {meetup.date ? new Date(meetup.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '7:00 PM'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#7B68EE]/10 text-[#7B68EE] text-[11px] font-extrabold">
                        Confirmed
                      </span>
                    </div>

                    {/* Host Card */}
                    {meetup.host && (
                      <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 mb-2 block">Squad Host</span>
                        <div className="flex items-center gap-3">
                          <img
                            src={meetup.host.photo || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'}
                            className="h-12 w-12 rounded-full object-cover border border-[#1A1A2E]/10"
                            alt={meetup.host.name}
                          />
                          <div className="flex-1">
                            <h3 className="text-[15px] font-bold text-[#1A1A2E]">{meetup.host.name}</h3>
                            <p className="text-[12px] text-[#1A1A2E]/50">Community Host</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm space-y-2">
                      <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#1A1A2E]/50">About Squad</h3>
                      <p className="text-[14px] text-[#1A1A2E]/80 leading-relaxed">
                        {meetup.description || 'Join this squad for a fun group activity! Be punctual and bring good vibes.'}
                      </p>
                    </div>

                    {/* Attendees Stack */}
                    <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#1A1A2E]/50">
                          Squad Members ({meetup.attendeesCount || 1} / {meetup.maxAttendees})
                        </h3>
                      </div>
                      <div className="flex items-center -space-x-2">
                        {(meetup.attendees || []).map((att: any, idx: number) => (
                          <img
                            key={idx}
                            src={att.photo || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'}
                            alt={att.name || 'Member'}
                            className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-xs"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action CTA */}
                <div className="flex-shrink-0 p-5 bg-white/90 backdrop-blur-md border-t border-[#1A1A2E]/5 z-20">
                  <button
                    onClick={handleJoin}
                    disabled={isFull && !isJoined}
                    className={`w-full h-13 rounded-2xl font-extrabold text-[15px] shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isJoined
                        ? 'bg-white border border-[#1A1A2E]/15 text-[#1A1A2E]'
                        : isFull
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white shadow-[#FF6B9D]/30 active:scale-[0.99]'
                    }`}
                  >
                    {isJoined ? '✓ Joined Squad (Tap to Leave)' : isFull ? 'Squad Full' : 'Join Squad 🚀'}
                  </button>
                </div>
              </>
            )}

          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
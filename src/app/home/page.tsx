'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, SafeImage, VerifiedBadge } from '../components/shared';
import { useNotifications } from '../context/NotificationContext';
import { PERSONAS, DEFAULT_PERSONA } from '@/lib/personaGreeting';
import { hapticLight, hapticMedium } from '../lib/haptics';

type Pick = {
  id: number;
  name: string;
  age: number | null;
  city: string | null;
  distance: string | null;
  photos: string[];
  online: boolean;
  verified: boolean;
};

type Meetup = {
  id: number;
  title: string;
  category: string;
  venueName: string | null;
  city: string | null;
  date: string;
  maxAttendees: number | null;
  hostName: string;
  attendeesCount: number;
  joined: boolean;
};

const CATEGORIES = ['Gym', 'Badminton', 'Football', 'Running', 'Yoga'] as const;
const CATEGORY_EMOJI: Record<string, string> = {
  Gym: '🏋️ ',
  Badminton: '🏸 ',
  Football: '⚽ ',
  Running: '🏃 ',
  Yoga: '🧘 ',
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HomePage() {
  const router = useRouter();
  const { openNotifications, unreadCount, addNotification } = useNotifications();

  const [picks, setPicks] = useState<Pick[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePersona, setActivePersona] = useState({
    title: DEFAULT_PERSONA.title,
    subline: DEFAULT_PERSONA.sublines[0],
    personaId: DEFAULT_PERSONA.id,
  });
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  const [squadFilter, setSquadFilter] = useState<'All' | (typeof CATEGORIES)[number]>('All');
  const [showHostModal, setShowHostModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Meetup | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [hostTitle, setHostTitle] = useState('');
  const [hostCategory, setHostCategory] = useState<(typeof CATEGORIES)[number]>('Gym');
  const [hostVenue, setHostVenue] = useState('');
  const [hostDate, setHostDate] = useState('');
  const [hostSlots, setHostSlots] = useState(4);
  const [hostError, setHostError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const loadMeetups = useCallback(async () => {
    const res = await fetch('/api/meetups');
    const data = await res.json();
    if (data.success) setMeetups(data.meetups);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [feedRes] = await Promise.all([fetch('/api/feed'), loadMeetups()]);
        const feed = await feedRes.json();
        if (feed.success) setPicks(feed.profiles.slice(0, 4));
      } catch {
        /* sections render their own empty states */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadMeetups]);

  useEffect(() => {
    const saved = localStorage.getItem('user_active_persona');
    if (saved) {
      try {
        setActivePersona(JSON.parse(saved));
      } catch {
        /* keep default */
      }
    }
  }, []);

  const selectPersona = (id: string, title: string, subline: string) => {
    const next = { personaId: id, title, subline };
    setActivePersona(next);
    localStorage.setItem('user_active_persona', JSON.stringify(next));
    setShowPersonaPicker(false);
  };

  const filteredMeetups = meetups.filter((m) => squadFilter === 'All' || m.category === squadFilter);

  const toggleJoin = async (m: Meetup) => {
    if (m.joined) {
      setConfirmLeaveId(m.id);
      return;
    }
    setBusyId(m.id);
    try {
      const res = await fetch(`/api/meetups/${m.id}/join`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        addNotification({
          title: res.status === 409 ? 'Session Full 🔒' : 'Could not join',
          message: data.message ?? 'Please try again.',
          type: 'system',
          actionUrl: '/home',
        });
        return;
      }
      await loadMeetups();
      setSelectedDetail(null);
      addNotification({
        title: 'Session Joined! 🎉',
        message: `You joined '${m.title}' hosted by ${m.hostName}.`,
        type: 'event',
        actionUrl: '/home',
      });
    } catch {
      addNotification({
        title: 'Network error',
        message: 'Could not update your RSVP.',
        type: 'system',
        actionUrl: '/home',
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmLeave = async (id: number) => {
    const m = meetups.find((x) => x.id === id);
    setConfirmLeaveId(null);
    setBusyId(id);
    try {
      await fetch(`/api/meetups/${id}/join`, { method: 'POST' });
      await loadMeetups();
      setSelectedDetail(null);
      if (m) {
        addNotification({
          title: 'Left Session 👟',
          message: `You left '${m.title}'. Your spot has been re-opened.`,
          type: 'system',
          actionUrl: '/home',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const publishSquad = async () => {
    setHostError('');
    if (!hostTitle.trim() || !hostVenue.trim() || !hostDate) {
      setHostError('Title, venue and date are all required.');
      return;
    }
    if (new Date(hostDate).getTime() <= Date.now()) {
      setHostError('Pick a date and time in the future.');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/meetups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hostTitle.trim(),
          category: hostCategory,
          venueName: hostVenue.trim(),
          date: new Date(hostDate).toISOString(),
          maxAttendees: hostSlots,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setHostError(data.message ?? 'Could not publish this session.');
        return;
      }

      await loadMeetups();
      setShowHostModal(false);
      setHostTitle('');
      setHostVenue('');
      setHostDate('');
      addNotification({
        title: 'Session Published! 🚀',
        message: `'${data.meetup.title}' is live. Activity partners can now join!`,
        type: 'system',
        actionUrl: '/home',
      });
    } catch {
      setHostError('Network error. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-extrabold tracking-tight text-[#1E293B]">
                    {activePersona.title}
                  </h1>
                  <button
                    onClick={() => setShowPersonaPicker(true)}
                    className="px-2.5 py-0.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] text-[10px] font-bold uppercase tracking-wider hover:bg-[#F43F5E] hover:text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Vibe
                  </button>
                </div>
                <p className="text-[12.5px] text-[#1E293B]/60 font-medium mt-0.5">
                  &ldquo;{activePersona.subline}&rdquo;
                </p>
              </div>

              <button
                onClick={openNotifications}
                aria-label="Open notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-gray-200/70 shadow-2xs hover:bg-gray-50 transition-all duration-200 active:scale-90 cursor-pointer"
              >
                <Ic.Bell />
                {unreadCount > 0 && (
                  <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#F43F5E] ring-2 ring-white shadow-2xs" />
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] space-y-6">

              {/* TODAY'S PICKS */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Today&apos;s Picks</h2>
                  <button onClick={() => router.push('/discover')} className="text-[12px] font-bold text-[#F43F5E] hover:underline cursor-pointer">
                    View All &rarr;
                  </button>
                </div>

                {loading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 rounded-3xl bg-white/60 animate-pulse" />
                    ))}
                  </div>
                )}

                {!loading && picks.length === 0 && (
                  <GlassCard className="p-5 text-center border border-gray-200/70">
                    <p className="text-[13.5px] font-bold text-[#1E293B]/70">No new profiles right now</p>
                    <p className="text-[12px] text-[#1E293B]/50 mt-1">Check back soon, or widen your filters in Discover.</p>
                  </GlassCard>
                )}

                <div className="space-y-3">
                  {picks.map((person, i) => (
                    <GlassCard
                      key={person.id}
                      onClick={() => router.push('/discover')}
                      className="animate-bubble-enter p-3.5 overflow-hidden border border-gray-200/70 hover:border-[#F43F5E]/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xs">
                          <SafeImage src={person.photos[0] ?? null} name={person.name} alt={person.name} className="h-full w-full object-cover" />
                          {person.online && <OnlineDot className="absolute bottom-1 right-1 h-3.5 w-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="text-[15.5px] font-bold text-[#1E293B] truncate">
                              {person.name}{person.age ? `, ${person.age}` : ''}
                            </h3>
                            {person.verified && <VerifiedBadge />}
                          </div>
                          {(person.distance || person.city) && (
                            <div className="flex items-center gap-1 text-[#1E293B]/45 text-[11px]">
                              <Ic.MapPin />
                              <span>{person.distance ?? person.city}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/discover');
                          }}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs"
                          aria-label="Connect"
                        >
                          <Ic.Heart filled />
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>

              {/* ACTIVITY SQUADS */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Gym &amp; Activity Squads</h2>
                    <p className="text-[11.5px] text-[#1E293B]/55 font-medium">Find workout partners &amp; sports sessions nearby</p>
                  </div>
                  <button
                    onClick={() => setShowHostModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] text-[12px] font-bold hover:bg-[#F43F5E] hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>+ Host</span>
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                  {(['All', ...CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { hapticLight(); setSquadFilter(cat); }}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all duration-200 flex-shrink-0 cursor-pointer ${
                        squadFilter === cat
                          ? 'bg-[#F43F5E] text-white shadow-2xs scale-105'
                          : 'bg-white border border-gray-200/80 text-[#1E293B]/60 hover:text-[#1E293B] hover:bg-gray-50'
                      }`}
                    >
                      {CATEGORY_EMOJI[cat] ?? ''}{cat}
                    </button>
                  ))}
                </div>

                {!loading && filteredMeetups.length === 0 && (
                  <GlassCard className="p-5 text-center border border-gray-200/70">
                    <p className="text-[13.5px] font-bold text-[#1E293B]/70">No sessions here yet</p>
                    <p className="text-[12px] text-[#1E293B]/50 mt-1">Be the first — tap <span className="font-bold">+ Host</span> to start one.</p>
                  </GlassCard>
                )}

                <div className="space-y-3">
                  {filteredMeetups.map((m, i) => {
                    const capacity = m.maxAttendees ?? 10;
                    const isFull = m.attendeesCount >= capacity;

                    return (
                      <GlassCard
                        key={m.id}
                        onClick={() => setSelectedDetail(m)}
                        className="animate-bubble-enter p-4 border border-gray-200/70 hover:border-[#F43F5E]/30 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.99] group"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div>
                            <p className="text-[14.5px] font-bold text-[#1E293B] leading-snug group-hover:text-[#F43F5E] transition-colors">{m.title}</p>
                            <p className="text-[11.5px] text-[#1E293B]/55">Hosted by <span className="font-semibold text-[#1E293B]">{m.hostName}</span></p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[10.5px] font-bold text-[#F43F5E] flex-shrink-0">
                            {m.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 rounded-xl bg-gray-50/80 border border-gray-100 text-[12px] text-[#1E293B]/70">
                          <div className="flex items-center gap-1.5 truncate">
                            <Ic.MapPin className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0" />
                            <span className="truncate">{m.venueName ?? m.city ?? 'TBA'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Ic.Clock className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0" />
                            <span className="truncate">{formatWhen(m.date)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="text-[11.5px] font-bold text-[#1E293B]/65">
                            {m.attendeesCount} / {capacity} Joined
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleJoin(m);
                            }}
                            disabled={busyId === m.id || (isFull && !m.joined)}
                            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs disabled:opacity-60 ${
                              m.joined
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                : isFull
                                ? 'bg-gray-100 border border-gray-200 text-gray-500'
                                : 'bg-[#F43F5E] text-white hover:bg-[#E11D48]'
                            }`}
                          >
                            {m.joined ? 'Joined ✓' : isFull ? 'Full 🔒' : 'Join'}
                          </button>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>

              {/* EVENTS NEAR YOU */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Events Near You</h2>
                  <button onClick={() => router.push('/discover/meetups')} className="text-[12px] font-bold text-[#F43F5E] hover:underline cursor-pointer">
                    See All Events &rarr;
                  </button>
                </div>

                {!loading && meetups.length === 0 ? (
                  <GlassCard className="p-5 text-center border border-gray-200/70">
                    <p className="text-[13.5px] font-bold text-[#1E293B]/70">No upcoming events</p>
                  </GlassCard>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    {meetups.map((e, i) => (
                      <GlassCard
                        key={e.id}
                        onClick={() => router.push(`/meetups/${e.id}`)}
                        className="animate-bubble-enter min-w-[250px] max-w-[270px] p-4 flex-shrink-0 snap-start border border-gray-200/70 hover:border-[#F43F5E]/30 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]"
                        style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 shadow-2xs">
                            <Ic.Compass className="w-5 h-5 text-[#F43F5E]" />
                          </div>
                          <span className="rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-2.5 py-0.5 text-[10px] font-bold text-[#F43F5E]">
                            {e.category}
                          </span>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1E293B] leading-tight mb-1">{e.title}</p>
                          <p className="text-[12px] text-[#1E293B]/55">{formatWhen(e.date)} · {e.attendeesCount} going</p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </AuroraBackground>
      </div>

      {/* PERSONA PICKER */}
      {showPersonaPicker && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setShowPersonaPicker(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-5 space-y-4 max-h-[80dvh] flex flex-col shadow-2xl animate-sheet-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#1E293B]">Your Vibe</h3>
                <p className="text-[12px] text-[#1E293B]/50">Pick how you&apos;re showing up today</p>
              </div>
              <button
                onClick={() => setShowPersonaPicker(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {[DEFAULT_PERSONA, ...PERSONAS].map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPersona(p.id, p.title, p.sublines[0])}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    activePersona.personaId === p.id
                      ? 'border-[#F43F5E] bg-[#FFF0F4] shadow-2xs'
                      : 'border-gray-200/80 bg-gray-50/50 hover:bg-gray-100/60'
                  }`}
                >
                  <div>
                    <p className="text-[14.5px] font-bold text-[#1E293B]">{p.title}</p>
                    <p className="text-[12px] text-[#1E293B]/60 mt-0.5">&ldquo;{p.sublines[0]}&rdquo;</p>
                  </div>
                  {activePersona.personaId === p.id && (
                    <span className="text-[12px] font-bold text-[#F43F5E]">Active ✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOST MODAL */}
      {showHostModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setShowHostModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] max-h-[88dvh] flex flex-col shadow-2xl animate-sheet-up">
            {/* handle */}
            <div className="pt-3 pb-0 flex-shrink-0 flex justify-center">
              <div className="h-1 w-10 bg-gray-300 rounded-full" />
            </div>
            {/* header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#1E293B]">Host a Squad Session</h3>
                <p className="text-[12px] text-[#1E293B]/50">Find gym partners &amp; activity teammates</p>
              </div>
              <button
                onClick={() => setShowHostModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>

            {/* scrollable fields */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 scrollbar-none text-[13px] min-h-0">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Activity Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setHostCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                        hostCategory === cat
                          ? 'bg-[#F43F5E] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {CATEGORY_EMOJI[cat]}{cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Session Title</label>
                <input
                  type="text"
                  value={hostTitle}
                  onChange={(e) => setHostTitle(e.target.value)}
                  placeholder="e.g. Leg Day & Heavy Squats 🏋️"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#F43F5E] focus:bg-white text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Venue / Location</label>
                <input
                  type="text"
                  value={hostVenue}
                  onChange={(e) => setHostVenue(e.target.value)}
                  placeholder="e.g. Cult.fit Gym, Bandra West"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#F43F5E] focus:bg-white text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={hostDate}
                  onChange={(e) => setHostDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#F43F5E] focus:bg-white text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Partner Slots</label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHostSlots(num)}
                      className={`flex-1 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                        hostSlots === num ? 'bg-[#F43F5E] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* sticky footer — always visible above safe-area */}
            <div className="flex-shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-gray-100 bg-white rounded-b-[32px] sm:rounded-b-[28px] space-y-2">
              {hostError && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[12px] font-semibold text-red-600">
                  {hostError}
                </p>
              )}
              <button
                onClick={publishSquad}
                disabled={publishing}
                className="w-full py-3 rounded-2xl bg-[#F43F5E] text-white font-extrabold text-[14px] shadow-md hover:bg-[#E11D48] active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {publishing ? 'Publishing…' : 'Publish Squad Session 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SHEET */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setSelectedDetail(null)}
            className="absolute inset-0 bg-black/45 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-5 space-y-4 max-h-[90dvh] flex flex-col shadow-2xl animate-sheet-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />

            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#1E293B] leading-tight">{selectedDetail.title}</h3>
                <p className="text-[12px] text-[#1E293B]/60 font-medium">
                  Hosted by <span className="font-bold text-[#1E293B]">{selectedDetail.hostName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none text-[13px]">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2">
                  <Ic.MapPin className="w-4 h-4 text-[#F43F5E]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Venue</p>
                    <p className="text-[12.5px] font-bold text-[#1E293B] truncate">{selectedDetail.venueName ?? selectedDetail.city ?? 'TBA'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ic.Clock className="w-4 h-4 text-[#F43F5E]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">When</p>
                    <p className="text-[12.5px] font-bold text-[#1E293B] truncate">{formatWhen(selectedDetail.date)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">
                  Attendees ({selectedDetail.attendeesCount} / {selectedDetail.maxAttendees ?? 10})
                </p>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {Math.max(0, (selectedDetail.maxAttendees ?? 10) - selectedDetail.attendeesCount)} Spots Left
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => toggleJoin(selectedDetail)}
                  disabled={busyId === selectedDetail.id}
                  className={`w-full py-3 rounded-2xl text-[14px] font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-60 ${
                    selectedDetail.joined
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : selectedDetail.attendeesCount >= (selectedDetail.maxAttendees ?? 10)
                      ? 'bg-gray-100 border border-gray-200 text-gray-500'
                      : 'bg-[#F43F5E] text-white hover:bg-[#E11D48]'
                  }`}
                >
                  {selectedDetail.joined
                    ? 'Joined ✓ (Tap to Leave)'
                    : selectedDetail.attendeesCount >= (selectedDetail.maxAttendees ?? 10)
                    ? 'Session Full 🔒'
                    : 'Join Session 🚀'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LEAVE */}
      {confirmLeaveId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-popover-enter">
          <div className="w-full max-w-[340px] bg-white rounded-[28px] p-5 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center text-xl font-bold">
              👟
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#1E293B]">Leave Session?</h3>
              <p className="text-[12.5px] text-gray-500 mt-1">
                Your spot will be re-opened for someone else to join.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmLeaveId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmLeave(confirmLeaveId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

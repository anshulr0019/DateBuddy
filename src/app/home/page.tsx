'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, EVENTS, GYM_SQUADS, GymSquad } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, SafeImage, VerifiedBadge } from '../components/shared';
import { useNotifications } from '../context/NotificationContext';
import { PERSONAS, DEFAULT_PERSONA, computePersona, UserBehaviorData } from '@/lib/personaGreeting';

export default function HomePage() {
  const router = useRouter();
  const { openNotifications, unreadCount, addNotification } = useNotifications();
  const todaysPicks = PEOPLE.slice(0, 4);

  const [activePersona, setActivePersona] = useState<{ title: string; subline: string; personaId: string }>({
    title: 'Flirt Mode 😏',
    subline: 'Behaving today?',
    personaId: 'flirt_mode',
  });

  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  // Squads & Activity Buddies State
  const [squads, setSquads] = useState<GymSquad[]>(GYM_SQUADS);
  const [squadFilter, setSquadFilter] = useState<'All' | 'Gym' | 'Badminton' | 'Football' | 'Running' | 'Yoga'>('All');
  const [showHostModal, setShowHostModal] = useState(false);
  const [selectedDetailSquad, setSelectedDetailSquad] = useState<GymSquad | null>(null);
  const [confirmLeaveSquadId, setConfirmLeaveSquadId] = useState<number | null>(null);

  const [hostTitle, setHostTitle] = useState('');
  const [hostCategory, setHostCategory] = useState<'Gym' | 'Badminton' | 'Football' | 'Running' | 'Yoga'>('Gym');
  const [hostVenue, setHostVenue] = useState('');
  const [hostTimeSlot, setHostTimeSlot] = useState('');
  const [hostSlots, setHostSlots] = useState(4);

  const filteredSquads = squads.filter((s) => squadFilter === 'All' || s.category === squadFilter);

  // Handle Joining & Leaving Logic across all cases
  const handleToggleJoinSquad = (sq: GymSquad) => {
    if (sq.joined) {
      // Case E: Prompt Leave Confirmation
      setConfirmLeaveSquadId(sq.id);
      return;
    }

    // Case D: Full Capacity Check
    if (sq.joinedSlots >= sq.maxSlots) {
      addNotification({
        title: 'Waitlist Joined ⏳',
        message: `You are on the waitlist for '${sq.title}'. You'll be notified if a spot opens up!`,
        emoji: '⏳',
        actionUrl: '/home',
      });
      return;
    }

    // Case A & B: Join Success & Dispatch Notifications
    setSquads((prev) =>
      prev.map((item) => {
        if (item.id === sq.id) {
          const nextAttendees = [
            ...item.attendees,
            { id: 1, name: 'Priya Sharma (You)', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces', role: 'member' as const },
          ];
          return {
            ...item,
            joined: true,
            joinedSlots: item.joinedSlots + 1,
            attendees: nextAttendees,
          };
        }
        return item;
      })
    );

    // Also update selectedDetailSquad if open
    if (selectedDetailSquad?.id === sq.id) {
      setSelectedDetailSquad((prev) =>
        prev
          ? {
              ...prev,
              joined: true,
              joinedSlots: prev.joinedSlots + 1,
              attendees: [
                ...prev.attendees,
                { id: 1, name: 'Priya Sharma (You)', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces', role: 'member' },
              ],
            }
          : null
      );
    }

    // Dispatch real-time in-app notification to attendee
    addNotification({
      title: 'Squad Joined! 🎉',
      message: `You joined '${sq.title}' with ${sq.hostName}. Squad chat unlocked in Messages!`,
      type: 'event',
      avatar: sq.hostAvatar,
      actionUrl: `/chat/${sq.hostId}`,
    });
  };

  // Confirm Leaving Squad
  const handleConfirmLeave = (id: number) => {
    const sq = squads.find((s) => s.id === id);
    setSquads((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            joined: false,
            joinedSlots: Math.max(1, item.joinedSlots - 1),
            attendees: item.attendees.filter((a) => a.id !== 1),
          };
        }
        return item;
      })
    );

    if (selectedDetailSquad?.id === id) {
      setSelectedDetailSquad((prev) =>
        prev
          ? {
              ...prev,
              joined: false,
              joinedSlots: Math.max(1, prev.joinedSlots - 1),
              attendees: prev.attendees.filter((a) => a.id !== 1),
            }
          : null
      );
    }

    setConfirmLeaveSquadId(null);

    if (sq) {
      addNotification({
        title: 'Left Squad 👟',
        message: `You left '${sq.title}'. ${sq.hostName} was notified to re-open the spot.`,
        type: 'system',
        actionUrl: '/home',
      });
    }
  };

  const handlePublishSquad = async () => {
    if (!hostTitle.trim() || !hostVenue.trim()) return;
    const newSquad: GymSquad = {
      id: Date.now(),
      hostId: 1,
      title: hostTitle.trim(),
      category: hostCategory,
      hostName: 'Priya Sharma',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces',
      venue: hostVenue.trim(),
      timeSlot: hostTimeSlot.trim() || 'Today · 7:00 PM',
      level: 'All Levels',
      equipment: 'Bring your own workout gear',
      rules: 'Be punctual & bring positive energy!',
      maxSlots: hostSlots || 4,
      joinedSlots: 1,
      joined: true,
      attendees: [
        { id: 1, name: 'Priya Sharma (Host)', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces', role: 'host' },
      ],
    };

    // Save to PostgreSQL Database
    try {
      await fetch('/api/meetups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: hostTitle.trim(),
          category: hostCategory,
          venueName: hostVenue.trim(),
          maxAttendees: hostSlots || 4,
        }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    setSquads((prev) => [newSquad, ...prev]);
    setShowHostModal(false);
    setHostTitle('');
    setHostVenue('');
    setHostTimeSlot('');

    addNotification({
      title: 'Squad Published! 🚀',
      message: `'${newSquad.title}' is live on the Home feed. Activity partners can now join!`,
      type: 'system',
      actionUrl: '/home',
    });
  };

  useEffect(() => {
    try {
      const savedPersona = localStorage.getItem('user_active_persona');
      if (savedPersona) {
        setActivePersona(JSON.parse(savedPersona));
      } else {
        const currentHour = new Date().getHours();
        const mockData: UserBehaviorData = {
          daysInactive: 0,
          matchesReceivedSpike: false,
          profileViewsSpike: false,
          emojiCount: 8,
          avgReplyTimeMinutes: 3,
          outgoingMessageRate: 15,
          avgMessageLength: 60,
          replyRate: 0.8,
          longChatDuration: false,
          swipeLikeRatio: 0.4,
          matchSuccessRate: 0.5,
          sessionTimeBuckets: {
            earlyMorning: currentHour >= 5 && currentHour < 9 ? 5 : 1,
            day: currentHour >= 9 && currentHour < 17 ? 5 : 1,
            evening: currentHour >= 17 && currentHour < 22 ? 5 : 1,
            lateNight: (currentHour >= 22 || currentHour < 3) ? 8 : 1,
          },
          profileViewsCount: 10,
          likesSentCount: 12,
          messagesSentCount: 15,
        };

        const computed = computePersona(mockData);
        setActivePersona(computed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectPersona = (id: string, title: string, subline: string) => {
    const next = { personaId: id, title, subline };
    setActivePersona(next);
    localStorage.setItem('user_active_persona', JSON.stringify(next));
    setShowPersonaPicker(false);
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            
            {/* FIXED TOP HEADER (Behavior Persona Greeting & Notifications) */}
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

            {/* SCROLLABLE FEED BODY */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] space-y-6">
              
              {/* TODAY'S PICKS SECTION */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Today&apos;s Picks</h2>
                  <button onClick={() => router.push('/discover')} className="text-[12px] font-bold text-[#F43F5E] hover:underline cursor-pointer">
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {todaysPicks.map((person, i) => (
                    <GlassCard
                      key={person.id}
                      onClick={() => router.push('/discover')}
                      className="animate-bubble-enter p-3.5 overflow-hidden border border-gray-200/70 hover:border-[#F43F5E]/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Avatar */}
                        <div className="relative h-18 w-18 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xs">
                          <SafeImage src={person.photo} name={person.name} alt={person.name} className="h-full w-full object-cover" />
                          {person.online && <OnlineDot className="absolute bottom-1 right-1 h-3.5 w-3.5" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="text-[15.5px] font-bold text-[#1E293B] truncate">{person.name}, {person.age}</h3>
                            {person.verified && <VerifiedBadge />}
                          </div>
                          <p className="text-[12px] text-[#1E293B]/60 truncate mb-1">{person.profession}</p>
                          <div className="flex items-center gap-1 text-[#1E293B]/45 text-[11px]">
                            <Ic.MapPin />
                            <span>{person.distance}</span>
                          </div>
                        </div>

                        {/* Connect Button */}
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

              {/* GYM & ACTIVITY SQUADS (HUDDLE STYLE) SECTION */}
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

                {/* Filter horizontal pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                  {(['All', 'Gym', 'Badminton', 'Football', 'Running', 'Yoga'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSquadFilter(cat)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all duration-200 flex-shrink-0 cursor-pointer ${
                        squadFilter === cat
                          ? 'bg-[#F43F5E] text-white shadow-2xs scale-105'
                          : 'bg-white border border-gray-200/80 text-[#1E293B]/60 hover:text-[#1E293B] hover:bg-gray-50'
                      }`}
                    >
                      {cat === 'Gym' && '🏋️ '}
                      {cat === 'Badminton' && '🏸 '}
                      {cat === 'Football' && '⚽ '}
                      {cat === 'Running' && '🏃 '}
                      {cat === 'Yoga' && '🧘 '}
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Squad Cards Feed */}
                <div className="space-y-3">
                  {filteredSquads.map((sq, i) => {
                    const isFull = sq.joinedSlots >= sq.maxSlots;

                    return (
                      <GlassCard
                        key={sq.id}
                        onClick={() => setSelectedDetailSquad(sq)}
                        className="animate-bubble-enter p-4 border border-gray-200/70 hover:border-[#F43F5E]/30 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.99] group"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200/80 shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                              <SafeImage src={sq.hostAvatar} name={sq.hostName} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <p className="text-[14.5px] font-bold text-[#1E293B] leading-snug group-hover:text-[#F43F5E] transition-colors">{sq.title}</p>
                              <p className="text-[11.5px] text-[#1E293B]/55">Hosted by <span className="font-semibold text-[#1E293B]">{sq.hostName}</span></p>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[10.5px] font-bold text-[#F43F5E] flex-shrink-0">
                            {sq.level}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 rounded-xl bg-gray-50/80 border border-gray-100 text-[12px] text-[#1E293B]/70">
                          <div className="flex items-center gap-1.5 truncate">
                            <Ic.MapPin className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0" />
                            <span className="truncate">{sq.venue}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Ic.Clock className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0" />
                            <span className="truncate">{sq.timeSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          {/* Attendee Avatar Stack */}
                          <div className="flex items-center -space-x-2">
                            {sq.attendees.map((att, idx) => (
                              <div key={idx} className="h-6 w-6 rounded-full overflow-hidden border-2 border-white shadow-2xs">
                                <SafeImage src={att.avatar} name={att.name} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                            <span className="text-[11.5px] font-bold text-[#1E293B]/65 ml-3">
                              {sq.joinedSlots} / {sq.maxSlots} Joined
                            </span>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {sq.joined && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/chat/${sq.hostId}`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-[#1E293B] text-[11.5px] font-bold hover:bg-gray-200 active:scale-95 transition-all cursor-pointer shadow-2xs"
                                  title="Direct message host"
                                >
                                  Host 💬
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push('/messages');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] text-[11.5px] font-bold hover:bg-[#F43F5E] hover:text-white active:scale-95 transition-all cursor-pointer shadow-2xs"
                                  title="Squad group room"
                                >
                                  Squad 👥
                                </button>
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleJoinSquad(sq);
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                                sq.joined
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  : isFull
                                  ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-[#F43F5E] text-white hover:bg-[#E11D48]'
                              }`}
                            >
                              {sq.joined ? 'Joined ✓' : isFull ? 'Squad Full 🔒' : 'Join Squad'}
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>

              {/* EVENTS NEAR YOU SECTION */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Events Near You</h2>
                  <button onClick={() => router.push('/discover/meetups')} className="text-[12px] font-bold text-[#F43F5E] hover:underline cursor-pointer">
                    See All Events &rarr;
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {EVENTS.map((e, i) => (
                    <GlassCard
                      key={e.id}
                      onClick={() => router.push('/discover/meetups')}
                      className="animate-bubble-enter min-w-[250px] max-w-[270px] p-4 flex-shrink-0 snap-start border border-gray-200/70 hover:border-[#F43F5E]/30 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98]"
                      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 shadow-2xs">
                          <Ic.Compass className="w-5 h-5 text-[#F43F5E]" />
                        </div>
                        <span className="rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-2.5 py-0.5 text-[10px] font-bold text-[#F43F5E]">
                          {e.tag}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#1E293B] leading-tight mb-1">{e.title}</p>
                        <p className="text-[12px] text-[#1E293B]/55">{e.date} · {e.attendees} going</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </AuroraBackground>
      </div>

      {/* PERSONA PICKER MODAL */}
      {showPersonaPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setShowPersonaPicker(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-5 space-y-4 max-h-[80dvh] flex flex-col shadow-2xl animate-popover-enter">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#1E293B]">Behavior Persona Engine</h3>
                <p className="text-[12px] text-[#1E293B]/50">Select or preview user personas</p>
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

      {/* HOST SQUAD MODAL */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setShowHostModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-5 space-y-4 max-h-[85dvh] flex flex-col shadow-2xl animate-popover-enter">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
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

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none text-[13px]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Select Activity Category</label>
                <div className="flex flex-wrap gap-2">
                  {(['Gym', 'Badminton', 'Football', 'Running', 'Yoga'] as const).map((cat) => (
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
                      {cat === 'Gym' && '🏋️ '}
                      {cat === 'Badminton' && '🏸 '}
                      {cat === 'Football' && '⚽ '}
                      {cat === 'Running' && '🏃 '}
                      {cat === 'Yoga' && '🧘 '}
                      {cat}
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Venue / Gym Location</label>
                <input
                  type="text"
                  value={hostVenue}
                  onChange={(e) => setHostVenue(e.target.value)}
                  placeholder="e.g. Cult.fit Gym, Bandra West"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#F43F5E] focus:bg-white text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date &amp; Time Slot</label>
                <input
                  type="text"
                  value={hostTimeSlot}
                  onChange={(e) => setHostTimeSlot(e.target.value)}
                  placeholder="e.g. Today · 6:30 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#F43F5E] focus:bg-white text-[16px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Partner Slots Required</label>
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
                      {num} Slots
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePublishSquad}
                className="w-full py-3 rounded-2xl bg-[#F43F5E] text-white font-extrabold text-[14px] shadow-md hover:bg-[#E11D48] active:scale-95 transition-all cursor-pointer mt-2"
              >
                Publish Squad Session 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RICH SQUAD DETAIL SHEET MODAL (CASE F & ALL CONTACT OPTIONS) */}
      {selectedDetailSquad && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div
            onClick={() => setSelectedDetailSquad(null)}
            className="absolute inset-0 bg-black/45 backdrop-blur-md transition-all duration-300"
          />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] p-5 space-y-4 max-h-[90dvh] flex flex-col shadow-2xl animate-popover-enter">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs flex-shrink-0">
                  <SafeImage src={selectedDetailSquad.hostAvatar} name={selectedDetailSquad.hostName} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#1E293B] leading-tight">{selectedDetailSquad.title}</h3>
                  <p className="text-[12px] text-[#1E293B]/60 font-medium">Hosted by <span className="font-bold text-[#1E293B]">{selectedDetailSquad.hostName}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailSquad(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Detail Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none text-[13px]">
              {/* Session Meta Badges */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2">
                  <Ic.MapPin className="w-4 h-4 text-[#F43F5E]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Venue</p>
                    <p className="text-[12.5px] font-bold text-[#1E293B] truncate">{selectedDetailSquad.venue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ic.Clock className="w-4 h-4 text-[#F43F5E]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Time Slot</p>
                    <p className="text-[12.5px] font-bold text-[#1E293B] truncate">{selectedDetailSquad.timeSlot}</p>
                  </div>
                </div>
              </div>

              {/* Equipment & Guidelines */}
              {selectedDetailSquad.equipment && (
                <div className="p-3.5 rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#F43F5E]">Required Equipment</p>
                  <p className="text-[13px] text-[#2D1B28] font-medium">{selectedDetailSquad.equipment}</p>
                </div>
              )}

              {selectedDetailSquad.rules && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Session Guidelines</p>
                  <p className="text-[12.5px] text-gray-700">{selectedDetailSquad.rules}</p>
                </div>
              )}

              {/* Live Attendees Roster */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Confirmed Attendees ({selectedDetailSquad.joinedSlots} / {selectedDetailSquad.maxSlots})</p>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {selectedDetailSquad.maxSlots - selectedDetailSquad.joinedSlots} Spots Left
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedDetailSquad.attendees.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200/70 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200">
                          <SafeImage src={att.avatar} name={att.name} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-[13px] font-bold text-[#1E293B]">{att.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        att.role === 'host' ? 'bg-[#FFF0F4] text-[#F43F5E] border border-[#F9C0D0]/60' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {att.role === 'host' ? 'Host 👑' : 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Communication Bar */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedDetailSquad(null);
                      router.push(`/chat/${selectedDetailSquad.hostId}`);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gray-100 text-[#1E293B] text-[12.5px] font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Message Host 💬</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDetailSquad(null);
                      router.push('/messages');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] text-[12.5px] font-bold hover:bg-[#F43F5E] hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Squad Group 👥</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleJoinSquad(selectedDetailSquad)}
                  className={`w-full py-3 rounded-2xl text-[14px] font-extrabold transition-all cursor-pointer shadow-md ${
                    selectedDetailSquad.joined
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : selectedDetailSquad.joinedSlots >= selectedDetailSquad.maxSlots
                      ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                      : 'bg-[#F43F5E] text-white hover:bg-[#E11D48]'
                  }`}
                >
                  {selectedDetailSquad.joined ? 'Joined ✓ (Tap to Leave)' : selectedDetailSquad.joinedSlots >= selectedDetailSquad.maxSlots ? 'Squad Full (Join Waitlist ⏳)' : 'Join Squad Session 🚀'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM LEAVE DIALOG (CASE E) */}
      {confirmLeaveSquadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-popover-enter">
          <div className="w-full max-w-[340px] bg-white rounded-[28px] p-5 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center text-xl font-bold">
              👟
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#1E293B]">Leave Squad?</h3>
              <p className="text-[12.5px] text-gray-500 mt-1">
                Are you sure you want to leave this session? The host will be notified to re-open your spot to waitlisted members.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmLeaveSquadId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmLeave(confirmLeaveSquadId)}
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

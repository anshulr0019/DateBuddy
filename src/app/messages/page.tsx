'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CONVOS } from '../data/mockData';
import { Ic, WhatsAppDoubleTick } from '../components/icons';
import { AuroraBackground, SafeImage } from '../components/shared';
import { useNotifications } from '../context/NotificationContext';

export default function MessagesPage() {
  const router = useRouter();
  const { openNotifications, unreadCount } = useNotifications();
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<any[]>(() => {
    return CONVOS.map(c => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(`last_msg_${c.id}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            return {
              ...c,
              lastMsg: parsed.lastMsg || c.lastMsg,
              time: parsed.time || c.time,
            };
          }
        }
      } catch {
        /* ignore */
      }
      return c;
    });
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (data.success && data.conversations && data.conversations.length > 0) {
          const merged = data.conversations.map((c: any) => {
            try {
              const saved = localStorage.getItem(`last_msg_${c.id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                return {
                  ...c,
                  lastMsg: parsed.lastMsg || c.lastMsg,
                  time: parsed.time || c.time,
                };
              }
            } catch {
              /* ignore */
            }
            return c;
          });
          setConversations(merged);
        }
      } catch (err) {
        console.warn('⚠️ Error loading conversations:', err);
      }
    }
    loadConversations();
  }, []);

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-dvh w-full bg-[#FAFBF9] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFBF9] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            
            {/* SMOOTH BLENDED HEADER & SEARCH */}
            <div className="flex-shrink-0 z-20 px-5 pt-[max(3rem,calc(1.25rem+env(safe-area-inset-top,0px)))] pb-3.5 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-xs">
              <div className="mb-3.5 flex items-center justify-between">
                <h1 className="text-[26px] font-extrabold tracking-tight text-[#191C1E]">Chats</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openNotifications}
                    aria-label="Open notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/70 border border-white/80 shadow-xs hover:bg-white transition-all cursor-pointer backdrop-blur-md"
                  >
                    <Ic.Bell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#F43F5E] text-[8px] font-bold text-white ring-2 ring-white shadow-xs px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="h-11 w-full rounded-2xl border border-white/60 bg-white/50 pl-11 pr-4 text-[16px] text-[#191C1E] placeholder-gray-400 outline-none backdrop-blur-md transition-all focus:bg-white/90 focus:ring-2 focus:ring-[#F43F5E]/20"
                />
              </div>
            </div>

            {/* CONVERSATION LIST */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-3 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
              {loading ? (
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-[22px] bg-white/50 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-[#F43F5E] mb-4 shadow-sm text-2xl">
                    💬
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1A1A2E] mb-1">No chats yet</h3>
                  <p className="text-[14px] text-[#1A1A2E]/55 max-w-[260px] leading-relaxed mb-6">
                    {search ? 'No matches found for your search.' : 'Start discovering profiles and when you both like each other, your conversations will appear here!'}
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    Start Discovering ✨
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/chat/${c.id}`)}
                      className="animate-float-in relative flex w-full items-center gap-3.5 rounded-[22px] p-3 text-left transition-all hover:bg-white/70 active:scale-[0.99] cursor-pointer border border-transparent hover:border-white/60"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      {/* Avatar */}
                      <div className="relative h-13 w-13 flex-shrink-0 overflow-hidden rounded-full border border-white/60 shadow-xs">
                        <SafeImage src={c.photo} name={c.name} alt={c.name} className="h-full w-full object-cover" />
                        {c.online && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#22C55E] ring-2 ring-white shadow-xs" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-bold text-[#191C1E] leading-tight truncate">{c.name}</span>
                          <span className="text-[11.5px] font-medium text-gray-400 flex-shrink-0">{c.time}</span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between">
                          <span className={`truncate text-[13px] ${c.unread > 0 ? 'text-[#191C1E] font-bold' : 'text-gray-400 font-normal'}`}>
                            {c.lastMsg}
                          </span>

                          {c.unread > 0 ? (
                            <div className="ml-2 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-[#F43F5E] px-1.5 text-[11px] font-bold text-white shadow-xs">
                              {c.unread}
                            </div>
                          ) : (
                            <div className="ml-2 flex items-center">
                              <WhatsAppDoubleTick className="w-4 h-3.5 text-[#F43F5E]" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}

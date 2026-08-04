'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuroraBackground, SafeImage } from '../../components/shared';
import { PEOPLE } from '../../data/mockData';
import { Ic, WhatsAppTicks } from '../../components/icons';

interface Message {
  id: string;
  senderId: number;
  type: 'text' | 'voice' | 'photo' | 'location' | 'gift';
  text?: string;
  voiceDuration?: string;
  photoUrl?: string;
  locationName?: string;
  locationAddress?: string;
  giftTitle?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'seen';
  reaction?: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', senderId: 1, type: 'text', text: "Hey Wade! Hope you're having a good day ✨", timestamp: '9:20 AM', status: 'seen' },
  { id: '2', senderId: 2, type: 'text', text: "Hey! Working on some new UI designs. How about you?", timestamp: '9:22 AM', status: 'seen' },
  { id: '3', senderId: 1, type: 'text', text: "Are we still on for coffee today at Café Zoe?", timestamp: '9:24 AM', status: 'seen' },
  { id: '4', senderId: 2, type: 'location', locationName: 'Café Zoe', locationAddress: 'Mathuradas Mill Compound, Lower Parel, Mumbai', timestamp: '9:25 AM', status: 'seen' },
  { id: '5', senderId: 1, type: 'photo', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', timestamp: '9:26 AM', status: 'seen' },
  { id: '6', senderId: 2, type: 'text', text: "Aww cute! I don't mind at all 🐾", timestamp: '9:27 AM', status: 'seen' },
  { id: '7', senderId: 1, type: 'text', text: "On my way right now 🚗", timestamp: '9:30 AM', status: 'sent' },
];

const TAPBACK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const SAMPLE_PHOTOS = [
  { name: 'Puppy Meetup 🐶', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80' },
  { name: 'Café Coffee ☕', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
  { name: 'Sunset Vibe 🌅', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80' },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [activeTapbackId, setActiveTapbackId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [emojiTab, setEmojiTab] = useState<'Emoji' | 'GIFs' | 'Stickers'>('Emoji');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<{ title: string; url: string }[]>([]);
  const [isSearchingGiphy, setIsSearchingGiphy] = useState(false);

  // Live Giphy search effect
  useEffect(() => {
    if ((emojiTab === 'GIFs' || emojiTab === 'Stickers') && emojiSearch.trim().length > 1) {
      const type = emojiTab === 'GIFs' ? 'gifs' : 'stickers';
      setIsSearchingGiphy(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.giphy.com/v1/${type}/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(emojiSearch)}&limit=12`);
          const data = await res.json();
          if (data.data) {
            const formatted = data.data.map((item: any) => ({
              title: item.title || emojiSearch,
              url: item.images?.fixed_height?.url || item.images?.original?.url,
            })).filter((item: any) => item.url);
            setGiphyResults(formatted);
          }
        } catch {
          /* ignore fetch error */
        } finally {
          setIsSearchingGiphy(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setGiphyResults([]);
    }
  }, [emojiSearch, emojiTab]);

  // Voice Recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call state
  const [callState, setCallState] = useState<{ active: boolean; type: 'video' | 'audio'; status: 'connecting' | 'connected'; duration: number } | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = 1;
  const matchIdStr = (params?.id as string) || '1';
  const defaultPartner = PEOPLE.find(p => p.id.toString() === matchIdStr) || {
    id: parseInt(matchIdStr) || 1,
    name: matchIdStr === '1' ? 'Ananya Gupta' : matchIdStr === '2' ? 'Wade Warren' : 'Priya Sharma',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  };

  const [otherUser, setOtherUser] = useState<{ id: number; name: string; photo: string; isActive: boolean }>({
    id: defaultPartner.id,
    name: defaultPartner.name,
    photo: defaultPartner.photo,
    isActive: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadDbMessagesAndPartner() {
      const matchId = params?.id as string;
      if (!matchId) return;
      try {
        // Fetch partner details from matches API
        const matchesRes = await fetch('/api/matches').catch(() => null);
        if (matchesRes) {
          const matchesData = await matchesRes.json();
          if (matchesData.success && matchesData.matches) {
            const found = matchesData.matches.find((m: any) => m.id.toString() === matchId || m.partnerId.toString() === matchId);
            if (found) {
              setOtherUser({
                id: found.partnerId || 2,
                name: found.name,
                photo: found.photo,
                isActive: found.online ?? true,
              });
            }
          }
        }

        // Fetch DB messages
        const res = await fetch(`/api/messages?matchId=${params.id}`);
        const data = await res.json();
        if (data.success && data.messages && data.messages.length > 0) {
          const formatted: Message[] = data.messages.map((m: any) => ({
            id: m.id.toString(),
            senderId: m.senderId,
            type: m.type || 'text',
            text: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.isRead ? 'seen' : 'delivered',
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching DB messages & partner:', err);
      }
    }
    loadDbMessagesAndPartner();
  }, [params?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecordingVoice]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Call timer
  useEffect(() => {
    if (callState?.active) {
      if (callState.status === 'connecting') {
        const connectTimeout = setTimeout(() => {
          setCallState((prev) => (prev ? { ...prev, status: 'connected', duration: 0 } : null));
        }, 1800);
        return () => clearTimeout(connectTimeout);
      } else if (callState.status === 'connected') {
        callTimerRef.current = setInterval(() => {
          setCallState((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
        }, 1000);
      }
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState?.active, callState?.status]);

  const saveLastMessageToStorage = (msgText: string, timeStr: string) => {
    if (!params?.id) return;
    try {
      localStorage.setItem(`last_msg_${params.id}`, JSON.stringify({
        lastMsg: msgText,
        time: timeStr,
      }));
    } catch {
      /* ignore */
    }
  };

  // Handle sending a text message with database persistence & WhatsApp tick progression
  const handleSendText = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const trimmed = textToSend.trim();
    const newMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage: Message = {
      id: newMsgId,
      senderId: currentUserId,
      type: 'text',
      text: trimmed,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    saveLastMessageToStorage(trimmed, timeStr);

    // Save to PostgreSQL via API
    try {
      const matchId = params?.id || '1';
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: trimmed, type: 'text' }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 2800);
  };

  // Handle sending real photo message
  const handleSendPhoto = (url: string) => {
    const newMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const photoMessage: Message = {
      id: newMsgId,
      senderId: currentUserId,
      type: 'photo',
      photoUrl: url,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, photoMessage]);
    setShowAttachMenu(false);
    setShowPhotoPicker(false);
    saveLastMessageToStorage('📷 Photo', timeStr);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 2800);
  };

  // Handle local file selection from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleSendPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle sending location card
  const handleSendLocation = () => {
    const newMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const locationMessage: Message = {
      id: newMsgId,
      senderId: currentUserId,
      type: 'location',
      locationName: 'Café Zoe',
      locationAddress: 'Mathuradas Mill Compound, Lower Parel, Mumbai',
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, locationMessage]);
    setShowAttachMenu(false);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 2800);
  };

  // Handle sending gift card
  const handleSendGift = () => {
    const newMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const giftMessage: Message = {
      id: newMsgId,
      senderId: currentUserId,
      type: 'gift',
      giftTitle: 'Virtual Coffee Treat ☕',
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, giftMessage]);
    setShowAttachMenu(false);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 2800);
  };

  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const secs = recordingSeconds || 4;
    const newMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newVoiceMessage: Message = {
      id: newMsgId,
      senderId: currentUserId,
      type: 'voice',
      voiceDuration: `0:${secs < 10 ? '0' : ''}${secs}`,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newVoiceMessage]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'delivered' } : m))
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsgId ? { ...m, status: 'seen' } : m))
      );
    }, 2800);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m))
    );
    setActiveTapbackId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setActiveTapbackId(null);
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeFocusMessage = messages.find((m) => m.id === activeTapbackId);

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      {/* Hidden File Input for Device Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            {/* ── HEADER — Strictly Anchored Below Dynamic Island / Notch ── */}
            <div className="flex-shrink-0 sticky top-0 z-40 px-4 pt-[max(3.25rem,calc(2.5rem+env(safe-area-inset-top,0px)))] pb-3 bg-white/95 backdrop-blur-2xl border-b border-gray-200/70 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#1E293B] hover:bg-gray-100 active:scale-90 transition-all duration-200 cursor-pointer"
                  aria-label="Back"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="relative flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/profile')}>
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-gray-200/80 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <SafeImage src={otherUser.photo} name={otherUser.name} alt={otherUser.name} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#22C55E] ring-2 ring-white shadow-2xs pulse-glow" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#1E293B] leading-tight group-hover:text-black transition-colors">
                      {otherUser.name}
                    </h2>
                    <span className="text-[11.5px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Call Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCallState({ active: true, type: 'audio', status: 'connecting', duration: 0 })}
                  aria-label="Audio Call"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/90 text-[#1E293B] hover:bg-gray-200 active:scale-90 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  <Ic.Phone className="w-4 h-4 text-[#1E293B]" />
                </button>

                <button
                  onClick={() => setCallState({ active: true, type: 'video', status: 'connecting', duration: 0 })}
                  aria-label="Video Call"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/90 text-[#1E293B] hover:bg-gray-200 active:scale-90 transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  <Ic.Video className="w-4.5 h-4.5 text-[#1E293B]" />
                </button>
              </div>
            </div>

            {/* ── CHAT MESSAGES FEED ── */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] space-y-3.5">
              
              {/* Date Divider */}
              <div className="flex justify-center my-2 animate-bubble-enter">
                <span className="rounded-full bg-white/90 border border-gray-200/80 backdrop-blur-md px-3.5 py-0.5 text-[11px] font-semibold text-gray-400 tracking-wide shadow-2xs">
                  Today
                </span>
              </div>

              {messages.map((message, i) => {
                const isMine = message.senderId === currentUserId;

                return (
                  <div
                    key={message.id}
                    className="relative group flex flex-col animate-bubble-enter"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    
                    {/* Reaction Badge */}
                    {message.reaction && (
                      <span className={`z-10 -mb-2 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[12px] shadow-2xs animate-popover-enter ${isMine ? 'self-end mr-3' : 'self-start ml-3'}`}>
                        {message.reaction}
                      </span>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        onClick={() => setActiveTapbackId(message.id)}
                        className={`relative max-w-[84%] sm:max-w-[78%] px-3.5 py-2.5 rounded-[20px] cursor-pointer transition-transform duration-200 active:scale-[0.98] shadow-2xs ${
                          isMine
                            ? 'bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#2D1B28] rounded-tr-[4px]'
                            : 'bg-white border border-gray-200/70 text-[#1E293B] rounded-tl-[4px]'
                        }`}
                      >
                        {/* Text Message */}
                        {message.type === 'text' && (
                          <div className="flex flex-col">
                            <p className="text-[14.5px] leading-relaxed font-normal select-text">
                              {message.text}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1 -mr-0.5 text-[10.5px] font-medium text-gray-400 select-none">
                              <span>{message.timestamp}</span>
                              {isMine && <WhatsAppTicks status={message.status} isMine={isMine} />}
                            </div>
                          </div>
                        )}

                        {/* Real Photo Message Card */}
                        {message.type === 'photo' && message.photoUrl && (
                          <div className="flex flex-col gap-1.5">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(message.photoUrl!);
                              }}
                              className="relative overflow-hidden rounded-2xl border border-gray-200/60 shadow-2xs cursor-pointer group"
                            >
                              <img
                                src={message.photoUrl}
                                alt="Sent photo"
                                className="w-full max-h-[220px] object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <span className="text-[11px] font-bold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md">View Photo</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[10.5px] font-medium text-gray-400">
                              <span>{message.timestamp}</span>
                              {isMine && <WhatsAppTicks status={message.status} isMine={isMine} />}
                            </div>
                          </div>
                        )}

                        {/* Real Location Card */}
                        {message.type === 'location' && (
                          <div className="flex flex-col gap-2 min-w-[210px]">
                            <div className="flex items-start gap-2.5">
                              <div className="h-9 w-9 rounded-xl bg-[#F43F5E]/10 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
                                <Ic.MapPin className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-[#1E293B] truncate">{message.locationName || 'Live Location'}</p>
                                <p className="text-[11px] text-gray-500 truncate">{message.locationAddress || 'Shared pin location'}</p>
                              </div>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-gray-200/60 bg-gray-100 h-20 relative flex items-center justify-center">
                              <span className="text-[12px] font-bold text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-2xs backdrop-blur-md">
                                📍 Lower Parel, Mumbai
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10.5px] font-medium text-gray-400">
                              <span className="text-[#F43F5E] font-bold">Open in Maps →</span>
                              <div className="flex items-center gap-1">
                                <span>{message.timestamp}</span>
                                {isMine && <WhatsAppTicks status={message.status} isMine={isMine} />}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Real Gift Card */}
                        {message.type === 'gift' && (
                          <div className="flex flex-col gap-2 min-w-[210px]">
                            <div className="flex items-center gap-3 p-2 bg-[#FFF0F4] rounded-xl border border-[#F9C0D0]/80">
                              <div className="h-10 w-10 rounded-xl bg-[#F43F5E] text-white flex items-center justify-center shadow-2xs">
                                <Ic.Gift className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-[#1E293B]">{message.giftTitle || 'Virtual Gift 🎁'}</p>
                                <p className="text-[11px] text-[#F43F5E] font-semibold">Tap to unwrap</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[10.5px] font-medium text-gray-400">
                              <span>{message.timestamp}</span>
                              {isMine && <WhatsAppTicks status={message.status} isMine={isMine} />}
                            </div>
                          </div>
                        )}

                        {/* Voice Note Message */}
                        {message.type === 'voice' && (
                          <div className="flex flex-col gap-1.5 min-w-[190px]">
                            <div className="flex items-center gap-3 py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingVoiceId(playingVoiceId === message.id ? null : message.id);
                                }}
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F43F5E] text-white shadow-2xs transition-transform duration-200 active:scale-90 cursor-pointer"
                                aria-label={playingVoiceId === message.id ? "Pause voice note" : "Play voice note"}
                              >
                                {playingVoiceId === message.id ? (
                                  <Ic.Pause className="w-4 h-4 text-white" />
                                ) : (
                                  <Ic.Play className="w-4 h-4 text-white ml-0.5" />
                                )}
                              </button>

                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {[40, 75, 30, 90, 50, 80, 45, 60, 95, 35, 70, 50].map((h, idx) => (
                                  <span
                                    key={idx}
                                    className="w-1 rounded-full bg-[#F43F5E]/50 transition-all duration-300"
                                    style={{
                                      height: playingVoiceId === message.id ? `${Math.max(20, (h + idx * 7) % 100)}%` : `${h}%`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] font-medium text-gray-400">
                              <span>Voice • {message.voiceDuration}</span>
                              <div className="flex items-center gap-1">
                                <span>{message.timestamp}</span>
                                {isMine && <WhatsAppTicks status={message.status} isMine={isMine} />}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── ATTACHMENT MENU ── */}
            {showAttachMenu && (
              <div className="z-30 px-4 py-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl animate-popover-enter">
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => setIsRecordingVoice(true)} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-100/80 active:scale-95 transition-all duration-200 cursor-pointer">
                    <div className="h-11 w-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200/60 shadow-2xs">
                      <Ic.Mic className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600">Voice</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowPhotoPicker(true);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <div className="h-11 w-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200/60 shadow-2xs">
                      <Ic.Camera className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600">Photo</span>
                  </button>

                  <button onClick={handleSendLocation} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-100/80 active:scale-95 transition-all duration-200 cursor-pointer">
                    <div className="h-11 w-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200/60 shadow-2xs">
                      <Ic.Location className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600">Location</span>
                  </button>
                  
                  <button onClick={handleSendGift} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-100/80 active:scale-95 transition-all duration-200 cursor-pointer">
                    <div className="h-11 w-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200/60 shadow-2xs">
                      <Ic.Gift className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600">Gift</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── EMOJI, GIF & STICKER DRAWER ── */}
            {showEmojiPicker && (
              <div className="z-30 px-3.5 py-2.5 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-2xl animate-popover-enter flex flex-col gap-2 max-h-[220px]">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 flex items-center bg-gray-100/90 rounded-xl h-7 px-2.5">
                    <Ic.Search className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                    <input
                      type="text"
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      placeholder="Search GIFs, stickers or emoji"
                      className="w-full bg-transparent text-[16px] text-[#1E293B] placeholder-gray-400 outline-none"
                    />
                  </div>

                  <div className="flex gap-0.5 rounded-lg bg-gray-100/90 p-0.5 text-[11px] font-bold">
                    {(['Emoji', 'GIFs', 'Stickers'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setEmojiTab(t)}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          emojiTab === t ? 'bg-white shadow-2xs text-[#F43F5E]' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {emojiTab === 'Emoji' && (
                  <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-0.5 max-h-[130px]">
                    {!emojiSearch && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Recent</p>
                        <div className="grid grid-cols-8 gap-1">
                          {['❤️', '🥰', '💋', '👄', '😂', '🤗', '😅', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setInputText((prev) => prev + emoji)}
                              className="h-7 w-7 text-[18px] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer rounded-lg hover:bg-gray-100"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Smileys &amp; People</p>
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '☺️', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲']
                          .filter((e) => !emojiSearch || e.includes(emojiSearch))
                          .map((emoji, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputText((prev) => prev + emoji)}
                              className="h-7 w-7 text-[18px] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer rounded-lg hover:bg-gray-100"
                            >
                              {emoji}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {emojiTab === 'GIFs' && (
                  <div className="space-y-2">
                    {isSearchingGiphy && (
                      <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                        Searching Giphy…
                      </p>
                    )}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1 max-h-[140px]">
                      {(giphyResults.length > 0 ? giphyResults : [
                        { title: 'Love ❤️', url: 'https://media.giphy.com/media/c76IJLufpNwSULPk77/giphy.gif' },
                        { title: 'Flirt 😉', url: 'https://media.giphy.com/media/WWny5LBUWnjLM3KYhY/giphy.gif' },
                        { title: 'Dance 💃', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
                        { title: 'Hug 🤗', url: 'https://media.giphy.com/media/l2R013mIf1ZXdvoyI/giphy.gif' },
                        { title: 'Coffee ☕', url: 'https://media.giphy.com/media/hptcf8R0f2LGLfQcK4/giphy.gif' },
                        { title: 'Cute 🥰', url: 'https://media.giphy.com/media/DURbX7oesHiaA/giphy.gif' },
                      ]).map((gif, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendPhoto(gif.url)}
                          className="relative min-w-[100px] h-[80px] rounded-xl overflow-hidden border border-gray-200 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0 group"
                        >
                          <img src={gif.url} alt={gif.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-end p-1">
                            <span className="text-[10px] font-bold text-white leading-tight drop-shadow-sm truncate">{gif.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {emojiTab === 'Stickers' && (
                  <div className="space-y-2">
                    {isSearchingGiphy && (
                      <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                        Searching stickers…
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2 overflow-y-auto scrollbar-none py-1 max-h-[140px]">
                      {(giphyResults.length > 0 ? giphyResults : [
                        { title: 'Love Cat', url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif' },
                        { title: 'Bear Hug', url: 'https://media.giphy.com/media/LpDmM2W7zCCjK/giphy.gif' },
                        { title: 'Sparkles', url: 'https://media.giphy.com/media/26FL35e40rGk1G60U/giphy.gif' },
                        { title: 'Party Pop', url: 'https://media.giphy.com/media/l0Iyl55kTeh71nTXy/giphy.gif' },
                        { title: 'Fire Vibe', url: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif' },
                        { title: 'Cute Wave', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
                        { title: 'Hearts', url: 'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif' },
                        { title: 'Star Dance', url: 'https://media.giphy.com/media/l41Ys1f855vP9B3yM/giphy.gif' },
                      ]).map((sticker, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendPhoto(sticker.url)}
                          className="h-16 w-full rounded-xl bg-gray-50 border border-gray-200/70 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs p-1 overflow-hidden"
                        >
                          <img src={sticker.url} alt={sticker.title} className="h-full w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {emojiTab === 'Emoji' && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 text-gray-400 px-1 text-[13px]">
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">🕒</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">😃</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">🐱</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">☕</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">⚽</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">🚗</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">💡</button>
                    <button onClick={() => setEmojiTab('Emoji')} className="hover:text-gray-700 cursor-pointer">🚩</button>
                  </div>
                )}
              </div>
            )}

            {/* ── INPUT BAR ── */}
            <div className="flex-shrink-0 z-30 px-3.5 py-3 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 shadow-lg">
              {isRecordingVoice ? (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-red-50/90 rounded-2xl border border-red-200 animate-popover-enter">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[13px] font-bold text-red-600">
                      Recording 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsRecordingVoice(false)} className="px-3 py-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Cancel</button>
                    <button onClick={handleSendVoiceNote} className="px-4 py-1.5 rounded-xl bg-[#F43F5E] text-white text-[12px] font-bold shadow-2xs active:scale-95 hover:bg-[#E11D48] transition-all cursor-pointer">Send</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setShowAttachMenu(!showAttachMenu);
                      setShowEmojiPicker(false);
                    }}
                    aria-label="Add attachment"
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-90 transition-all duration-300 ease-out cursor-pointer ${
                      showAttachMenu ? 'rotate-45 text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/30 scale-105' : ''
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <div className="relative flex-1 flex items-center bg-gray-100/90 rounded-2xl h-11 px-4 border border-transparent focus-within:border-[#F43F5E]/30 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F43F5E]/15 transition-all duration-200">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                      placeholder="Message…"
                      className="w-full bg-transparent text-[16px] text-[#1E293B] placeholder-gray-400 outline-none pr-7"
                    />
                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowAttachMenu(false);
                      }}
                      className="absolute right-3 p-1 hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer text-gray-400 hover:text-[#F43F5E]"
                      aria-label="Open emoji picker"
                    >
                      <Ic.Smiley className="w-5 h-5" />
                    </button>
                  </div>

                  {inputText.trim() ? (
                    <button
                      onClick={() => handleSendText()}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F43F5E] text-white shadow-2xs hover:bg-[#E11D48] active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer animate-popover-enter"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRecordingVoice(true)}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F43F5E] text-white shadow-2xs hover:bg-[#E11D48] active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer"
                      title="Voice Note"
                    >
                      <Ic.Mic className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </AuroraBackground>
      </div>

      {/* PHOTO SELECTION MODAL */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-popover-enter">
          <div className="w-full max-w-[360px] bg-white rounded-[28px] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#1E293B]">Send Photo</h3>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Choose from device button */}
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowPhotoPicker(false);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#F43F5E] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Ic.Camera className="w-5 h-5" />
              <span>Upload from Device / Camera</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Or Select Photo</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            {/* Sample high quality photo choices */}
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_PHOTOS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPhoto(sample.url)}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                >
                  <img src={sample.url} alt={sample.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                    <span className="text-[9px] font-bold text-white leading-tight">{sample.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-popover-enter select-none">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold hover:bg-white/30 cursor-pointer active:scale-90 transition-transform"
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged photo"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/20"
          />
        </div>
      )}

      {/* WHATSAPP-STYLE LONG-PRESS MESSAGE REACTION MODAL */}
      {activeTapbackId && activeFocusMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div
            onClick={() => setActiveTapbackId(null)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-md transition-all duration-300 animate-popover-enter"
          />

          <div className="relative z-50 flex flex-col items-center gap-3 w-full max-w-[340px] animate-popover-enter">
            <div className="flex gap-2 p-2 rounded-full bg-white/90 backdrop-blur-2xl shadow-2xl border border-white/80">
              {TAPBACK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(activeFocusMessage.id, emoji)}
                  className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-2xl hover:scale-125 active:scale-95 transition-transform duration-150 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div
              className={`max-w-[90%] px-4 py-3 rounded-[22px] shadow-2xl border ${
                activeFocusMessage.senderId === currentUserId
                  ? 'bg-[#FFF0F4] border-[#F9C0D0]/80 text-[#2D1B28] rounded-tr-[4px]'
                  : 'bg-white border-gray-200 text-[#1E293B] rounded-tl-[4px]'
              }`}
            >
              <p className="text-[15px] leading-relaxed font-normal">
                {activeFocusMessage.type === 'text' ? activeFocusMessage.text : `Attachment (${activeFocusMessage.type})`}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-gray-400">
                <span>{activeFocusMessage.timestamp}</span>
                {activeFocusMessage.senderId === currentUserId && (
                  <WhatsAppTicks status={activeFocusMessage.status} />
                )}
              </div>
            </div>

            <div className="w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200/80 shadow-2xl divide-y divide-gray-100 overflow-hidden text-[14px] font-semibold text-[#1E293B]">
              <button
                onClick={() => setActiveTapbackId(null)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              >
                <span>Reply</span>
                <Ic.Reply className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => {
                  if (activeFocusMessage.text) navigator.clipboard?.writeText(activeFocusMessage.text);
                  setActiveTapbackId(null);
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              >
                <span>Copy</span>
                <Ic.Copy className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setActiveTapbackId(null)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              >
                <span>Star</span>
                <Ic.Star className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDeleteMessage(activeFocusMessage.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
              >
                <span>Delete</span>
                <Ic.Trash className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL MODAL */}
      {callState?.active && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950/95 backdrop-blur-2xl text-white animate-popover-enter">
          <div className="w-full flex items-center justify-between pt-6">
            <div className="flex items-center gap-2">
              {callState.type === 'video' ? <Ic.Video className="w-4 h-4 text-[#F43F5E]" /> : <Ic.Phone className="w-4 h-4 text-[#F43F5E]" />}
              <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#F43F5E]">
                {callState.type === 'video' ? 'Video Call' : 'Voice Call'}
              </span>
            </div>
            <span className="text-[14px] font-bold text-white/80 font-mono">
              {callState.status === 'connecting' ? 'Ringing…' : formatCallTime(callState.duration)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 my-auto">
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl animate-pulse">
              <SafeImage src={otherUser.photo} name={otherUser.name} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="text-center">
              <h2 className="text-[26px] font-black">{otherUser.name}</h2>
              <p className="text-[14px] text-white/60 mt-0.5">
                {callState.status === 'connecting' ? 'Calling…' : 'Connected'}
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs flex items-center justify-around py-4 px-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl mb-6 shadow-2xl">
            <button aria-label="Toggle Mute" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-transform duration-200 cursor-pointer hover:bg-white/25">
              <Ic.Mic className="w-5 h-5 text-white" />
            </button>
            <button aria-label="Toggle Camera" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-transform duration-200 cursor-pointer hover:bg-white/25">
              <Ic.Video className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setCallState(null)}
              aria-label="End call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white font-extrabold shadow-lg hover:bg-red-700 active:scale-90 transition-all duration-200 cursor-pointer"
            >
              <Ic.PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

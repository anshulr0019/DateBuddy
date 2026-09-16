'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SafeImage } from '../components/shared';
import { hapticMedium, hapticSuccess, hapticLight } from '../lib/haptics';

// ── Types ──────────────────────────────────────────────────
interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  city: string;
  isVerified: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  lastActiveAt: string;
  photo: string | null;
  tier: string;
}

interface Metrics {
  totalUsers: number;
  activeToday: number;
  totalMatches: number;
  totalMessages: number;
  totalSwipes: number;
  earlyVipRemaining: number;
  genderStats: { gender: string; count: number }[];
  cityStats: { city: string; count: number }[];
}

interface AdminConversation {
  matchId: number;
  matchedAt: string;
  user1: { id: number; name: string; email: string; phone: string; city: string; gender: string; photo: string | null };
  user2: { id: number; name: string; email: string; phone: string; city: string; gender: string; photo: string | null };
  lastMessage: { senderId: number; senderName: string; content: string; type: string; createdAt: string } | null;
}

interface ChatMessage {
  id: number;
  matchId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  receiverId: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface MiniUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  photo: string | null;
}

interface AdminSwipe {
  id: number;
  swiper: MiniUser;
  swiped: MiniUser;
  action: 'like' | 'pass' | 'super_like';
  createdAt: string;
}

interface AdminRandomSession {
  id: number;
  userA: MiniUser & { alias: string };
  userB: MiniUser & { alias: string };
  vibe: string | null;
  status: string;
  connectionRequestedByA: boolean;
  connectionRequestedByB: boolean;
  matchId: number | null;
  endedAt: string | null;
  createdAt: string;
}

interface RandomChatMsg {
  id: number;
  sessionId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
}

interface AdminReport {
  id: number;
  type: 'profile' | 'random_chat';
  reporter: MiniUser;
  reported: MiniUser;
  reason: string;
  details: string | null;
  sessionId?: number;
  createdAt: string;
}

interface AdminBlock {
  id: number;
  blocker: MiniUser;
  blocked: MiniUser;
  createdAt: string;
}

interface AdminMeetup {
  id: number;
  host: MiniUser;
  title: string;
  description: string | null;
  category: string;
  activityType: string | null;
  venueName: string | null;
  city: string | null;
  date: string;
  duration: number | null;
  maxAttendees: number;
  attendeeCount: number;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

interface AdminNotification {
  id: number;
  user: MiniUser;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ExtraCounts {
  totalRandomSessions: number;
  totalReports: number;
  totalBlocks: number;
  totalProfileViews: number;
}

type TabType = 'users' | 'chats' | 'swipes' | 'random' | 'reports' | 'blocks' | 'meetups';

// ── Helper ──────────────────────────────────────────────────
function formatDate(d: string | null | undefined, style: 'short' | 'full' = 'short') {
  if (!d) return '—';
  const date = new Date(d);
  if (style === 'short') return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Mini Avatar Component ──
function UserChip({ user, size = 'sm' }: { user: MiniUser; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`${dim} rounded-full overflow-hidden bg-neutral-800 border border-white/20 flex-shrink-0`}>
        <SafeImage src={user.photo} name={user.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-white truncate">{user.name}</p>
        <p className="text-[10px] text-white/40 truncate">ID #{user.id}</p>
      </div>
    </div>
  );
}

// ── Swipe Action Badge ──
function SwipeBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    like: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    super_like: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
    pass: 'bg-white/[0.06] text-white/50 border-white/15',
  };
  const icons: Record<string, string> = { like: '💚', super_like: '⭐', pass: '👋' };
  const labels: Record<string, string> = { like: 'Like', super_like: 'Super Like', pass: 'Pass' };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold ${styles[action] || styles.pass}`}>
      {icons[action] || '—'} {labels[action] || action}
    </span>
  );
}

// ── Report Reason Badge ──
function ReasonBadge({ reason, type }: { reason: string; type: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-extrabold capitalize">
      {type === 'random_chat' ? '🎭' : '🚨'} {reason.replace(/_/g, ' ')}
    </span>
  );
}

// ── Session Status Badge ──
function SessionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    connected: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    ended: 'bg-white/[0.06] text-white/50 border-white/15',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase ${styles[status] || styles.ended}`}>
      {status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {status}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState<string>('');
  const [inputPin, setInputPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Extra data states
  const [extraCounts, setExtraCounts] = useState<ExtraCounts | null>(null);
  const [swipesList, setSwipesList] = useState<AdminSwipe[]>([]);
  const [randomSessions, setRandomSessions] = useState<AdminRandomSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [rcMessages, setRcMessages] = useState<RandomChatMsg[]>([]);
  const [rcChatLoading, setRcChatLoading] = useState<boolean>(false);
  const [reportsList, setReportsList] = useState<AdminReport[]>([]);
  const [blocksList, setBlocksList] = useState<AdminBlock[]>([]);
  const [meetupsList, setMeetupsList] = useState<AdminMeetup[]>([]);

  // Restore saved admin pin on mount
  useEffect(() => {
    const saved = localStorage.getItem('infyn_admin_pin');
    if (saved) {
      setAdminKey(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchMetrics = useCallback(async (keyToUse: string) => {
    if (!keyToUse) return;
    setLoading(true);
    setAuthError('');
    try {
      const [resMetrics, resConvs, resExtra] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { 'x-admin-key': keyToUse } }),
        fetch('/api/admin/messages', { headers: { 'x-admin-key': keyToUse } }),
        fetch('/api/admin/all-data', { headers: { 'x-admin-key': keyToUse } }),
      ]);

      const dataMetrics = await resMetrics.json();
      const dataConvs = await resConvs.json().catch(() => ({ success: false, conversations: [] }));
      const dataExtra = await resExtra.json().catch(() => ({ success: false }));

      if (!resMetrics.ok || !dataMetrics.success) {
        throw new Error(dataMetrics.message || 'Invalid PIN or unauthorized access');
      }

      setMetrics(dataMetrics.metrics);
      setUsersList(dataMetrics.users || []);
      setConversations(dataConvs.conversations || []);

      if (dataExtra.success) {
        setExtraCounts(dataExtra.counts || null);
        setSwipesList(dataExtra.swipes || []);
        setRandomSessions(dataExtra.randomChatSessions || []);
        setReportsList(dataExtra.reports || []);
        setBlocksList(dataExtra.blocks || []);
        setMeetupsList(dataExtra.meetups || []);
      }

      setLastUpdated(new Date());
      setIsAuthenticated(true);
      localStorage.setItem('infyn_admin_pin', keyToUse);
    } catch (err: any) {
      setAuthError(err.message || 'Access denied. Incorrect PIN.');
      setIsAuthenticated(false);
      localStorage.removeItem('infyn_admin_pin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey && isAuthenticated) {
      fetchMetrics(adminKey);
    }
  }, [adminKey, isAuthenticated, fetchMetrics]);

  // Load chat messages when a conversation is selected
  const fetchChatMessages = useCallback(async (matchId: number) => {
    if (!adminKey) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?matchId=${matchId}`, {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      }
    } catch {
      /* ignore */
    } finally {
      setChatLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (selectedMatchId) {
      fetchChatMessages(selectedMatchId);
    }
  }, [selectedMatchId, fetchChatMessages]);

  // Load random chat messages when a session is selected
  const fetchRcMessages = useCallback(async (sessionId: number) => {
    if (!adminKey) return;
    setRcChatLoading(true);
    try {
      const res = await fetch(`/api/admin/all-data?section=random-chat-messages&sessionId=${sessionId}`, {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setRcMessages(data.messages);
      }
    } catch {
      /* ignore */
    } finally {
      setRcChatLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchRcMessages(selectedSessionId);
    }
  }, [selectedSessionId, fetchRcMessages]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!isAuthenticated || !adminKey || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(adminKey);
      if (selectedMatchId) fetchChatMessages(selectedMatchId);
      if (selectedSessionId) fetchRcMessages(selectedSessionId);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminKey, autoRefresh, selectedMatchId, selectedSessionId, fetchMetrics, fetchChatMessages, fetchRcMessages]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPin.trim()) return;
    hapticMedium();
    setAdminKey(inputPin.trim());
    fetchMetrics(inputPin.trim());
  };

  const handleLogout = () => {
    hapticLight();
    localStorage.removeItem('infyn_admin_pin');
    setAdminKey('');
    setIsAuthenticated(false);
    setInputPin('');
  };

  const handleExportCSV = async () => {
    if (!adminKey) return;
    setExporting(true);
    hapticMedium();
    try {
      const res = await fetch(`/api/admin/export?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infyn-users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      hapticSuccess();
    } catch (err) {
      alert('Could not export CSV');
    } finally {
      setExporting(false);
    }
  };

  // ── Filters ──
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesGender =
      genderFilter === 'all' ||
      (genderFilter === 'men' && u.gender === 'male') ||
      (genderFilter === 'women' && u.gender === 'female') ||
      (genderFilter === 'onboarded' && u.onboardingComplete) ||
      (genderFilter === 'vip' && u.tier !== 'free');
    return matchesSearch && matchesGender;
  });

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.user1.name.toLowerCase().includes(q) ||
      c.user2.name.toLowerCase().includes(q) ||
      c.user1.email.toLowerCase().includes(q) ||
      c.user2.email.toLowerCase().includes(q) ||
      c.user1.phone.includes(q) ||
      c.user2.phone.includes(q) ||
      (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  });

  const filteredSwipes = swipesList.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.swiper.name.toLowerCase().includes(q) || s.swiped.name.toLowerCase().includes(q);
  });

  const filteredSessions = randomSessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.userA.name.toLowerCase().includes(q) ||
      s.userB.name.toLowerCase().includes(q) ||
      s.userA.alias.toLowerCase().includes(q) ||
      s.userB.alias.toLowerCase().includes(q) ||
      (s.vibe || '').toLowerCase().includes(q)
    );
  });

  const filteredReports = reportsList.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.reporter.name.toLowerCase().includes(q) ||
      r.reported.name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      (r.details || '').toLowerCase().includes(q)
    );
  });

  const filteredBlocks = blocksList.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.blocker.name.toLowerCase().includes(q) || b.blocked.name.toLowerCase().includes(q);
  });

  const filteredMeetups = meetupsList.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.host.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q)
    );
  });

  const selectedConv = conversations.find((c) => c.matchId === selectedMatchId) || null;
  const selectedSession = randomSessions.find((s) => s.id === selectedSessionId) || null;

  /* ── 1. LOGIN PIN MODAL ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh w-full bg-infyn-dark text-white flex items-center justify-center p-5 font-sans select-none">
        <div className="relative w-full max-w-sm rounded-[32px] bg-infyn-dark-surface border border-white/15 p-8 text-center shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-infyn-rose/30 blur-[60px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-infyn-rose/30 blur-[60px]" />
          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-infyn-surface/10 border border-white/15 mx-auto mb-4 text-3xl shadow-md">
              👑
            </div>
            <h1 className="text-[22px] font-normal tracking-tight mb-1 font-display">Founder Access</h1>
            <p className="text-[13px] text-white/55 mb-6">Enter your secret PIN to access Infyn Live Hub.</p>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="password"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="Enter PIN (e.g. infyn2026)"
                autoFocus
                className="w-full h-12 rounded-2xl bg-black/50 border border-white/20 px-4 text-center text-[16px] font-bold text-white tracking-widest outline-none focus:border-infyn-rose focus:ring-2 focus:ring-infyn-rose/20 transition-all placeholder:text-white/30 placeholder:tracking-normal"
              />
              {authError && (
                <p className="text-[12.5px] font-semibold text-rose-400 animate-shake">{authError}</p>
              )}
              <button
                type="submit"
                disabled={loading || !inputPin.trim()}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-infyn-rose to-infyn-rose text-white font-extrabold text-[14px] shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Verifying…' : 'Unlock Dashboard ✨'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── 2. LIVE FOUNDER DASHBOARD ── */
  const earlyVipClaimed = metrics ? metrics.totalUsers : 0;
  const earlyVipPct = Math.min(100, Math.round((earlyVipClaimed / 500) * 100));

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'users', label: 'Users', icon: '👥', count: usersList.length },
    { id: 'chats', label: 'Chats', icon: '💬', count: conversations.length },
    { id: 'swipes', label: 'Swipes', icon: '💘', count: swipesList.length },
    { id: 'random', label: 'Random', icon: '🎭', count: randomSessions.length },
    { id: 'reports', label: 'Reports', icon: '🚨', count: reportsList.length },
    { id: 'blocks', label: 'Blocks', icon: '🚫', count: blocksList.length },
    { id: 'meetups', label: 'Meetups', icon: '📅', count: meetupsList.length },
  ];

  return (
    <div className="min-h-dvh w-full bg-infyn-dark text-white font-sans select-none pb-20">
      {/* ── TOP NAV HEADER ── */}
      <header className="sticky top-0 z-30 bg-infyn-dark/85 backdrop-blur-xl border-b border-white/10 px-5 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-infyn-rose to-infyn-rose text-xl shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-normal tracking-tight leading-none font-display">Infyn Founder Hub</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Tab Switcher — Scrollable horizontally */}
          <div className="flex items-center gap-1 bg-infyn-surface/[0.08] p-1 rounded-2xl border border-white/10 overflow-x-auto scrollbar-none max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'bg-infyn-surface text-black shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    activeTab === tab.id ? 'bg-black/20 text-black/70' : 'bg-infyn-rose/30 text-infyn-rose-light'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMetrics(adminKey)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-infyn-surface/10 hover:bg-infyn-surface/15 border border-white/15 text-[12px] font-bold cursor-pointer active:scale-95 transition-all"
              title="Refresh live data"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[12px] font-extrabold shadow-sm cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              <span>📥</span>
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-infyn-surface/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 text-[12px] font-bold border border-white/10 transition-all cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total Signups', value: metrics?.totalUsers ?? '—', icon: '👥', color: 'from-infyn-rose/20 to-infyn-rose/5', border: 'border-infyn-rose/30' },
            { label: 'Active 24h', value: metrics?.activeToday ?? '—', icon: '⚡', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30' },
            { label: 'Matches', value: metrics?.totalMatches ?? '—', icon: '💖', color: 'from-infyn-rose/20 to-infyn-rose/5', border: 'border-infyn-rose/30' },
            { label: 'Messages', value: metrics?.totalMessages ?? '—', icon: '💬', color: 'from-sky-500/20 to-sky-500/5', border: 'border-sky-500/30' },
            { label: 'Swipes', value: metrics?.totalSwipes ?? '—', icon: '💘', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30' },
            { label: 'Random Chats', value: extraCounts?.totalRandomSessions ?? '—', icon: '🎭', color: 'from-indigo-500/20 to-indigo-500/5', border: 'border-indigo-500/30' },
            { label: 'Reports', value: extraCounts?.totalReports ?? '—', icon: '🚨', color: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500/30' },
            { label: 'Blocks', value: extraCounts?.totalBlocks ?? '—', icon: '🚫', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-3xl bg-gradient-to-br ${stat.color} border ${stat.border} p-4 backdrop-blur-xl flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-xl mb-1.5">
                <span>{stat.icon}</span>
              </div>
              <div>
                <p className="text-[22px] font-black text-white leading-none tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-bold text-white/60 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════════════ TAB: USERS ═══════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Early VIP Progress Bar */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-400/30 p-5 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <h2 className="text-[15px] font-extrabold text-amber-300">Early VIP Lifetime Campaign</h2>
                </div>
                <span className="text-[13px] font-black text-amber-300">
                  {earlyVipClaimed} / 500 Claimed ({500 - earlyVipClaimed} Spots Left)
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-infyn-rose transition-all duration-700 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  style={{ width: `${Math.max(4, earlyVipPct)}%` }}
                />
              </div>
            </div>

            {/* Top Cities */}
            {metrics?.cityStats && metrics.cityStats.length > 0 && (
              <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl">
                <h3 className="text-[13px] font-bold text-white/50 uppercase tracking-wider mb-3">📍 Top Cities</h3>
                <div className="flex flex-wrap gap-2">
                  {metrics.cityStats.map((c) => (
                    <span key={c.city} className="px-3.5 py-1.5 rounded-full bg-infyn-surface/[0.08] border border-white/15 text-[12.5px] font-bold text-white/90 flex items-center gap-1.5">
                      <span>{c.city}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-infyn-rose/30 text-infyn-rose-light text-[11px] font-extrabold">{c.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Users Directory */}
            <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-black text-white">Live Signups Feed</h2>
                  <p className="text-[12px] text-white/50">Showing all registered accounts</p>
                </div>
                <div className="relative min-w-[240px]">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, city, gmail…"
                    className="w-full h-9 pl-9 pr-4 rounded-xl bg-black/40 border border-white/15 text-[12.5px] text-white placeholder:text-white/40 outline-none focus:border-infyn-rose"
                  />
                  <svg className="absolute left-3 top-2.5 text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'women', label: '👩 Women' },
                  { id: 'men', label: '👨 Men' },
                  { id: 'onboarded', label: '✅ Onboarded' },
                  { id: 'vip', label: '👑 VIP Gold' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGenderFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                      genderFilter === tab.id
                        ? 'bg-infyn-surface text-black shadow-sm'
                        : 'bg-infyn-surface/[0.06] text-white/60 hover:bg-infyn-surface/[0.12] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <span className="text-3xl mb-2 block">🔍</span>
                  <p className="text-[14px] font-bold">No users match your filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-none">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="text-white/40 border-b border-white/10 text-[11px] uppercase tracking-wider">
                        <th className="pb-3 pl-2">User</th>
                        <th className="pb-3">Contact (Phone &amp; Email)</th>
                        <th className="pb-3">City &amp; Age</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-infyn-surface/[0.02] transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-neutral-800 border border-white/20">
                                <SafeImage src={u.photo} name={u.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-[14px]">{u.name}</span>
                                  {u.isVerified && <span className="text-infyn-rose-light text-xs">✓</span>}
                                </div>
                                <span className="text-[11px] text-white/40 capitalize">ID #{u.id} • {u.gender}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-white/90">{u.phone}</p>
                            <p className="text-[11.5px] text-infyn-rose-light font-medium">{u.email !== '—' ? u.email : 'No email linked'}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-white/90">{u.city}</p>
                            <p className="text-[11px] text-white/50">{u.age} yrs old</p>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {u.onboardingComplete ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10.5px] font-bold">Profile Ready</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10.5px] font-bold">Incomplete</span>
                              )}
                              {u.tier !== 'free' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black">👑 VIP GOLD</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-white/60 text-[12px]">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ TAB: CHATS ═══════════════════ */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Conversation list */}
            <div className="lg:col-span-5 rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-black text-white">Active Match Threads</h2>
                  <p className="text-[11.5px] text-white/50">Click any match to read messages</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-infyn-surface/10 text-white/80 text-[11px] font-bold">
                  {filteredConversations.length} Matches
                </span>
              </div>

              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, email, text…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto scrollbar-none pr-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-10 text-white/40">
                    <p className="text-[13px] font-bold">No matches or conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedMatchId === conv.matchId;
                    return (
                      <div
                        key={conv.matchId}
                        onClick={() => { hapticLight(); setSelectedMatchId(conv.matchId); }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-infyn-rose/15 border-infyn-rose/40 shadow-sm'
                            : 'bg-infyn-surface/[0.03] border-white/10 hover:bg-infyn-surface/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-black bg-neutral-800">
                                <SafeImage src={conv.user1.photo} name={conv.user1.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-black bg-neutral-800">
                                <SafeImage src={conv.user2.photo} name={conv.user2.name} className="h-full w-full object-cover" />
                              </div>
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-white leading-tight">
                                {conv.user1.name} <span className="text-white/40">⇄</span> {conv.user2.name}
                              </p>
                              <p className="text-[10px] text-white/40">Match #{conv.matchId}</p>
                            </div>
                          </div>
                          <span className="text-[10.5px] text-white/40">
                            {conv.lastMessage?.createdAt
                              ? new Date(conv.lastMessage.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                              : 'Matched'}
                          </span>
                        </div>
                        <div className="bg-black/30 rounded-xl px-3 py-1.5 border border-white/5">
                          {conv.lastMessage ? (
                            <p className="text-[11.5px] text-white/80 truncate">
                              <strong className="text-infyn-rose-light">{conv.lastMessage.senderName}: </strong>
                              {conv.lastMessage.type === 'photo' ? '📷 Photo' : conv.lastMessage.type === 'voice' ? '🎙️ Voice Note' : conv.lastMessage.type === 'gif' ? '🎬 GIF' : conv.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-[11px] text-white/40 italic">No messages sent yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Chat Inspector */}
            <div className="lg:col-span-7 rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl flex flex-col h-[720px]">
              {selectedConv ? (
                <>
                  <div className="flex-shrink-0 border-b border-white/10 pb-4 mb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[16px] font-black text-white">Live Conversation Inspector</h3>
                        <p className="text-[11px] text-white/50">Match #{selectedConv.matchId} • Matched on {formatDate(selectedConv.matchedAt, 'full')}</p>
                      </div>
                      <button
                        onClick={() => fetchChatMessages(selectedConv.matchId)}
                        className="px-2.5 py-1 rounded-lg bg-infyn-surface/10 text-[11px] font-bold hover:bg-infyn-surface/15 cursor-pointer"
                      >
                        Refresh Chat
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[selectedConv.user1, selectedConv.user2].map((user, idx) => (
                        <div key={idx} className="p-2.5 rounded-2xl bg-infyn-surface/[0.05] border border-white/10 flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                            <SafeImage src={user.photo} name={user.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-white truncate">{user.name} (ID #{user.id})</p>
                            <p className="text-[10px] text-infyn-rose-light truncate">{user.email}</p>
                            <p className="text-[10px] text-white/40 truncate">{user.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-3 pr-2">
                    {chatLoading ? (
                      <div className="flex h-full items-center justify-center text-white/40 text-sm">Loading message transcript…</div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col h-full items-center justify-center text-center p-6 text-white/40">
                        <span className="text-3xl mb-1">💬</span>
                        <p className="text-[13px] font-bold">No messages exchanged yet</p>
                        <p className="text-[11px] text-white/30">These two matched but haven&apos;t started chatting.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isUser1 = msg.senderId === selectedConv.user1.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] rounded-2xl p-3 border ${
                              isUser1
                                ? 'bg-gradient-to-br from-infyn-rose/20 to-infyn-rose/5 border-infyn-rose/30 ml-auto items-end text-right'
                                : 'bg-gradient-to-br from-sky-500/15 to-sky-500/5 border-sky-500/30 mr-auto items-start text-left'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold mb-1">
                              <span className={isUser1 ? 'text-infyn-rose-light' : 'text-sky-300'}>{msg.senderName}</span>
                              <span className="text-white/40 font-normal">({msg.senderEmail !== '—' ? msg.senderEmail : msg.senderPhone})</span>
                            </div>
                            {msg.type === 'text' && (
                              <p className="text-[13.5px] text-white/95 leading-relaxed whitespace-pre-wrap select-text">{msg.content}</p>
                            )}
                            {msg.type === 'photo' && (
                              <div className="rounded-xl overflow-hidden my-1 max-w-[220px] border border-white/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={msg.content} alt="Photo" className="w-full object-cover" />
                              </div>
                            )}
                            {msg.type === 'gif' && (
                              <div className="rounded-xl overflow-hidden my-1 max-w-[200px] border border-white/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={msg.content} alt="GIF" className="w-full object-cover" />
                              </div>
                            )}
                            {msg.type === 'voice' && (
                              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 my-1">
                                <span className="text-lg">🎙️</span>
                                <span className="text-[12px] text-white/80">Voice Note</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-white/40">
                              <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span>{msg.isRead ? 'Seen ✓✓' : 'Delivered ✓'}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-center p-8 text-white/40">
                  <span className="text-4xl mb-2">👈</span>
                  <h3 className="text-[16px] font-bold text-white/70 mb-1">Select a Conversation</h3>
                  <p className="text-[12.5px] text-white/40 max-w-[280px]">
                    Click on any match thread from the left column to inspect all private messages, photos, and participant details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ TAB: SWIPES ═══════════════════ */}
        {activeTab === 'swipes' && (
          <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-white">Swipe Activity Feed</h2>
                <p className="text-[12px] text-white/50">Last 200 swipes — who liked, passed, or super-liked whom</p>
              </div>
              <div className="relative min-w-[200px]">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {filteredSwipes.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <span className="text-3xl mb-2 block">💘</span>
                <p className="text-[14px] font-bold">No swipes yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10 text-[11px] uppercase tracking-wider">
                      <th className="pb-3 pl-2">Swiper</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Swiped On</th>
                      <th className="pb-3">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredSwipes.map((s) => (
                      <tr key={s.id} className="hover:bg-infyn-surface/[0.02] transition-colors">
                        <td className="py-3 pl-2"><UserChip user={s.swiper} /></td>
                        <td className="py-3"><SwipeBadge action={s.action} /></td>
                        <td className="py-3"><UserChip user={s.swiped} /></td>
                        <td className="py-3 text-white/50 text-[12px]">{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: RANDOM CHAT ═══════════════════ */}
        {activeTab === 'random' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Sessions List */}
            <div className="lg:col-span-5 rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-black text-white">Anonymous Sessions</h2>
                  <p className="text-[11.5px] text-white/50">Click to read anonymous chat</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-infyn-surface/10 text-white/80 text-[11px] font-bold">
                  {filteredSessions.length} Sessions
                </span>
              </div>

              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, alias, vibe…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto scrollbar-none pr-1">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-10 text-white/40">
                    <p className="text-[13px] font-bold">No random chat sessions</p>
                  </div>
                ) : (
                  filteredSessions.map((sess) => {
                    const isSelected = selectedSessionId === sess.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => { hapticLight(); setSelectedSessionId(sess.id); }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm'
                            : 'bg-infyn-surface/[0.03] border-white/10 hover:bg-infyn-surface/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-black bg-neutral-800">
                                <SafeImage src={sess.userA.photo} name={sess.userA.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-black bg-neutral-800">
                                <SafeImage src={sess.userB.photo} name={sess.userB.name} className="h-full w-full object-cover" />
                              </div>
                            </div>
                            <div>
                              <p className="text-[12px] font-bold text-white leading-tight">
                                {sess.userA.alias} <span className="text-white/40">⇄</span> {sess.userB.alias}
                              </p>
                              <p className="text-[10px] text-white/40">
                                {sess.userA.name} ↔ {sess.userB.name} • #{sess.id}
                              </p>
                            </div>
                          </div>
                          <SessionStatusBadge status={sess.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {sess.vibe && (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                              🌊 {sess.vibe}
                            </span>
                          )}
                          {sess.connectionRequestedByA && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              A wants connect
                            </span>
                          )}
                          {sess.connectionRequestedByB && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              B wants connect
                            </span>
                          )}
                          {sess.matchId && (
                            <span className="px-2 py-0.5 rounded-lg bg-infyn-rose/20 text-infyn-rose-light text-[10px] font-bold">
                              💖 Matched #{sess.matchId}
                            </span>
                          )}
                          <span className="text-[10px] text-white/30 ml-auto">{formatDate(sess.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Random Chat Messages Inspector */}
            <div className="lg:col-span-7 rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl flex flex-col h-[720px]">
              {selectedSession ? (
                <>
                  <div className="flex-shrink-0 border-b border-white/10 pb-4 mb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[16px] font-black text-white">Anonymous Chat Inspector</h3>
                        <p className="text-[11px] text-white/50">Session #{selectedSession.id} • {selectedSession.vibe || 'Random'} vibe • {formatDate(selectedSession.createdAt, 'full')}</p>
                      </div>
                      <button
                        onClick={() => fetchRcMessages(selectedSession.id)}
                        className="px-2.5 py-1 rounded-lg bg-infyn-surface/10 text-[11px] font-bold hover:bg-infyn-surface/15 cursor-pointer"
                      >
                        Refresh Chat
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { user: selectedSession.userA, label: 'A' },
                        { user: selectedSession.userB, label: 'B' },
                      ].map(({ user, label }) => (
                        <div key={label} className="p-2.5 rounded-2xl bg-infyn-surface/[0.05] border border-white/10 flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                            <SafeImage src={user.photo} name={user.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-white truncate">{user.alias}</p>
                            <p className="text-[10px] text-indigo-300 truncate">Real: {user.name} (#{user.id})</p>
                            <p className="text-[10px] text-white/40 truncate">{user.email !== '—' ? user.email : user.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-3 pr-2">
                    {rcChatLoading ? (
                      <div className="flex h-full items-center justify-center text-white/40 text-sm">Loading anonymous messages…</div>
                    ) : rcMessages.length === 0 ? (
                      <div className="flex flex-col h-full items-center justify-center text-center p-6 text-white/40">
                        <span className="text-3xl mb-1">🎭</span>
                        <p className="text-[13px] font-bold">No messages in this session</p>
                        <p className="text-[11px] text-white/30">The pair was matched but didn&apos;t chat.</p>
                      </div>
                    ) : (
                      rcMessages.map((msg) => {
                        const isUserA = msg.senderId === selectedSession.userA.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] rounded-2xl p-3 border ${
                              isUserA
                                ? 'bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 ml-auto items-end text-right'
                                : 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30 mr-auto items-start text-left'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold mb-1">
                              <span className={isUserA ? 'text-indigo-300' : 'text-purple-300'}>
                                {isUserA ? selectedSession.userA.alias : selectedSession.userB.alias}
                              </span>
                              <span className="text-white/40 font-normal">
                                ({msg.senderName})
                              </span>
                            </div>
                            <p className="text-[13.5px] text-white/95 leading-relaxed whitespace-pre-wrap select-text">{msg.content}</p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-white/40">
                              <span>{new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-center p-8 text-white/40">
                  <span className="text-4xl mb-2">🎭</span>
                  <h3 className="text-[16px] font-bold text-white/70 mb-1">Select a Session</h3>
                  <p className="text-[12.5px] text-white/40 max-w-[280px]">
                    Click on any anonymous chat session to read the full conversation, see real identities behind aliases, and inspect connection requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ TAB: REPORTS ═══════════════════ */}
        {activeTab === 'reports' && (
          <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-white">All Reports</h2>
                <p className="text-[12px] text-white/50">Profile reports &amp; random chat reports combined</p>
              </div>
              <div className="relative min-w-[200px]">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, reason…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <span className="text-3xl mb-2 block">✅</span>
                <p className="text-[14px] font-bold">No reports — community is clean!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((r) => (
                  <div key={`${r.type}-${r.id}`} className="p-4 rounded-2xl bg-infyn-surface/[0.03] border border-white/10 hover:bg-infyn-surface/[0.05] transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <UserChip user={r.reporter} size="md" />
                        <span className="text-white/30 text-[14px]">→</span>
                        <UserChip user={r.reported} size="md" />
                      </div>
                      <div className="flex items-center gap-2">
                        <ReasonBadge reason={r.reason} type={r.type} />
                        <span className="text-[10px] text-white/40">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    {r.details && (
                      <div className="bg-black/30 rounded-xl px-3 py-2 border border-white/5">
                        <p className="text-[12px] text-white/70 leading-relaxed">{r.details}</p>
                      </div>
                    )}
                    {r.type === 'random_chat' && r.sessionId && (
                      <div className="mt-2">
                        <button
                          onClick={() => { setActiveTab('random'); setSelectedSessionId(r.sessionId!); }}
                          className="text-[11px] text-indigo-300 font-bold hover:underline cursor-pointer"
                        >
                          🎭 View Session #{r.sessionId} →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: BLOCKS ═══════════════════ */}
        {activeTab === 'blocks' && (
          <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-white">Block List</h2>
                <p className="text-[12px] text-white/50">Who blocked whom</p>
              </div>
              <div className="relative min-w-[200px]">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {filteredBlocks.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <span className="text-3xl mb-2 block">🤝</span>
                <p className="text-[14px] font-bold">No blocks — everyone&apos;s getting along!</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10 text-[11px] uppercase tracking-wider">
                      <th className="pb-3 pl-2">Blocker</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Blocked User</th>
                      <th className="pb-3">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredBlocks.map((b) => (
                      <tr key={b.id} className="hover:bg-infyn-surface/[0.02] transition-colors">
                        <td className="py-3 pl-2"><UserChip user={b.blocker} /></td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-extrabold">
                            🚫 Blocked
                          </span>
                        </td>
                        <td className="py-3"><UserChip user={b.blocked} /></td>
                        <td className="py-3 text-white/50 text-[12px]">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: MEETUPS ═══════════════════ */}
        {activeTab === 'meetups' && (
          <div className="rounded-3xl bg-infyn-surface/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black text-white">Meetups &amp; Events</h2>
                <p className="text-[12px] text-white/50">All meetups created by users</p>
              </div>
              <div className="relative min-w-[200px]">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, host, city…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-infyn-rose"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {filteredMeetups.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <span className="text-3xl mb-2 block">📅</span>
                <p className="text-[14px] font-bold">No meetups created yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMeetups.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-infyn-surface/[0.03] border border-white/10 hover:bg-infyn-surface/[0.05] transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-black text-white">{m.title}</h3>
                        <p className="text-[11px] text-white/40 mt-0.5">#{m.id} • Created {formatDate(m.createdAt)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                        m.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : m.status === 'completed'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-[12px] text-white/60 leading-relaxed line-clamp-2">{m.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold capitalize">
                        📂 {m.category}
                      </span>
                      {m.city && (
                        <span className="px-2 py-0.5 rounded-lg bg-infyn-surface/10 border border-white/15 text-white/70 text-[10px] font-bold">
                          📍 {m.city}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-infyn-surface/10 border border-white/15 text-white/70 text-[10px] font-bold">
                        📅 {formatDate(m.date)}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        👥 {m.attendeeCount}/{m.maxAttendees}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-white/40 uppercase font-bold">Host:</span>
                      <UserChip user={m.host} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

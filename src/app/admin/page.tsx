'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeImage } from '../components/shared';
import { hapticMedium, hapticSuccess, hapticLight } from '../lib/haptics';

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
  user1: {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    gender: string;
    photo: string | null;
  };
  user2: {
    id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    gender: string;
    photo: string | null;
  };
  lastMessage: {
    senderId: number;
    senderName: string;
    content: string;
    type: string;
    createdAt: string;
  } | null;
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

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState<string>('');
  const [inputPin, setInputPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'users' | 'chats'>('users');
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
      const [resMetrics, resConvs] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { 'x-admin-key': keyToUse } }),
        fetch('/api/admin/messages', { headers: { 'x-admin-key': keyToUse } }),
      ]);

      const dataMetrics = await resMetrics.json();
      const dataConvs = await resConvs.json().catch(() => ({ success: false, conversations: [] }));

      if (!resMetrics.ok || !dataMetrics.success) {
        throw new Error(dataMetrics.message || 'Invalid PIN or unauthorized access');
      }

      setMetrics(dataMetrics.metrics);
      setUsersList(dataMetrics.users || []);
      setConversations(dataConvs.conversations || []);
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

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!isAuthenticated || !adminKey || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(adminKey);
      if (selectedMatchId) fetchChatMessages(selectedMatchId);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminKey, autoRefresh, selectedMatchId, fetchMetrics, fetchChatMessages]);

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

  // Filter users by search and gender
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

  // Filter conversations
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

  const selectedConv = conversations.find((c) => c.matchId === selectedMatchId) || null;

  /* ── 1. LOGIN PIN MODAL ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh w-full bg-[#0A0A0E] text-white flex items-center justify-center p-5 font-sans select-none">
        <div className="relative w-full max-w-sm rounded-[32px] bg-[#14141B] border border-white/15 p-8 text-center shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#FF6B9D]/30 blur-[60px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#7B68EE]/30 blur-[60px]" />

          <div className="relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/15 mx-auto mb-4 text-3xl shadow-md">
              👑
            </div>

            <h1 className="text-[22px] font-black tracking-tight mb-1">Founder Access</h1>
            <p className="text-[13px] text-white/55 mb-6">Enter your secret PIN to access Infyn Live Hub.</p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="password"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="Enter PIN (e.g. infyn2026)"
                autoFocus
                className="w-full h-12 rounded-2xl bg-black/50 border border-white/20 px-4 text-center text-[16px] font-bold text-white tracking-widest outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all placeholder:text-white/30 placeholder:tracking-normal"
              />

              {authError && (
                <p className="text-[12.5px] font-semibold text-rose-400 animate-shake">{authError}</p>
              )}

              <button
                type="submit"
                disabled={loading || !inputPin.trim()}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white font-extrabold text-[14px] shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
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

  return (
    <div className="min-h-dvh w-full bg-[#08080C] text-white font-sans select-none pb-20">
      {/* ── TOP NAV HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#08080C]/85 backdrop-blur-xl border-b border-white/10 px-5 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B9D] to-[#7B68EE] text-xl shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-black tracking-tight leading-none">Infyn Founder Hub</h1>
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

          {/* Tab Switcher: Users vs Chats */}
          <div className="flex items-center gap-1 bg-white/[0.08] p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-xl text-[12.5px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              👥 Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-4 py-1.5 rounded-xl text-[12.5px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chats' ? 'bg-white text-black shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              <span>💬 Live Chats</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF6B9D]/30 text-[#FF6B9D] text-[10px] font-black">
                {conversations.length}
              </span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMetrics(adminKey)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] font-bold cursor-pointer active:scale-95 transition-all"
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
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 text-[12px] font-bold border border-white/10 transition-all cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ── SUMMARY STATS (Visible on both tabs) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { label: 'Total Signups', value: metrics?.totalUsers ?? '—', icon: '👥', color: 'from-[#FF6B9D]/20 to-[#FF6B9D]/5', border: 'border-[#FF6B9D]/30' },
            { label: 'Active in 24h', value: metrics?.activeToday ?? '—', icon: '⚡', color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30' },
            { label: 'Total Matches', value: metrics?.totalMatches ?? '—', icon: '💖', color: 'from-[#7B68EE]/20 to-[#7B68EE]/5', border: 'border-[#7B68EE]/30' },
            { label: 'Messages Sent', value: metrics?.totalMessages ?? '—', icon: '💬', color: 'from-sky-500/20 to-sky-500/5', border: 'border-sky-500/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-3xl bg-gradient-to-br ${stat.color} border ${stat.border} p-4.5 backdrop-blur-xl flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-2xl mb-2">
                <span>{stat.icon}</span>
              </div>
              <div>
                <p className="text-[28px] font-black text-white leading-none tracking-tight">{stat.value}</p>
                <p className="text-[12px] font-bold text-white/60 mt-1.5 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── TAB 1: USERS DIRECTORY ── */}
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
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-[#7B68EE] transition-all duration-700 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  style={{ width: `${Math.max(4, earlyVipPct)}%` }}
                />
              </div>
            </div>

            {/* Top Cities */}
            {metrics?.cityStats && metrics.cityStats.length > 0 && (
              <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-xl">
                <h3 className="text-[13px] font-bold text-white/50 uppercase tracking-wider mb-3">📍 Top Cities</h3>
                <div className="flex flex-wrap gap-2">
                  {metrics.cityStats.map((c) => (
                    <span
                      key={c.city}
                      className="px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-[12.5px] font-bold text-white/90 flex items-center gap-1.5"
                    >
                      <span>{c.city}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-[#FF6B9D]/30 text-[#FF6B9D] text-[11px] font-extrabold">{c.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Users Directory Table */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
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
                    className="w-full h-9 pl-9 pr-4 rounded-xl bg-black/40 border border-white/15 text-[12.5px] text-white placeholder:text-white/40 outline-none focus:border-[#FF6B9D]"
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
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white'
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
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-neutral-800 border border-white/20">
                                <SafeImage src={u.photo} name={u.name} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-[14px]">{u.name}</span>
                                  {u.isVerified && <span className="text-[#F43F5E] text-xs">✓</span>}
                                </div>
                                <span className="text-[11px] text-white/40 capitalize">ID #{u.id} • {u.gender}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5">
                            <p className="font-semibold text-white/90">{u.phone}</p>
                            <p className="text-[11.5px] text-[#FF6B9D] font-medium">{u.email !== '—' ? u.email : 'No email linked'}</p>
                          </td>

                          <td className="py-3.5">
                            <p className="font-semibold text-white/90">{u.city}</p>
                            <p className="text-[11px] text-white/50">{u.age} yrs old</p>
                          </td>

                          <td className="py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {u.onboardingComplete ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10.5px] font-bold">
                                  Profile Ready
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10.5px] font-bold">
                                  Incomplete
                                </span>
                              )}
                              {u.tier !== 'free' && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black">
                                  👑 VIP GOLD
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 text-white/60 text-[12px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
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

        {/* ── TAB 2: LIVE CHATS & CONVERSATION INSPECTOR ── */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Conversation Threads (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-black text-white">Active Match Threads</h2>
                  <p className="text-[11.5px] text-white/50">Click any match to read messages</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-bold">
                  {filteredConversations.length} Matches
                </span>
              </div>

              {/* Search match input */}
              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, email, text…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-white/15 text-[12px] text-white outline-none focus:border-[#FF6B9D]"
                />
                <svg className="absolute left-3 top-2.5 text-white/40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Conversations List */}
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
                        onClick={() => {
                          hapticLight();
                          setSelectedMatchId(conv.matchId);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-[#FF6B9D]/15 border-[#FF6B9D]/40 shadow-sm'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        {/* Participants Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Combined overlapping avatars */}
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
                              <p className="text-[10px] text-white/40">
                                Match #{conv.matchId}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10.5px] text-white/40">
                            {conv.lastMessage?.createdAt
                              ? new Date(conv.lastMessage.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                              : 'Matched'}
                          </span>
                        </div>

                        {/* Last Message Snippet */}
                        <div className="bg-black/30 rounded-xl px-3 py-1.5 border border-white/5">
                          {conv.lastMessage ? (
                            <p className="text-[11.5px] text-white/80 truncate">
                              <strong className="text-[#FF6B9D]">{conv.lastMessage.senderName}: </strong>
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

            {/* Right Column: Full Chat Transcript Inspector (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-xl flex flex-col h-[720px]">
              {selectedConv ? (
                <>
                  {/* Chat Inspector Header (User Profiles & Emails) */}
                  <div className="flex-shrink-0 border-b border-white/10 pb-4 mb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[16px] font-black text-white">Live Conversation Inspector</h3>
                        <p className="text-[11px] text-white/50">Match #{selectedConv.matchId} • Matched on {new Date(selectedConv.matchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button
                        onClick={() => fetchChatMessages(selectedConv.matchId)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold hover:bg-white/15 cursor-pointer"
                      >
                        Refresh Chat
                      </button>
                    </div>

                    {/* Both Users Summary Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* User 1 */}
                      <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <SafeImage src={selectedConv.user1.photo} name={selectedConv.user1.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate">{selectedConv.user1.name} (ID #{selectedConv.user1.id})</p>
                          <p className="text-[10px] text-[#FF6B9D] truncate">{selectedConv.user1.email}</p>
                          <p className="text-[10px] text-white/40 truncate">{selectedConv.user1.phone}</p>
                        </div>
                      </div>

                      {/* User 2 */}
                      <div className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                          <SafeImage src={selectedConv.user2.photo} name={selectedConv.user2.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate">{selectedConv.user2.name} (ID #{selectedConv.user2.id})</p>
                          <p className="text-[10px] text-[#7B68EE] truncate">{selectedConv.user2.email}</p>
                          <p className="text-[10px] text-white/40 truncate">{selectedConv.user2.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages Feed */}
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-3 pr-2">
                    {chatLoading ? (
                      <div className="flex h-full items-center justify-center text-white/40 text-sm">
                        Loading message transcript…
                      </div>
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
                                ? 'bg-gradient-to-br from-[#FF6B9D]/20 to-[#FF6B9D]/5 border-[#FF6B9D]/30 ml-auto items-end text-right'
                                : 'bg-gradient-to-br from-[#7B68EE]/20 to-[#7B68EE]/5 border-[#7B68EE]/30 mr-auto items-start text-left'
                            }`}
                          >
                            {/* Sender Info Tag */}
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold mb-1">
                              <span className={isUser1 ? 'text-[#FF6B9D]' : 'text-[#7B68EE]'}>{msg.senderName}</span>
                              <span className="text-white/40 font-normal">({msg.senderEmail !== '—' ? msg.senderEmail : msg.senderPhone})</span>
                            </div>

                            {/* Message Content */}
                            {msg.type === 'text' && (
                              <p className="text-[13.5px] text-white/95 leading-relaxed whitespace-pre-wrap select-text">
                                {msg.content}
                              </p>
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

                            {/* Timestamp & Read Status */}
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

      </main>
    </div>
  );
}

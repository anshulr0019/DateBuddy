'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '../context/FilterContext';
import { AuroraBackground, GlassCard, VerifiedBadge, SafeImage } from '../components/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();

  const [ageRange, setAgeRange] = useState<[number, number]>([filters.ageMin, filters.ageMax]);
  const [maxDistance, setMaxDistance] = useState<number>(filters.maxDistance);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(filters.verifiedOnly);

  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    phoneNumber: '',
    verified: false,
    photo: '' as string,
  });

  const [notifications, setNotifications] = useState({
    push: true,
    matches: true,
    messages: true,
    likes: false,
    meetups: true,
  });

  const [privacy, setPrivacy] = useState({
    incognito: false,
    hideDistance: false,
    showOnlineStatus: true,
  });

  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState(userInfo.phoneNumber);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [saveError, setSaveError] = useState('');
  // Confirmation sheet state
  const [confirmSheet, setConfirmSheet] = useState<'logout' | 'delete' | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  type BlockedUser = { id: number; name: string; photo: string | null };
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[] | null>(null);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  // Social links
  const [instagramHandle, setInstagramHandle] = useState('');
  const [snapchatHandle, setSnapchatHandle] = useState('');
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);

  const persistSettings = useCallback(async (patch: Record<string, unknown>) => {
    setSaveError('');
    try {
      const res = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.status === 401) {
        router.replace('/welcome?switch=true');
        return;
      }
      if (!res.ok) setSaveError('Could not save that change. Please try again.');
    } catch {
      setSaveError('Network error — your change was not saved.');
    }
  }, [router]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/users/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.settings) return;
        const s = data.settings;
        setNotifications(s.notifications);
        setPrivacy(s.privacy);
        setAgeRange([s.discovery.ageMin, s.discovery.ageMax]);
        setMaxDistance(s.discovery.distanceMax);
        setOnlyVerified(s.discovery.onlyVerified);
        setFilters(prev => ({
          ...prev,
          ageMin: s.discovery.ageMin,
          ageMax: s.discovery.ageMax,
          maxDistance: s.discovery.distanceMax,
          verifiedOnly: s.discovery.onlyVerified,
        }));
      } catch {
        /* keep local defaults — the toggles stay usable offline */
      }
    }
    loadSettings();
  }, [setFilters]);

  useEffect(() => {
    async function loadUserInfo() {
      // Try API first
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          setUserInfo(prev => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            phoneNumber: u.phoneNumber || u.phone || prev.phoneNumber,
            verified: u.isVerified ?? prev.verified,
            photo: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : prev.photo,
          }));
          // Load social handles from /api/users/me
          try {
            const meRes = await fetch('/api/users/me');
            const meData = await meRes.json();
            if (meData.success && meData.user) {
              setInstagramHandle(meData.user.instagramHandle ?? '');
              setSnapchatHandle(meData.user.snapchatHandle ?? '');
            }
          } catch { /* ignore */ }
          return;
        }
      } catch {
        /* fall through to localStorage */
      }

      // Fallback: localStorage
      try {
        const googleUser = localStorage.getItem('google_user');
        const basicInfo = localStorage.getItem('onboarding_basic');
        const phone = localStorage.getItem('phoneNumber');
        if (googleUser) {
          const parsed = JSON.parse(googleUser);
          setUserInfo(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
          }));
        } else if (basicInfo) {
          const parsed = JSON.parse(basicInfo);
          setUserInfo(prev => ({
            ...prev,
            name: parsed.name || prev.name,
          }));
        }
        if (phone) {
          setUserInfo(prev => ({
            ...prev,
            phoneNumber: phone.startsWith('+') ? phone : `+91 ${phone}`,
          }));
        }

        const savedNotify = localStorage.getItem('app_notifications');
        if (savedNotify) {
          setNotifications(JSON.parse(savedNotify));
        }
      } catch {
        /* ignore */
      }
    }
    loadUserInfo();
  }, []);

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persistSettings({ notifications: next });
      return next;
    });
  };

  const handleTogglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persistSettings({ privacy: next });
      return next;
    });
  };

  // Sliders fire continuously while dragging, so the write is deferred to release.
  const commitDiscovery = useCallback(
    (next: { ageMin: number; ageMax: number; distanceMax: number; onlyVerified: boolean }) => {
      setFilters(prev => ({
        ...prev,
        ageMin: next.ageMin,
        ageMax: next.ageMax,
        maxDistance: next.distanceMax,
        verifiedOnly: next.onlyVerified,
      }));
      persistSettings({ discovery: next });
    },
    [setFilters, persistSettings]
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      window.location.href = '/welcome?switch=true';
    } catch {
      window.location.href = '/welcome?switch=true';
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (!res.ok && res.status !== 401) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message || 'Could not delete your account. Please try again.');
        setIsDeleting(false);
        return;
      }
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      window.location.href = '/welcome?switch=true';
    } catch {
      setDeleteError('Network error. Please check your connection and try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] bg-[#FAFAF7]/80 backdrop-blur-xl border-b border-[#1A1A2E]/[0.06]">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#1A1A2E]/10 text-[#1A1A2E] shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 className="text-[18px] font-extrabold text-[#1A1A2E]">Settings</h1>
              <div className="w-10" />
            </div>

            <div className="p-4 space-y-4">
              {/* Profile Card Header */}
              <GlassCard className="p-4 flex items-center justify-between border border-gray-200/60 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-[#F43F5E]/20 shadow-sm flex-shrink-0">
                    <SafeImage
                      src={userInfo.photo || null}
                      name={userInfo.name}
                      alt="Your profile photo"
                      eager
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-[16px] font-bold text-[#1E293B]">{userInfo.name}</h2>
                      {userInfo.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-[12px] text-[#1E293B]/55">{userInfo.email || userInfo.phoneNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="px-3 py-1.5 text-[12px] font-bold text-[#F43F5E] bg-[#FFF0F4] border border-[#F9C0D0]/60 rounded-xl hover:bg-[#F43F5E] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  Edit Profile
                </button>
              </GlassCard>

              {/* Social Links Section */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E293B]/45 px-2 mb-1.5">
                  Social Links
                </p>
                <GlassCard className="p-4 space-y-3 border border-gray-200/60 shadow-2xs">
                  <p className="text-[12px] text-[#1E293B]/50 leading-snug">
                    Connect your social accounts so your matches can find you.
                  </p>
                  {/* Instagram */}
                  <div>
                    <label className="text-[12px] font-bold text-[#1E293B]/60 mb-1.5 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="set-ig" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f09433" />
                            <stop offset="50%" stopColor="#dc2743" />
                            <stop offset="100%" stopColor="#bc1888" />
                          </linearGradient>
                        </defs>
                        <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#set-ig)" strokeWidth="2" />
                        <circle cx="12" cy="12" r="4" stroke="url(#set-ig)" strokeWidth="2" />
                        <circle cx="17.5" cy="6.5" r="1.2" fill="url(#set-ig)" />
                      </svg>
                      Instagram
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#1E293B]/35 select-none">@</span>
                      <input
                        id="settings-instagram-handle"
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, '').slice(0, 60))}
                        placeholder="your.handle"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full h-10 rounded-xl border border-gray-200/80 bg-white/60 pl-7 pr-3 text-[14px] text-[#1E293B] placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#dc2743]/20 focus:bg-white/90 transition-all"
                      />
                    </div>
                  </div>
                  {/* Snapchat */}
                  <div>
                    <label className="text-[12px] font-bold text-[#1E293B]/60 mb-1.5 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#F7B731">
                        <path d="M12 2C9.5 2 8 4.5 8 6v.5C6.5 7 5 7.5 5 7.5s-.5 1.5 1 2c-.5.5-1 1.5-3 1.5 0 0 .5 1.5 4 2 .5 1 1 2.5 4 2.5s3.5-1.5 4-2.5c3.5-.5 4-2 4-2-2 0-2.5-1-3-1.5 1.5-.5 1-2 1-2s-1.5-.5-3-.5V6c0-1.5-1.5-4-4-4z" stroke="#ccc" strokeWidth="0.3" />
                      </svg>
                      Snapchat
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#1E293B]/35 select-none">@</span>
                      <input
                        id="settings-snapchat-handle"
                        type="text"
                        value={snapchatHandle}
                        onChange={(e) => setSnapchatHandle(e.target.value.replace(/^@/, '').slice(0, 60))}
                        placeholder="your-handle"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full h-10 rounded-xl border border-gray-200/80 bg-white/60 pl-7 pr-3 text-[14px] text-[#1E293B] placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#F7B731]/30 focus:bg-white/90 transition-all"
                      />
                    </div>
                  </div>
                  {/* Save button */}
                  <button
                    id="settings-social-save"
                    onClick={async () => {
                      setSocialSaving(true);
                      setSocialSaved(false);
                      try {
                        const res = await fetch('/api/users/me', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ instagramHandle, snapchatHandle }),
                        });
                        if (res.ok) setSocialSaved(true);
                      } catch { /* ignore */ } finally {
                        setSocialSaving(false);
                      }
                    }}
                    disabled={socialSaving}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[13px] font-bold shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {socialSaving ? 'Saving…' : socialSaved ? '✓ Saved!' : 'Save Social Links'}
                  </button>
                </GlassCard>
              </div>

              {/* Account Settings Section */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E293B]/45 px-2 mb-1.5">
                  Account Settings
                </p>
                <GlassCard className="divide-y divide-gray-100 border border-gray-200/60 shadow-2xs">
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-[#1E293B]">Phone Number</p>
                      <p className="text-[12px] text-[#1E293B]/50">{userInfo.phoneNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowEditPhoneModal(true)}
                      className="text-[12px] font-bold text-[#F43F5E] cursor-pointer hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-[#1E293B]">Google Email</p>
                      <p className="text-[12px] text-[#1E293B]/50">{userInfo.email}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Connected
                    </span>
                  </div>

                  <div
                    onClick={() => router.push('/verification')}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[#1E293B]">Identity Verification</p>
                      {userInfo.verified ? (
                        <p className="text-[12px] text-emerald-600 font-semibold">✓ Blue Tick Verified</p>
                      ) : (
                        <p className="text-[12px] text-[#F43F5E] font-semibold">Tap to get verified →</p>
                      )}
                    </div>
                    <span className="text-[14px] text-[#1E293B]/40">›</span>
                  </div>
                </GlassCard>
              </div>

              {/* Discovery Settings */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E293B]/45 px-2 mb-1.5">
                  Discovery Preferences
                </p>
                <GlassCard className="p-4 space-y-4 border border-gray-200/60 shadow-2xs">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[14px] font-medium text-[#1E293B]">Age Preference</span>
                      <span className="text-[13px] font-bold text-[#F43F5E]">{ageRange[0]} - {ageRange[1]} yrs</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="18"
                        max="50"
                        value={ageRange[1]}
                        onChange={(e) => setAgeRange([18, Number(e.target.value)])}
                        onPointerUp={() =>
                          commitDiscovery({ ageMin: 18, ageMax: ageRange[1], distanceMax: maxDistance, onlyVerified })
                        }
                        onKeyUp={() =>
                          commitDiscovery({ ageMin: 18, ageMax: ageRange[1], distanceMax: maxDistance, onlyVerified })
                        }
                        className="w-full accent-[#F43F5E] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[14px] font-medium text-[#1E293B]">Maximum Distance</span>
                      <span className="text-[13px] font-bold text-[#F43F5E]">{maxDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      onPointerUp={() =>
                        commitDiscovery({ ageMin: 18, ageMax: ageRange[1], distanceMax: maxDistance, onlyVerified })
                      }
                      onKeyUp={() =>
                        commitDiscovery({ ageMin: 18, ageMax: ageRange[1], distanceMax: maxDistance, onlyVerified })
                      }
                      className="w-full accent-[#F43F5E] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[14px] font-medium text-[#1E293B]">Verified Profiles Only</p>
                      <p className="text-[11px] text-[#1E293B]/45">Only show users with blue badge</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyVerified}
                        onChange={(e) => {
                          setOnlyVerified(e.target.checked);
                          commitDiscovery({
                            ageMin: 18,
                            ageMax: ageRange[1],
                            distanceMax: maxDistance,
                            onlyVerified: e.target.checked,
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F43F5E]"></div>
                    </label>
                  </div>
                </GlassCard>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/40 px-2 mb-1.5">
                  Notifications & Alerts
                </p>
                <GlassCard className="divide-y divide-[#1A1A2E]/[0.06]">
                  {[
                    { key: 'push', label: 'Push Notifications', sub: 'Instant updates on your device' },
                    { key: 'matches', label: 'New Matches', sub: 'When someone likes you back' },
                    { key: 'messages', label: 'Chat Messages', sub: 'DMs and voice note alerts' },
                    { key: 'meetups', label: 'Meetup Invites', sub: 'Nearby group activity invites' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3.5">
                      <div>
                        <p className="text-[14px] font-medium text-[#1A1A2E]">{item.label}</p>
                        <p className="text-[11px] text-[#1A1A2E]/45">{item.sub}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={() => handleToggleNotification(item.key as keyof typeof notifications)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B9D]"></div>
                      </label>
                    </div>
                  ))}
                </GlassCard>
              </div>

              {/* Privacy Controls */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A1A2E]/40 px-2 mb-1.5">
                  Privacy & Safety
                </p>
                <GlassCard className="divide-y divide-[#1A1A2E]/[0.06]">
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A2E]">Incognito Mode</p>
                      <p className="text-[11px] text-[#1A1A2E]/45">Hide profile from public discovery</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.incognito}
                        onChange={() => handleTogglePrivacy('incognito')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7B68EE]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A2E]">Hide Distance</p>
                      <p className="text-[11px] text-[#1A1A2E]/45">Don&apos;t show exact distance on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.hideDistance}
                        onChange={() => handleTogglePrivacy('hideDistance')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7B68EE]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A2E]">Show Online Status</p>
                      <p className="text-[11px] text-[#1A1A2E]/45">Show green dot when you&apos;re active</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showOnlineStatus}
                        onChange={() => handleTogglePrivacy('showOnlineStatus')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7B68EE]"></div>
                    </label>
                  </div>


                  <div
                    onClick={() => {
                      setShowBlockedModal(true);
                      // Load blocked users when opening the modal
                      if (blockedUsers === null) {
                        fetch('/api/blocks')
                          .then((r) => r.ok ? r.json() : null)
                          .then((d) => { if (d?.success) setBlockedUsers(d.blocked); })
                          .catch(() => setBlockedUsers([]));
                      }
                    }}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#1A1A2E]/[0.02] transition-all"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A2E]">Blocked Users</p>
                      <p className="text-[11px] text-[#1A1A2E]/45">Manage blocked contacts</p>
                    </div>
                    <span className="text-[14px] text-[#1A1A2E]/40">›</span>
                  </div>
                </GlassCard>
              </div>

              {/* Premium Plan Banner */}
              <GlassCard
                onClick={() => router.push('/premium')}
                className="p-4 bg-gradient-to-r from-[#FF6B9D]/15 via-[#B76CFF]/15 to-[#7B68EE]/15 border-none cursor-pointer hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[10px] font-black uppercase tracking-wider mb-1 shadow-sm">
                      ✨ DateBuddy Gold
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1A1A2E]">Unlimited Swipes & See Who Liked You</h3>
                  </div>
                  <span className="text-[20px]">👑</span>
                </div>
              </GlassCard>

              {/* Logout & Delete Account Actions */}
              <div className="pt-2 space-y-2.5">
                {(saveError || deleteError) && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600" role="alert">
                    {deleteError || saveError}
                  </div>
                )}
                <button
                  onClick={() => setConfirmSheet('logout')}
                  disabled={isLoggingOut || isDeleting}
                  className="w-full py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-rose-600 text-[14.5px] font-bold hover:bg-rose-100/60 active:scale-[0.985] transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out…' : 'Log Out & Switch Account'}
                </button>

                <button
                  onClick={() => setConfirmSheet('delete')}
                  disabled={isLoggingOut || isDeleting}
                  className="w-full py-2 text-center text-[12.5px] font-medium text-gray-400 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting your account…' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </div>

      {/* Blocked Users Sheet */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden">
          <div
            onClick={() => setShowBlockedModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-page-entry max-h-[75dvh] flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-[18px] font-bold text-[#1A1A2E]">Blocked Users</h3>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[#1A1A2E]/60 active:scale-90 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Load on open */}
            {blockedUsers === null && (
              <div className="flex items-center justify-center py-6">
                <svg className="animate-spin text-[#FF6B9D]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
              </div>
            )}

            {blockedUsers !== null && blockedUsers.length === 0 && (
              <p className="text-[13px] text-gray-500 text-center py-4">You haven&apos;t blocked anyone.</p>
            )}

            {blockedUsers !== null && blockedUsers.length > 0 && (
              <div className="overflow-y-auto flex-1 space-y-2">
                {blockedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border border-gray-200">
                      <SafeImage src={u.photo} name={u.name} alt={u.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="flex-1 text-[14px] font-semibold text-[#1A1A2E] truncate">{u.name}</span>
                    <button
                      disabled={unblockingId === u.id}
                      onClick={async () => {
                        setUnblockingId(u.id);
                        try {
                          await fetch('/api/blocks', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ blockedUserId: u.id }),
                          });
                          setBlockedUsers((prev) => prev?.filter((b) => b.id !== u.id) ?? []);
                        } finally {
                          setUnblockingId(null);
                        }
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold border border-[#F43F5E]/30 text-[#F43F5E] bg-rose-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {unblockingId === u.id ? '…' : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBlockedModal(false)}
              className="w-full flex-shrink-0 py-2.5 rounded-xl bg-[#1A1A2E] text-white text-[14px] font-bold cursor-pointer active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {confirmSheet === 'logout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div onClick={() => setConfirmSheet(null)} className="absolute inset-0 bg-black/40 backdrop-blur-md animate-popover-enter" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-[28px] p-5 space-y-4 shadow-2xl animate-popover-enter">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 mb-2 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-[#1A1A2E] text-center">Log Out?</h3>
            <p className="text-[14px] text-[#1A1A2E]/60 text-center leading-relaxed">You&apos;ll need to sign in again next time you open the app.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmSheet(null)} className="flex-1 py-3 rounded-2xl border border-[#1A1A2E]/15 bg-white text-[#1A1A2E] text-[14px] font-bold active:scale-95 transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={() => { setConfirmSheet(null); handleLogout(); }} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-[14px] font-bold active:scale-95 transition-all cursor-pointer">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmSheet === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div onClick={() => setConfirmSheet(null)} className="absolute inset-0 bg-black/40 backdrop-blur-md animate-popover-enter" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-[28px] p-5 space-y-4 shadow-2xl animate-popover-enter">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 mb-2 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-[#1A1A2E] text-center">Delete Account?</h3>
            <p className="text-[14px] text-[#1A1A2E]/60 text-center leading-relaxed">This permanently erases your profile, photos, matches, and messages. This action cannot be undone.</p>
            <div className="rounded-2xl border border-rose-200/60 bg-rose-50 p-3">
              <label htmlFor="delete-confirm" className="block text-[12px] font-bold text-rose-600 mb-2">Type DELETE to confirm</label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-11 px-3 rounded-xl border border-rose-200 bg-white text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-rose-400"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setConfirmSheet(null); setDeleteConfirmText(''); }} className="flex-1 py-3 rounded-2xl border border-[#1A1A2E]/15 bg-white text-[#1A1A2E] text-[14px] font-bold active:scale-95 transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { if (deleteConfirmText === 'DELETE') { setConfirmSheet(null); setDeleteConfirmText(''); handleDeleteAccount(); } }}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-[14px] font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:active:scale-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            onClick={() => setShowEditPhoneModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)]"
            style={{ willChange: 'backdrop-filter, opacity' }}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-page-entry">
            <h3 className="text-[18px] font-bold text-[#1A1A2E]">Change Phone Number</h3>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-[13px] font-semibold text-amber-800 leading-relaxed">
                For security, changing your phone number requires re-verification. Please contact us at{' '}
                <a href="mailto:support@datebuddy.app" className="underline">support@datebuddy.app</a>{' '}
                and we&apos;ll help you update it.
              </p>
            </div>
            <button
              onClick={() => setShowEditPhoneModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1A1A2E] text-white text-[14px] font-bold cursor-pointer active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '../context/FilterContext';
import { AuroraBackground, GlassCard, VerifiedBadge, SafeImage } from '../components/shared';
import { Ic } from '../components/icons';
import {
  clearUserProfileCache,
  getCachedUserProfile,
  loadUserProfile,
  updateCachedUserProfile,
} from '../lib/userProfileCache';
import { clearChatCache } from '../lib/chatCache';
import { clearConversationCache } from '../lib/conversationCache';

export default function SettingsPage() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();

  const [ageRange, setAgeRange] = useState<[number, number]>([filters?.ageMin ?? 18, filters?.ageMax ?? 30]);
  const [maxDistance, setMaxDistance] = useState<number>(filters?.maxDistance ?? 50);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(filters?.verifiedOnly ?? false);

  const [userInfo, setUserInfo] = useState(() => {
    const cached = getCachedUserProfile();
    return {
      name: cached?.name || 'You',
      email: cached?.email || '',
      phoneNumber: cached?.phoneNumber || '',
      verified: cached?.isVerified ?? false,
      photo: cached?.photos?.[0] || '',
    };
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
  const [newPhone, setNewPhone] = useState('');
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
  const [instagramHandle, setInstagramHandle] = useState(() => getCachedUserProfile()?.instagramHandle ?? '');
  const [snapchatHandle, setSnapchatHandle] = useState(() => getCachedUserProfile()?.snapchatHandle ?? '');
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
        if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications }));
        if (s.privacy) setPrivacy(prev => ({ ...prev, ...s.privacy }));
        if (s.discovery) {
          const min = Number(s.discovery.ageMin) || 18;
          const max = Number(s.discovery.ageMax) || 30;
          const dist = Number(s.discovery.distanceMax) || 50;
          const verified = Boolean(s.discovery.onlyVerified);
          setAgeRange([min, max]);
          setMaxDistance(dist);
          setOnlyVerified(verified);
          setFilters(prev => ({
            ...prev,
            ageMin: min,
            ageMax: max,
            maxDistance: dist,
            verifiedOnly: verified,
          }));
        }
      } catch {
        /* keep local defaults — the toggles stay usable offline */
      }
    }
    loadSettings();
  }, [setFilters]);

  useEffect(() => {
    async function loadUserInfo() {
      try {
        const user = await loadUserProfile();
        setUserInfo(prev => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phoneNumber: user.phoneNumber || prev.phoneNumber,
          verified: user.isVerified ?? prev.verified,
          photo: user.photos?.[0] || prev.photo,
        }));
        setInstagramHandle(user.instagramHandle ?? '');
        setSnapchatHandle(user.snapchatHandle ?? '');
        return;
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
      clearUserProfileCache();
      clearChatCache();
      clearConversationCache();
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
      clearUserProfileCache();
      clearChatCache();
      clearConversationCache();
      document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      window.location.href = '/welcome?switch=true';
    } catch {
      setDeleteError('Network error. Please check your connection and try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-dvh w-full min-h-screen bg-infyn-paper flex justify-center overflow-hidden font-system">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col justify-between bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-ink/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] bg-infyn-paper/80 backdrop-blur-xl border-b border-infyn-ink/[0.06]">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="font-system flex h-10 w-10 items-center justify-center rounded-2xl bg-infyn-surface border border-infyn-ink/10 text-infyn-ink shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 className="text-[18px] font-normal text-infyn-ink font-display">Settings</h1>
              <div className="w-10" />
            </div>

            <div className="p-4 space-y-4">
              {/* Profile Card Header */}
              <GlassCard className="p-4 flex items-center justify-between border border-infyn-border/60 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-infyn-rose/20 shadow-sm flex-shrink-0">
                    <SafeImage
                      src={userInfo.photo || null}
                      name={userInfo.name}
                      alt="Your profile photo"
                      eager
                      width={160}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-[16px] font-bold text-infyn-ink">{userInfo.name}</h2>
                      {userInfo.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-[12px] text-infyn-ink/55">{userInfo.email || userInfo.phoneNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/profile')}
                  className="font-system px-3 py-1.5 text-[12px] font-bold text-infyn-rose bg-infyn-blush border border-infyn-rose-line/60 rounded-xl hover:bg-infyn-rose hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  Edit Profile
                </button>
              </GlassCard>

              {/* Social Links Section */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/45 px-2 mb-1.5">
                  Social Links
                </p>
                <GlassCard className="p-4 space-y-3 border border-infyn-border/60 shadow-2xs">
                  <p className="text-[12px] text-infyn-ink/50 leading-snug">
                    Connect your social accounts so your matches can find you.
                  </p>
                  {/* Instagram */}
                  <div>
                    <label className="text-[12px] font-bold text-infyn-ink/60 mb-1.5 flex items-center gap-1.5">
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-infyn-ink/35 select-none">@</span>
                      <input
                        id="settings-instagram-handle"
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, '').slice(0, 60))}
                        placeholder="your.handle"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full h-10 rounded-xl border border-infyn-border/80 bg-infyn-surface/60 pl-7 pr-3 text-[14px] text-infyn-ink placeholder-infyn-muted outline-none focus:ring-2 focus:ring-[#dc2743]/20 focus:bg-infyn-surface/90 transition-all"
                      />
                    </div>
                  </div>
                  {/* Snapchat */}
                  <div>
                    <label className="text-[12px] font-bold text-infyn-ink/60 mb-1.5 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#F7B731">
                        <path d="M12 2C9.5 2 8 4.5 8 6v.5C6.5 7 5 7.5 5 7.5s-.5 1.5 1 2c-.5.5-1 1.5-3 1.5 0 0 .5 1.5 4 2 .5 1 1 2.5 4 2.5s3.5-1.5 4-2.5c3.5-.5 4-2 4-2-2 0-2.5-1-3-1.5 1.5-.5 1-2 1-2s-1.5-.5-3-.5V6c0-1.5-1.5-4-4-4z" stroke="#ccc" strokeWidth="0.3" />
                      </svg>
                      Snapchat
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-infyn-ink/35 select-none">@</span>
                      <input
                        id="settings-snapchat-handle"
                        type="text"
                        value={snapchatHandle}
                        onChange={(e) => setSnapchatHandle(e.target.value.replace(/^@/, '').slice(0, 60))}
                        placeholder="your-handle"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full h-10 rounded-xl border border-infyn-border/80 bg-infyn-surface/60 pl-7 pr-3 text-[14px] text-infyn-ink placeholder-infyn-muted outline-none focus:ring-2 focus:ring-[#F7B731]/30 focus:bg-infyn-surface/90 transition-all"
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
                        if (res.ok) {
                          updateCachedUserProfile({ instagramHandle, snapchatHandle });
                          setSocialSaved(true);
                        }
                      } catch { /* ignore */ } finally {
                        setSocialSaving(false);
                      }
                    }}
                    disabled={socialSaving}
                    className="font-system w-full py-2.5 rounded-2xl bg-gradient-to-r from-infyn-rose to-infyn-rose text-white text-[13px] font-bold shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {socialSaving ? 'Saving…' : socialSaved ? '✓ Saved!' : 'Save Social Links'}
                  </button>
                </GlassCard>
              </div>

              {/* Account Settings Section */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/45 px-2 mb-1.5">
                  Account Settings
                </p>
                <GlassCard className="divide-y divide-gray-100 border border-infyn-border/60 shadow-2xs">
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Phone Number</p>
                      <p className="text-[12px] text-infyn-ink/50">{userInfo.phoneNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowEditPhoneModal(true)}
                      className="font-system text-[12px] font-bold text-infyn-rose cursor-pointer hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Google account</p>
                      <p className="text-[12px] text-infyn-ink/50">{userInfo.email || 'Sign in with Google to link one'}</p>
                    </div>
                    {userInfo.email ? (
                      <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Connected</span>
                    ) : (
                      <span className="text-[12px] font-semibold text-infyn-secondary bg-infyn-surface-soft px-2.5 py-1 rounded-full">Not connected</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/verification')}
                    className="w-full text-left flex items-center justify-between p-3.5 cursor-pointer active:bg-infyn-surface-soft transition-colors"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Identity verification</p>
                      {userInfo.verified ? (
                        <p className="text-[12px] text-emerald-700 font-semibold">Verified</p>
                      ) : (
                        <p className="text-[12px] text-infyn-rose font-semibold">Get verified</p>
                      )}
                    </div>
                    <span className="text-infyn-muted -rotate-90" aria-hidden><Ic.ChevDown /></span>
                  </button>
                </GlassCard>
              </div>

              {/* Discovery Settings */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/45 px-2 mb-1.5">
                  Discovery Preferences
                </p>
                <GlassCard className="p-4 space-y-4 border border-infyn-border/60 shadow-2xs">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[14px] font-medium text-infyn-ink">Age Preference</span>
                      <span className="text-[13px] font-bold text-infyn-rose">{ageRange[0]} - {ageRange[1]} yrs</span>
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
                        className="w-full accent-infyn-rose cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[14px] font-medium text-infyn-ink">Maximum Distance</span>
                      <span className="text-[13px] font-bold text-infyn-rose">{maxDistance} km</span>
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
                      className="w-full accent-infyn-rose cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Verified Profiles Only</p>
                      <p className="text-[11px] text-infyn-ink/45">Only show users with blue badge</p>
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
                      <div className="w-11 h-6 bg-infyn-surface-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-infyn-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-infyn-surface after:border-infyn-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-infyn-rose"></div>
                    </label>
                  </div>
                </GlassCard>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/40 px-2 mb-1.5">
                  Notifications & Alerts
                </p>
                <GlassCard className="divide-y divide-infyn-border/[0.06]">
                  {[
                    { key: 'push', label: 'Push Notifications', sub: 'Instant updates on your device' },
                    { key: 'matches', label: 'New Matches', sub: 'When someone likes you back' },
                    { key: 'messages', label: 'Chat Messages', sub: 'DMs and voice note alerts' },
                    { key: 'meetups', label: 'Meetup Invites', sub: 'Nearby group activity invites' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3.5">
                      <div>
                        <p className="text-[14px] font-medium text-infyn-ink">{item.label}</p>
                        <p className="text-[11px] text-infyn-ink/45">{item.sub}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={() => handleToggleNotification(item.key as keyof typeof notifications)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-infyn-surface-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-infyn-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-infyn-surface after:border-infyn-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-infyn-rose"></div>
                      </label>
                    </div>
                  ))}
                </GlassCard>
              </div>

              {/* Privacy Controls */}
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/40 px-2 mb-1.5">
                  Privacy &amp; safety
                </p>
                <GlassCard className="divide-y divide-infyn-border/[0.06]">
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Incognito Mode</p>
                      <p className="text-[11px] text-infyn-ink/45">Hide profile from public discovery</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.incognito}
                        onChange={() => handleTogglePrivacy('incognito')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-infyn-surface-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-infyn-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-infyn-surface after:border-infyn-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-infyn-rose"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Hide Distance</p>
                      <p className="text-[11px] text-infyn-ink/45">Don&apos;t show exact distance on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.hideDistance}
                        onChange={() => handleTogglePrivacy('hideDistance')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-infyn-surface-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-infyn-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-infyn-surface after:border-infyn-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-infyn-rose"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Show Online Status</p>
                      <p className="text-[11px] text-infyn-ink/45">Show green dot when you&apos;re active</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.showOnlineStatus}
                        onChange={() => handleTogglePrivacy('showOnlineStatus')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-infyn-surface-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-infyn-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-infyn-surface after:border-infyn-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-infyn-rose"></div>
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
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-infyn-ink/[0.02] transition-all"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-infyn-ink">Blocked Users</p>
                      <p className="text-[11px] text-infyn-ink/45">Manage blocked contacts</p>
                    </div>
                    <span className="text-[14px] text-infyn-ink/40">›</span>
                  </div>
                </GlassCard>
              </div>

              {/* Premium Plan Banner */}
              <GlassCard onClick={() => router.push('/premium')} className="p-4 cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-infyn-blush text-infyn-rose" aria-hidden>
                    <Ic.Sparkle className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[19px] leading-tight text-infyn-ink">Infyn Gold</p>
                    <p className="text-[13px] text-infyn-secondary">See who liked you and more</p>
                  </div>
                  <span className="shrink-0 text-infyn-muted -rotate-90" aria-hidden><Ic.ChevDown /></span>
                </div>
              </GlassCard>

              {/* Logout & Delete Account Actions */}
              <div className="pt-2 space-y-2.5">
                {(saveError || deleteError) && (
                  <div className="rounded-2xl border border-infyn-rose-line bg-infyn-blush px-4 py-3 text-[13px] font-semibold text-infyn-rose" role="alert">
                    {deleteError || saveError}
                  </div>
                )}
                <button
                  onClick={() => setConfirmSheet('logout')}
                  disabled={isLoggingOut || isDeleting}
                  className="w-full min-h-[52px] rounded-full border border-infyn-border bg-infyn-surface text-infyn-ink text-[15px] font-semibold active:bg-infyn-surface-soft transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out…' : 'Log out'}
                </button>

                <button
                  onClick={() => setConfirmSheet('delete')}
                  disabled={isLoggingOut || isDeleting}
                  className="w-full min-h-[44px] text-center text-[14px] text-infyn-secondary underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting your account…' : 'Delete account'}
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
            className="absolute inset-0 bg-infyn-ink/50"
          />
          <div className="relative z-10 w-full max-w-sm bg-infyn-surface rounded-t-3xl sm:rounded-[28px] p-6 space-y-4 shadow-[0_24px_64px_-16px_rgba(32,26,22,0.35)] animate-page-entry max-h-[75dvh] flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="font-display text-[24px] text-infyn-ink">Blocked Users</h3>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="font-system flex h-8 w-8 items-center justify-center rounded-full bg-infyn-surface-soft text-infyn-ink/60 active:scale-90 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Load on open */}
            {blockedUsers === null && (
              <div className="flex items-center justify-center py-6">
                <svg className="animate-spin text-infyn-rose" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
              </div>
            )}

            {blockedUsers !== null && blockedUsers.length === 0 && (
              <p className="text-[13px] text-infyn-secondary text-center py-4">You haven&apos;t blocked anyone.</p>
            )}

            {blockedUsers !== null && blockedUsers.length > 0 && (
              <div className="overflow-y-auto flex-1 space-y-2">
                {blockedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-infyn-border bg-infyn-surface-soft px-3 py-2.5">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border border-infyn-border">
                      <SafeImage src={u.photo} name={u.name} alt={u.name} width={128} className="h-full w-full object-cover" />
                    </div>
                    <span className="flex-1 text-[14px] font-semibold text-infyn-ink truncate">{u.name}</span>
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
                      className="font-system flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold border border-infyn-rose/30 text-infyn-rose bg-infyn-blush active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {unblockingId === u.id ? '…' : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBlockedModal(false)}
              className="font-system w-full flex-shrink-0 py-2.5 rounded-xl bg-infyn-ink text-white text-[14px] font-bold cursor-pointer active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {confirmSheet === 'logout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div onClick={() => setConfirmSheet(null)} className="absolute inset-0 bg-infyn-ink/50 animate-popover-enter" />
          <div className="relative z-10 w-full max-w-sm bg-infyn-surface rounded-[28px] p-6 space-y-4 shadow-[0_24px_64px_-16px_rgba(32,26,22,0.35)] animate-popover-enter">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-infyn-blush border border-infyn-rose-line text-infyn-rose mb-2 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="font-display text-[24px] text-infyn-ink text-center">Log Out?</h3>
            <p className="text-[14px] text-infyn-ink/60 text-center leading-relaxed">You&apos;ll need to sign in again next time you open the app.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmSheet(null)} className="flex-1 min-h-[48px] rounded-full border border-infyn-ink/15 bg-infyn-surface text-infyn-ink text-[15px] font-semibold active:scale-[0.98] transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={() => { setConfirmSheet(null); handleLogout(); }} className="flex-1 min-h-[48px] rounded-full bg-infyn-rose text-[#fff8f0] text-[15px] font-semibold active:scale-[0.98] transition-all cursor-pointer">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmSheet === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div onClick={() => setConfirmSheet(null)} className="absolute inset-0 bg-infyn-ink/50 animate-popover-enter" />
          <div className="relative z-10 w-full max-w-sm bg-infyn-surface rounded-[28px] p-6 space-y-4 shadow-[0_24px_64px_-16px_rgba(32,26,22,0.35)] animate-popover-enter">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-infyn-blush border border-infyn-rose-line text-infyn-rose mb-2 mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="font-display text-[24px] text-infyn-ink text-center">Delete your account?</h3>
            <p className="text-[14px] text-infyn-ink/60 text-center leading-relaxed">This permanently erases your profile, photos, matches, and messages. This action cannot be undone.</p>
            <div className="rounded-2xl border border-infyn-rose-line bg-infyn-blush p-3">
              <label htmlFor="delete-confirm" className="block text-[12px] font-bold text-infyn-rose mb-2">Type DELETE to confirm</label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-11 px-3 rounded-xl border border-infyn-rose-line bg-infyn-surface text-infyn-ink text-[16px] font-medium focus:outline-none focus:border-infyn-rose"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setConfirmSheet(null); setDeleteConfirmText(''); }} className="flex-1 min-h-[48px] rounded-full border border-infyn-ink/15 bg-infyn-surface text-infyn-ink text-[15px] font-semibold active:scale-[0.98] transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { if (deleteConfirmText === 'DELETE') { setConfirmSheet(null); setDeleteConfirmText(''); handleDeleteAccount(); } }}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 min-h-[48px] rounded-full bg-infyn-rose text-[#fff8f0] text-[15px] font-semibold active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:active:scale-100"
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
            className="absolute inset-0 bg-infyn-ink/50 transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)]"
            style={{ willChange: 'backdrop-filter, opacity' }}
          />
          <div className="relative z-10 w-full max-w-sm bg-infyn-surface rounded-[28px] p-6 space-y-4 shadow-[0_24px_64px_-16px_rgba(32,26,22,0.35)] animate-page-entry">
            <h3 className="font-display text-[24px] text-infyn-ink">Change phone number</h3>
            <div className="rounded-2xl bg-infyn-surface-soft border border-infyn-border p-4">
              <p className="text-[13px] font-semibold text-infyn-ink leading-relaxed">
                For security, changing your phone number requires re-verification. Please contact us at{' '}
                <a href="mailto:support@infyn.app" className="underline">support@infyn.app</a>{' '}
                and we&apos;ll help you update it.
              </p>
            </div>
            <button
              onClick={() => setShowEditPhoneModal(false)}
              className="font-system w-full py-2.5 rounded-xl bg-infyn-ink text-white text-[14px] font-bold cursor-pointer active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

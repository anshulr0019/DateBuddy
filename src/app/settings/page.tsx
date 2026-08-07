'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFilters } from '../context/FilterContext';
import { AuroraBackground, GlassCard, VerifiedBadge } from '../components/shared';

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
          }));
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
                  <div className="h-12 w-12 rounded-full bg-[#F43F5E] text-white font-bold flex items-center justify-center text-lg shadow-2xs">
                    {userInfo.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-[16px] font-bold text-[#1E293B]">{userInfo.name}</h2>
                      {userInfo.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-[12px] text-[#1E293B]/55">{userInfo.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/onboarding/basic-info')}
                  className="px-3 py-1.5 text-[12px] font-bold text-[#F43F5E] bg-[#FFF0F4] border border-[#F9C0D0]/60 rounded-xl hover:bg-[#F43F5E] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  Edit Profile
                </button>
              </GlassCard>

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
                      <p className="text-[12px] text-emerald-600 font-semibold">✓ Blue Tick Verified</p>
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

                  <div
                    onClick={() => setShowBlockedModal(true)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            onClick={() => setShowBlockedModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)]"
            style={{ willChange: 'backdrop-filter, opacity' }}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-page-entry">
            <h3 className="text-[18px] font-bold text-[#1A1A2E]">Blocked Users</h3>
            <p className="text-[13px] text-gray-500">You currently have no blocked users on DateBuddy.</p>
            <button
              onClick={() => setShowBlockedModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1A1A2E] text-white text-[14px] font-bold"
            >
              Close
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
            <p className="text-[14px] text-[#1A1A2E]/60 text-center leading-relaxed">You'll need to sign in again next time you open the app.</p>
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

      {/* Edit Phone Modal */}
      {showEditPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            onClick={() => setShowEditPhoneModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)]"
            style={{ willChange: 'backdrop-filter, opacity' }}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl animate-page-entry">
            <h3 className="text-[18px] font-bold text-[#1A1A2E]">Update Phone Number</h3>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-[16px] outline-none focus:border-[#FF6B9D]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditPhoneModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUserInfo(prev => ({ ...prev, phoneNumber: newPhone }));
                  setShowEditPhoneModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

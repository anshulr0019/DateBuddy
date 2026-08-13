'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuroraBackground } from '@/app/components/shared';

interface Attendee {
  id: number;
  name: string;
  photo: string | null;
}

interface MeetupDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  venueName: string;
  address: string;
  date: string;
  duration: number | null;
  maxAttendees: number;
  imageUrl: string;
  pinnedMessage: string | null;
  status: string;
  host: {
    id: number;
    name: string;
    photo: string;
    verified: boolean;
  } | null;
  attendees: Attendee[];
  attendeesCount: number;
  pendingRequests?: Attendee[];
  userJoinStatus?: 'going' | 'pending' | 'kicked' | null;
  requireApproval?: boolean;
  isHost: boolean;
  isJoined: boolean;
}

interface EditForm {
  title: string;
  description: string;
  venueName: string;
  address: string;
  date: string;
  duration: string;
  maxAttendees: string;
  pinnedMessage: string;
}

export default function MeetupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id);

  const [meetup, setMeetup] = useState<MeetupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [kickingId, setKickingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState('');

  const fetchMeetup = useCallback(async () => {
    try {
      const response = await fetch(`/api/meetups/${id}`);
      const data = await response.json();
      if (data.success && data.meetup) {
        setMeetup(data.meetup);
      } else if (response.status === 401) {
        router.replace('/welcome');
      }
    } catch (err) {
      console.error('Error fetching meetup:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchMeetup();
  }, [id, fetchMeetup]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleJoin = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/meetups/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        flash(data.action === 'joined' ? 'You joined the squad 🎉' : 'You left the squad');
        fetchMeetup();
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Error joining:', err);
      setError('Failed to update RSVP');
    } finally {
      setBusy(false);
    }
  };

  const openEditModal = () => {
    if (!meetup) return;
    const date = meetup.date ? new Date(meetup.date) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    setEditForm({
      title: meetup.title,
      description: meetup.description || '',
      venueName: meetup.venueName || '',
      address: meetup.address || '',
      date: local,
      duration: meetup.duration ? String(meetup.duration) : '',
      maxAttendees: String(meetup.maxAttendees || 10),
      pinnedMessage: meetup.pinnedMessage || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const selectedDate = new Date(editForm.date);
    if (!editForm.date || isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
      setEditError('Pick a future date and time');
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        title: editForm.title,
        description: editForm.description,
        venueName: editForm.venueName,
        address: editForm.address,
        date: selectedDate.toISOString(),
        maxAttendees: Number(editForm.maxAttendees),
        pinnedMessage: editForm.pinnedMessage.trim() || null,
      };
      if (editForm.duration) body.duration = Number(editForm.duration);

      const response = await fetch(`/api/meetups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        setEditError(data.message || 'Failed to save');
        setBusy(false);
        return;
      }
      setShowEdit(false);
      flash('Squad updated ✓');
      fetchMeetup();
    } catch (err) {
      console.error('Error updating:', err);
      setEditError('Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const cancelMeetup = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/meetups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await response.json();
      if (data.success) {
        setShowCancelConfirm(false);
        flash('Squad cancelled — attendees notified');
        fetchMeetup();
      } else {
        setError(data.message || 'Failed to cancel');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      setError('Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  const kickUser = async (userId: number) => {
    setKickingId(userId);
    try {
      const response = await fetch(`/api/meetups/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kick', targetUserId: userId }),
      });
      const data = await response.json();
      if (data.success) {
        flash('Participant removed — slot freed');
        fetchMeetup();
      } else {
        setError(data.message || 'Failed to remove participant');
      }
    } catch (err) {
      console.error('Error kicking:', err);
      setError('Failed to remove participant');
    } finally {
      setKickingId(null);
    }
  };

  const handlePendingAction = async (targetUserId: number, action: 'approve' | 'decline') => {
    setBusy(true);
    try {
      const response = await fetch(`/api/meetups/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId }),
      });
      const data = await response.json();
      if (data.success) {
        flash(action === 'approve' ? 'Applicant accepted 🎉' : 'Request declined');
        fetchMeetup();
      } else {
        setError(data.message || 'Action failed');
      }
    } catch {
      setError('Action failed');
    } finally {
      setBusy(false);
    }
  };

  const isCancelled = meetup?.status === 'cancelled';
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
                    {isCancelled && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="px-4 py-2 rounded-full bg-red-500 text-white text-[13px] font-extrabold uppercase tracking-wider">Cancelled</span></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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
                      {meetup.isHost && (
                        <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-[#FFD700]/90 text-[#1A1A2E] text-[10px] font-extrabold uppercase tracking-wider">
                          👑 You&apos;re the Host
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flash notice */}
                  {notice && (
                    <div className="mx-5 mt-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-semibold">
                      {notice}
                    </div>
                  )}
                  {error && (
                    <div className="mx-5 mt-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold">
                      {error}
                    </div>
                  )}

                  {/* Pinned announcement */}
                  {meetup.pinnedMessage && (
                    <div className="mx-5 mt-4 rounded-2xl bg-[#7B68EE]/10 border border-[#7B68EE]/25 p-4 shadow-sm flex gap-3">
                      <span className="text-[18px]">📌</span>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7B68EE] mb-1">Pinned by Host</div>
                        <p className="text-[14px] font-semibold text-[#1A1A2E] leading-snug">{meetup.pinnedMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    {/* Host Controls */}
                    {meetup.isHost && !isCancelled && (
                      <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40">Host Controls</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={openEditModal}
                            disabled={busy}
                            className="px-3 py-2.5 rounded-xl bg-[#7B68EE] text-white text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            ✏️ Edit Squad
                          </button>
                          <button
                            onClick={() => { setEditError(''); setShowCancelConfirm(true); }}
                            disabled={busy}
                            className="px-3 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            ⛔ Cancel Squad
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Host Admin: Pending Join Requests */}
                    {meetup.isHost && !isCancelled && (meetup.pendingRequests || []).length > 0 && (
                      <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                            Pending Join Requests ({(meetup.pendingRequests || []).length})
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            Approval Required
                          </span>
                        </div>
                        <div className="space-y-2">
                          {(meetup.pendingRequests || []).map((applicant) => (
                            <div key={applicant.id} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={applicant.photo || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'}
                                  className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                  alt={applicant.name}
                                />
                                <span className="text-[13px] font-bold text-[#1E293B] truncate">{applicant.name}</span>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handlePendingAction(applicant.id, 'approve')}
                                  disabled={busy}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer active:scale-95 transition-all shadow-2xs disabled:opacity-50"
                                >
                                  Accept ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePendingAction(applicant.id, 'decline')}
                                  disabled={busy}
                                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                                >
                                  Decline ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                            {meetup.duration ? ` · ${Math.round(meetup.duration / 60 * 10) / 10}h` : ''}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${isCancelled ? 'bg-red-50 text-red-600' : 'bg-[#7B68EE]/10 text-[#7B68EE]'}`}>
                        {isCancelled ? 'Cancelled' : 'Confirmed'}
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
                            <p className="text-[12px] text-[#1A1A2E]/50">Community Host 👑</p>
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

                    {/* Attendees */}
                    <div className="rounded-2xl bg-white border border-[#1A1A2E]/8 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#1A1A2E]/50">
                          Squad Members ({meetup.attendeesCount || 1} / {meetup.maxAttendees})
                        </h3>
                        {meetup.isHost && !isCancelled && (
                          <span className="text-[11px] font-semibold text-[#1A1A2E]/40">Tap Remove to kick</span>
                        )}
                      </div>

                      <div className="flex items-center -space-x-2">
                        {(meetup.attendees || []).slice(0, 8).map((att: Attendee, idx: number) => (
                          <img
                            key={idx}
                            src={att.photo || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'}
                            alt={att.name || 'Member'}
                            className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-xs"
                          />
                        ))}
                        {(meetup.attendees || []).length > 8 && (
                          <span className="h-10 w-10 rounded-full border-2 border-white bg-[#1A1A2E]/5 text-[#1A1A2E]/50 text-[11px] font-bold flex items-center justify-center">
                            +{(meetup.attendees || []).length - 8}
                          </span>
                        )}
                        {(meetup.attendees || []).length === 0 && (
                          <span className="text-[12px] text-[#1A1A2E]/40 font-medium">No members yet</span>
                        )}
                      </div>

                      {meetup.isHost && (meetup.attendees || []).length > 0 && (
                        <div className="space-y-1.5 border-t border-[#1A1A2E]/5 pt-3">
                          {(meetup.attendees || []).map((att: Attendee) => (
                            <div key={att.id} className="flex items-center gap-3">
                              <img
                                src={att.photo || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'}
                                className="h-8 w-8 rounded-full object-cover border border-[#1A1A2E]/10"
                                alt={att.name}
                              />
                              <span className="flex-1 text-[13px] font-semibold text-[#1A1A2E]">{att.name}</span>
                              <span className="text-[10px] text-[#1A1A2E]/35 font-bold uppercase">Going</span>
                              {att.id !== meetup.host?.id && !isCancelled && (
                                <button
                                  onClick={() => kickUser(att.id)}
                                  disabled={kickingId === att.id}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                                >
                                  {kickingId === att.id ? '...' : 'Remove'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action CTA */}
                {!isCancelled && (
                  <div className="flex-shrink-0 p-5 bg-white/90 backdrop-blur-md border-t border-[#1A1A2E]/5 z-20">
                    {meetup.isHost ? (
                      <p className="text-center text-[13px] font-semibold text-[#1A1A2E]/50 py-2">
                        You&apos;re hosting this squad 👑
                      </p>
                    ) : (
                      <button
                        onClick={handleJoin}
                        disabled={busy || (isFull && meetup.userJoinStatus !== 'going' && meetup.userJoinStatus !== 'pending') || meetup.userJoinStatus === 'kicked'}
                        className={`w-full h-13 rounded-2xl font-extrabold text-[15px] shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          meetup.userJoinStatus === 'going'
                            ? 'bg-white border border-[#1A1A2E]/15 text-[#1A1A2E]'
                            : meetup.userJoinStatus === 'pending'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : meetup.userJoinStatus === 'kicked'
                            ? 'bg-red-50 border border-red-200 text-red-600 cursor-not-allowed shadow-none'
                            : isFull
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white shadow-[#FF6B9D]/30 active:scale-[0.99]'
                        }`}
                      >
                        {meetup.userJoinStatus === 'going'
                          ? 'Joined ✓ (Tap to Leave)'
                          : meetup.userJoinStatus === 'pending'
                          ? 'Request Sent ⏳ (Tap to Cancel)'
                          : meetup.userJoinStatus === 'kicked'
                          ? 'Removed by Host ⚠️'
                          : isFull
                          ? 'Session Full 🔒'
                          : meetup.requireApproval
                          ? 'Request to Join ✋'
                          : 'Join Session 🚀'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Edit Modal */}
            {showEdit && editForm && (
              <div className="absolute inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white w-full max-w-[440px] rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-extrabold text-[#1A1A2E]">✏️ Edit Squad</h3>
                    <button onClick={() => setShowEdit(false)} className="h-8 w-8 rounded-full bg-[#1A1A2E]/5 text-[#1A1A2E]/60 font-bold cursor-pointer">✕</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">Title</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40"
                        placeholder="Squad title"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">When</label>
                      <input
                        type="datetime-local"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">Venue</label>
                        <input
                          value={editForm.venueName}
                          onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40"
                          placeholder="e.g. Cuffe Parade Ground"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">Slots</label>
                        <input
                          type="number"
                          min={2}
                          max={100}
                          value={editForm.maxAttendees}
                          onChange={(e) => setEditForm({ ...editForm, maxAttendees: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">📌 Pinned announcement (shown to all members)</label>
                      <textarea
                        value={editForm.pinnedMessage}
                        maxLength={500}
                        onChange={(e) => setEditForm({ ...editForm, pinnedMessage: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 resize-none"
                        placeholder="e.g. Meeting outside Starbucks at 5 PM"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/40 block mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#1A1A2E]/10 text-[14px] font-semibold text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 resize-none"
                      />
                    </div>
                    {editError && <p className="text-[12px] font-semibold text-red-600">{editError}</p>}
                    <button
                      onClick={saveEdit}
                      disabled={busy}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white text-[14px] font-extrabold shadow-lg cursor-pointer active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      {busy ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Confirm */}
            {showCancelConfirm && (
              <div className="absolute inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white w-full max-w-[440px] rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="text-[34px]">⛔</div>
                  <h3 className="text-[16px] font-extrabold text-[#1A1A2E]">Cancel this squad?</h3>
                  <p className="text-[13px] text-[#1A1A2E]/60 leading-relaxed">
                    All {Math.max(meetup?.attendeesCount ?? 1, 1)} members will be notified and the squad will disappear from the public list. This can&apos;t be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={busy}
                      className="flex-1 py-3 rounded-2xl bg-[#1A1A2E]/5 text-[#1A1A2E] text-[14px] font-bold cursor-pointer active:scale-[0.99]"
                    >
                      Keep Squad
                    </button>
                    <button
                      onClick={cancelMeetup}
                      disabled={busy}
                      className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-[14px] font-extrabold shadow-lg cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      {busy ? 'Cancelling...' : 'Cancel Squad'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Host Banner for cancelled state */}
            {isCancelled && (
              <div className="flex-shrink-0 p-5 bg-white/90 backdrop-blur-md border-t border-[#1A1A2E]/5 z-20">
                <p className="text-center text-[13px] font-bold text-red-600 py-2">
                  This squad has been cancelled.
                </p>
              </div>
            )}
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
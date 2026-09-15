'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Ic } from '../../../components/icons';
import { hapticLight, hapticMedium, hapticWarning } from '../../../lib/haptics';
import { MAX_VOICE_BYTES, MAX_VOICE_SECONDS, MIN_VOICE_SECONDS, voiceExtension } from '@/lib/voice-notes';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import styles from '../chat.module.css';

type Mode = 'idle' | 'requesting' | 'holding' | 'locked' | 'stopping' | 'preview';
type FinishAction = 'send' | 'preview' | 'discard';
interface Session {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
  startedAt: number;
  seconds: number;
  bytes: number;
  action: FinishAction;
}
interface Draft { file: File; seconds: number; url: string }
interface VoiceRecorderProps {
  onSendVoice: (file: File, durationSec: number) => boolean;
  onBusyChange: (busy: boolean) => void;
  onBeforeRecord: () => void;
  blocked?: boolean;
}

export function VoiceRecorder({ onSendVoice, onBusyChange, onBeforeRecord, blocked = false }: VoiceRecorderProps) {
  const instructionsId = useId();
  const [mode, setMode] = useState<Mode>('idle');
  const [seconds, setSeconds] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const modeRef = useRef<Mode>('idle');
  const draftRef = useRef<Draft | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const permissionPending = useRef(false);
  const mounted = useRef(true);
  const suppressClick = useRef(false);
  const callbacks = useRef({ onSendVoice, onBusyChange, onBeforeRecord, blocked });
  callbacks.current = { onSendVoice, onBusyChange, onBeforeRecord, blocked };

  const changeMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
    callbacks.current.onBusyChange(next !== 'idle');
  }, []);
  const clearTimers = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (clockTimer.current) clearInterval(clockTimer.current);
    holdTimer.current = null;
    clockTimer.current = null;
  }, []);
  const clearDraft = useCallback(() => {
    if (draftRef.current) URL.revokeObjectURL(draftRef.current.url);
    draftRef.current = null;
    setDraft(null);
  }, []);

  const finish = useCallback((action: FinishAction) => {
    clearTimers();
    generation.current += 1; // Invalidate any unresolved microphone permission request.
    pointerRef.current = null;
    setDrag({ x: 0, y: 0 });
    const session = sessionRef.current;
    if (!session) {
      if (modeRef.current !== 'preview') changeMode('idle');
      return;
    }
    if (modeRef.current === 'stopping') {
      if (action !== 'send') session.action = action;
      return;
    }
    session.action = action;
    session.seconds = Math.min(MAX_VOICE_SECONDS, (performance.now() - session.startedAt) / 1000);
    changeMode('stopping');
    if (session.recorder.state !== 'inactive') session.recorder.stop();
    session.stream.getTracks().forEach((track) => { track.onended = null; track.stop(); });
  }, [changeMode, clearTimers]);

  const begin = useCallback(async (locked: boolean) => {
    if (modeRef.current !== 'idle' || callbacks.current.blocked) return;
    if (permissionPending.current) {
      setNotice('Allow microphone access first, then hold to record again.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice('Voice recording is unavailable here. Try opening Infyn in Safari or Chrome.');
      return;
    }
    const token = ++generation.current;
    permissionPending.current = true;
    setNotice('');
    window.dispatchEvent(new CustomEvent('infyn:voice-play', { detail: null }));
    callbacks.current.onBeforeRecord();
    changeMode('requesting');
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || token !== generation.current || callbacks.current.blocked || (!locked && !pointerRef.current)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('unsupported-format');
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
      const session: Session = { recorder, stream, chunks: [], startedAt: performance.now(), seconds: 0, bytes: 0, action: 'preview' };
      sessionRef.current = session;
      recorder.ondataavailable = ({ data }) => {
        if (!data.size) return;
        session.chunks.push(data);
        session.bytes += data.size;
        if (session.bytes >= MAX_VOICE_BYTES && modeRef.current !== 'stopping') {
          setNotice('Recording size limit reached.');
          finish('preview');
        }
      };
      recorder.onstop = () => {
        if (!mounted.current || sessionRef.current !== session) return;
        sessionRef.current = null;
        clearTimers();
        session.stream.getTracks().forEach((track) => { track.onended = null; track.stop(); });
        const blob = new Blob(session.chunks, { type: recorder.mimeType || mimeType });
        if (session.action === 'discard' || !blob.size || session.seconds < MIN_VOICE_SECONDS || blob.size > MAX_VOICE_BYTES) {
          if (session.action !== 'discard') setNotice(blob.size > MAX_VOICE_BYTES ? 'Recording is too large. Please record a shorter note.' : 'Hold a little longer to record a voice note.');
          changeMode('idle');
          return;
        }
        const file = new File([blob], `voice-note.${voiceExtension(blob.type)}`, { type: blob.type });
        if (session.action === 'send' && callbacks.current.onSendVoice(file, session.seconds)) {
          changeMode('idle');
          return;
        }
        const next = { file, seconds: session.seconds, url: URL.createObjectURL(file) };
        draftRef.current = next;
        setDraft(next);
        changeMode('preview');
      };
      recorder.onerror = () => {
        setNotice('Recording was interrupted. Review the audio before sending.');
        finish('preview');
      };
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => { setNotice('Microphone disconnected. Review before sending.'); finish('preview'); };
      });
      recorder.start(250);
      setSeconds(0);
      changeMode(locked ? 'locked' : 'holding');
      hapticLight();
      clockTimer.current = setInterval(() => {
        const elapsed = (performance.now() - session.startedAt) / 1000;
        setSeconds(Math.min(MAX_VOICE_SECONDS, elapsed));
        if (elapsed >= MAX_VOICE_SECONDS) {
          setNotice('2-minute limit reached. Review before sending.');
          finish('preview');
        }
      }, 200);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (!mounted.current || token !== generation.current) return;
      sessionRef.current = null;
      pointerRef.current = null;
      clearTimers();
      changeMode('idle');
      const denied = error instanceof DOMException && error.name === 'NotAllowedError';
      setNotice(denied ? 'Microphone access is blocked. Allow it in your browser or app settings, then try again.' : 'Could not start the microphone. Check that it is available and try again.');
      hapticWarning();
    } finally {
      permissionPending.current = false;
    }
  }, [changeMode, clearTimers, finish]);

  const interrupt = useCallback(() => {
    // Clear an armed hold too, before its permission request has started.
    if (modeRef.current === 'idle') { clearTimers(); pointerRef.current = null; return; }
    if (modeRef.current === 'preview') return;
    setNotice('Recording stopped. Review before sending.');
    finish('preview');
  }, [clearTimers, finish]);

  useEffect(() => { if (blocked) interrupt(); }, [blocked, interrupt]);
  useEffect(() => {
    mounted.current = true;
    const onHidden = () => { if (document.hidden) interrupt(); };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modeRef.current !== 'idle') {
        finish('discard'); clearDraft(); setNotice('Recording deleted.');
        if (!sessionRef.current) changeMode('idle');
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('pagehide', interrupt);
    window.addEventListener('infyn:call-interruption', interrupt);
    return () => {
      mounted.current = false;
      generation.current += 1;
      clearTimers();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        session.recorder.onstop = null;
        session.recorder.ondataavailable = null;
        session.recorder.onerror = null;
        if (session.recorder.state !== 'inactive') session.recorder.stop();
        session.stream.getTracks().forEach((track) => { track.onended = null; track.stop(); });
      }
      if (draftRef.current) URL.revokeObjectURL(draftRef.current.url);
      document.removeEventListener('visibilitychange', onHidden);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('pagehide', interrupt);
      window.removeEventListener('infyn:call-interruption', interrupt);
    };
  }, [changeMode, clearDraft, clearTimers, finish, interrupt]);

  const discard = () => {
    finish('discard');
    if (!sessionRef.current) { clearDraft(); changeMode('idle'); }
    setNotice('Recording deleted.');
    hapticWarning();
  };
  const sendDraft = () => {
    if (draftRef.current && callbacks.current.onSendVoice(draftRef.current.file, draftRef.current.seconds)) {
      clearDraft(); changeMode('idle'); setNotice('');
    }
  };
  const timer = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

  return (
    <>
      <span id={instructionsId} className="sr-only">Hold and release to send. Slide up to lock or left to cancel. Keyboard activation starts hands-free recording; Escape deletes it.</span>
      {notice && <p className={styles.voiceNotice} role="status">{notice}</p>}
      {mode !== 'idle' && (
        <div className={styles.recordingBar} role="group" aria-label="Voice recording">
          {mode === 'preview' && draft ? (
            <>
              <button type="button" className={styles.voiceAuxButton} aria-label="Delete recording" onClick={discard}><Ic.Trash /></button>
              <div className={styles.voicePreview}><VoiceMessagePlayer audioUrl={draft.url} isMine durationSec={draft.seconds} /></div>
            </>
          ) : (
            <>
              {mode === 'locked' && <button type="button" className={styles.voiceAuxButton} aria-label="Delete recording" onClick={discard}><Ic.Trash /></button>}
              <span className={styles.recordingTimer}><span className={styles.recordingDot} />{timer}</span>
              <span className={styles.recordingHint} aria-live="polite">{mode === 'requesting' ? 'Allow microphone access…' : mode === 'stopping' ? 'Preparing audio…' : mode === 'locked' ? 'Recording locked' : '← Slide left to cancel'}</span>
              {mode === 'locked' && <button type="button" className={styles.voiceAuxButton} aria-label="Stop recording" onClick={() => finish('preview')}><span className={styles.stopIcon} /></button>}
              {mode === 'requesting' && <button type="button" className={styles.voiceAuxButton} aria-label="Cancel recording" onClick={discard}>×</button>}
            </>
          )}
        </div>
      )}
      {mode === 'holding' && <div className={styles.recordingLockHint} style={{ transform: `translateY(${-drag.y * 0.15}px)` }}><LockIcon /><span>Slide up<br />to lock</span></div>}
      <button
        type="button"
        className={`${styles.sendButton} ${styles.voiceButton} ${mode === 'holding' ? styles.voiceButtonRecording : ''}`}
        style={mode === 'holding' ? { transform: `translate(${-drag.x * 0.18}px, ${-drag.y * 0.18}px) scale(1.06)` } : undefined}
        disabled={blocked || mode === 'stopping'}
        aria-label={mode === 'locked' || mode === 'preview' ? 'Send voice note' : 'Hold to record voice note'}
        aria-describedby={instructionsId}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (modeRef.current !== 'idle' || event.button !== 0 || !event.isPrimary) return;
          suppressClick.current = true;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          holdTimer.current = setTimeout(() => { holdTimer.current = null; void begin(false); }, 220);
        }}
        onPointerMove={(event) => {
          const pointer = pointerRef.current;
          if (!pointer || pointer.id !== event.pointerId || modeRef.current === 'locked') return;
          const x = Math.max(0, pointer.x - event.clientX);
          const y = Math.max(0, pointer.y - event.clientY);
          if (x >= 90 && x > y) { discard(); return; }
          if (modeRef.current !== 'holding') return;
          if (y >= 72 && y > x) { changeMode('locked'); setDrag({ x: 0, y: 0 }); hapticMedium(); return; }
          setDrag({ x, y });
        }}
        onPointerUp={(event) => {
          if (pointerRef.current?.id !== event.pointerId) return;
          pointerRef.current = null;
          if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
          if (modeRef.current === 'holding') finish('send');
          else if (modeRef.current === 'requesting') { finish('discard'); setNotice('After allowing the microphone, hold again to record.'); }
          else if (modeRef.current === 'idle') setNotice('Hold to record. Slide up to lock, or left to cancel.');
        }}
        onPointerCancel={() => interrupt()}
        onLostPointerCapture={() => { if (modeRef.current === 'holding' || modeRef.current === 'requesting') interrupt(); }}
        onClick={(event) => {
          if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
          if (modeRef.current === 'locked') finish('send');
          else if (modeRef.current === 'preview') sendDraft();
          else if (modeRef.current === 'idle' && event.detail === 0) void begin(true);
        }}
      >
        {mode === 'locked' || mode === 'preview' ? <SendIcon /> : <Ic.Mic />}
      </button>
    </>
  );
}

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></svg>;
}
function SendIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></svg>;
}

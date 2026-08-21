'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecorderProps {
  onSendVoice: (audioBlobUrl: string, durationSec: number) => void;
}

export function VoiceRecorder({ onSendVoice }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const cleanupRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setDuration(0);
    setDragOffset(0);
    setIsCancelled(false);
  }, []);

  const startRecording = async (clientX: number) => {
    try {
      startXRef.current = clientX;
      setIsCancelled(false);
      setDragOffset(0);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!isCancelled && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          onSendVoice(audioUrl, elapsedSec);
        }
        cleanupRecording();
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start(100);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or unsupported:', err);
      cleanupRecording();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    if (diff > 0) {
      setDragOffset(Math.min(diff, 150));
      if (diff > 100) {
        setIsCancelled(true);
      } else {
        setIsCancelled(false);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative flex items-center select-none">
      {/* Full-width Recording Bar overlay when active */}
      {isRecording && (
        <div className="absolute right-0 bottom-0 left-[-240px] sm:left-[-320px] h-11 rounded-2xl bg-[#1A1A2E] text-white px-3 flex items-center justify-between shadow-lg z-30 animate-scale-pop">
          {/* Pulsing Dot & Timer */}
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[13px] font-mono font-bold text-white">
              {formatTimer(duration)}
            </span>
          </div>

          {/* Animated Waveform Visualizer */}
          <div className="flex items-center gap-0.5 px-2">
            {[14, 22, 10, 26, 16, 20, 8, 24, 18, 12, 28, 14, 22].map((height, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-gradient-to-t from-[#FF6B9D] to-[#7B68EE] animate-pulse"
                style={{
                  height: `${height}px`,
                  animationDelay: `${(i % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Slide to Cancel Hint */}
          <div
            className={`text-[11.5px] font-medium transition-colors ${
              isCancelled ? 'text-rose-400 font-bold' : 'text-white/60'
            }`}
            style={{ transform: `translateX(-${dragOffset * 0.25}px)` }}
          >
            {isCancelled ? 'Release to cancel' : '← Slide to cancel'}
          </div>
        </div>
      )}

      {/* Hold-to-Record Mic Button */}
      <button
        type="button"
        onMouseDown={(e) => startRecording(e.clientX)}
        onMouseUp={stopRecording}
        onTouchStart={(e) => startRecording(e.touches[0].clientX)}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopRecording}
        aria-label="Hold to record voice note"
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-all cursor-pointer ${
          isRecording
            ? 'bg-rose-500 text-white scale-110 shadow-lg'
            : 'bg-[#1A1A2E]/[0.05] text-[#1A1A2E]/70 hover:bg-[#1A1A2E]/10 active:scale-95'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  );
}

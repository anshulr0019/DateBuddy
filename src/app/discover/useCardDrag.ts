'use client';

import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import { hapticLight } from '../lib/haptics';

type DragAction = 'like' | 'pass';

interface Options {
  cardRef: RefObject<HTMLDivElement | null>;
  underRef: RefObject<HTMLDivElement | null>;
  likeBadgeRef: RefObject<HTMLDivElement | null>;
  passBadgeRef: RefObject<HTMLDivElement | null>;
  enabledRef: RefObject<boolean>;
  onCommit: (action: DragAction) => void;
}

const INTENT_SLOP = 10; // px before we claim the gesture as a horizontal drag
const MIN_COMMIT_DISTANCE = 110; // px floor for low-width layouts
const COMMIT_FRACTION = 0.38; // of card width
const FLICK_VELOCITY = 0.55; // px/ms
const FLICK_MIN_DISTANCE = 56; // a flick still needs real displacement
const EXIT_MS = 260; // matches SWIPE_ANIMATION_MS in page.tsx
const RETURN_MS = 320;

export const UNDER_CARD_REST = 'scale(0.965) translateY(10px)';

/*
  Direct-manipulation swipe for the Discover deck.

  The gesture writes transforms straight to the DOM (no React state per
  frame). Vertical scrolling stays native: `touch-action: pan-y` on the
  card means the browser keeps vertical pans and fires pointercancel,
  while horizontal movement is delivered here. Button-driven swipes and
  the undo flow are untouched — this layer only decides when a drag
  becomes a commit and hands off to the page's existing commitSwipe.
*/
export function useCardDrag({ cardRef, underRef, likeBadgeRef, passBadgeRef, enabledRef, onCommit }: Options) {
  const state = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    dx: 0,
    horizontal: false,
    crossed: false,
    suppressClick: false,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    reducedMotion: false,
  });

  const setBadges = useCallback((dx: number, progress: number) => {
    const like = likeBadgeRef.current;
    const pass = passBadgeRef.current;
    if (like) like.style.opacity = dx > 0 ? String(Math.min(1, progress * 1.2)) : '0';
    if (pass) pass.style.opacity = dx < 0 ? String(Math.min(1, progress * 1.2)) : '0';
  }, [likeBadgeRef, passBadgeRef]);

  const settleUnderCard = useCallback((promote: boolean) => {
    const under = underRef.current;
    if (!under) return;
    under.style.transition = `transform ${promote ? EXIT_MS : RETURN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    under.style.transform = promote ? 'scale(1) translateY(0)' : UNDER_CARD_REST;
  }, [underRef]);

  const endDrag = useCallback(() => {
    const s = state.current;
    s.pointerId = null;
    s.horizontal = false;
    setBadges(0, 0);
  }, [setBadges]);

  const cancelDrag = useCallback(() => {
    const s = state.current;
    const el = cardRef.current;
    if (el && s.horizontal) {
      if (s.reducedMotion) {
        el.style.transition = '';
        el.style.transform = '';
      } else {
        // Interruptible spring-back: a new pointerdown mid-return reads the
        // computed transform and resumes from there.
        el.style.transition = `transform ${RETURN_MS}ms cubic-bezier(0.34, 1.3, 0.64, 1)`;
        el.style.transform = '';
      }
      el.style.willChange = '';
      settleUnderCard(false);
    }
    endDrag();
  }, [cardRef, settleUnderCard, endDrag]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = cardRef.current;
    if (!el) return;
    const s = state.current;
    s.pointerId = e.pointerId;
    s.startY = e.clientY;
    s.horizontal = false;
    s.crossed = false;
    s.suppressClick = false;
    s.dx = 0;
    s.lastX = e.clientX;
    s.lastT = e.timeStamp;
    s.velocity = 0;
    s.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // If the card is mid-return, pick it up where it is.
    const current = getComputedStyle(el).transform;
    if (current && current !== 'none') {
      el.style.transition = '';
      const matrix = new DOMMatrixReadOnly(current);
      s.startX = e.clientX - matrix.m41;
      s.dx = matrix.m41;
      if (Math.abs(matrix.m41) > 1) s.horizontal = true;
    } else {
      s.startX = e.clientX;
    }
  }, [cardRef, enabledRef]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (s.pointerId !== e.pointerId || !enabledRef.current) return;
    const el = cardRef.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.horizontal) {
      if (Math.abs(dx) < INTENT_SLOP || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      s.horizontal = true;
      el.setPointerCapture(e.pointerId);
      el.style.transition = '';
      el.style.willChange = 'transform';
      const under = underRef.current;
      if (under) under.style.transition = '';
    }

    const dt = e.timeStamp - s.lastT;
    if (dt > 0) s.velocity = (e.clientX - s.lastX) / dt;
    s.lastX = e.clientX;
    s.lastT = e.timeStamp;
    s.dx = dx;
    s.suppressClick = true;

    const width = el.offsetWidth || 320;
    const commitDistance = Math.max(MIN_COMMIT_DISTANCE, width * COMMIT_FRACTION);
    const progress = Math.min(1, Math.abs(dx) / commitDistance);
    const rotation = Math.max(-11, Math.min(11, dx * 0.045));
    el.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`;
    setBadges(dx, progress);
    const under = underRef.current;
    if (under) {
      const scale = 0.965 + 0.035 * progress;
      under.style.transform = `scale(${scale}) translateY(${10 * (1 - progress)}px)`;
    }

    const crossed = Math.abs(dx) >= commitDistance;
    if (crossed && !s.crossed) hapticLight();
    s.crossed = crossed;
  }, [cardRef, underRef, enabledRef, setBadges]);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (s.pointerId !== e.pointerId) return;
    const el = cardRef.current;
    if (!el || !s.horizontal) { endDrag(); return; }

    const width = el.offsetWidth || 320;
    const commitDistance = Math.max(MIN_COMMIT_DISTANCE, width * COMMIT_FRACTION);
    const flick = Math.abs(s.velocity) > FLICK_VELOCITY && Math.abs(s.dx) > FLICK_MIN_DISTANCE && Math.sign(s.velocity) === Math.sign(s.dx);
    if (Math.abs(s.dx) >= commitDistance || flick) {
      const action: DragAction = s.dx > 0 ? 'like' : 'pass';
      const direction = Math.sign(s.dx);
      if (s.reducedMotion) {
        el.style.transition = 'opacity 160ms ease-out';
        el.style.opacity = '0';
      } else {
        el.style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.3, 0.7, 0.4, 1), opacity ${EXIT_MS}ms ease-in`;
        el.style.transform = `translateX(${direction * width * 1.35}px) rotate(${direction * 14}deg)`;
        el.style.opacity = '0.35';
      }
      settleUnderCard(true);
      endDrag();
      onCommit(action);
      return;
    }
    cancelDrag();
  }, [cardRef, onCommit, cancelDrag, settleUnderCard, endDrag]);

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // The browser claimed the gesture (vertical scroll) — put everything back.
    if (state.current.pointerId === e.pointerId) cancelDrag();
  }, [cancelDrag]);

  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (state.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      state.current.suppressClick = false;
    }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture };
}

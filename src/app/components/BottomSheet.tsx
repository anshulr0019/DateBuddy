'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.5; // px/ms
const EXIT_MS = 220;

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/*
  Bottom sheet with drag-to-dismiss on the grab area (handle + title), so
  the sheet body keeps native scrolling. Escape, the backdrop, Android back
  and whatever button the caller puts in `footer` all close it too.
*/
export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const drag = useRef({ id: null as number | null, startY: 0, dy: 0, lastY: 0, lastT: 0, v: 0 });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount on open; on close play the exit before unmounting.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => { setMounted(false); setClosing(false); }, reduced ? 0 : EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  // Focus in, focus back out.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => sheetRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(id);
      restoreFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Escape + Android back. One history entry while open, consumed on close.
  useEffect(() => {
    if (!open) return;
    let poppedByBack = false;
    window.history.pushState({ infynSheet: true }, '');
    const onPop = () => { poppedByBack = true; onCloseRef.current(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheetRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      if (!poppedByBack && window.history.state?.infynSheet) window.history.back();
    };
  }, [open]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = sheetRef.current;
    if (!el) return;
    drag.current = { id: e.pointerId, startY: e.clientY, dy: 0, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    el.style.transition = 'none';
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = sheetRef.current;
    if (d.id !== e.pointerId || !el) return;
    const raw = e.clientY - d.startY;
    // Resist upward pulls; follow the finger downward.
    d.dy = raw < 0 ? raw / 4 : raw;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    el.style.transform = `translateY(${d.dy}px)`;
  }, []);

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    const el = sheetRef.current;
    if (d.id !== e.pointerId || !el) return;
    d.id = null;
    const dismiss = !cancelled && (d.dy > DISMISS_DISTANCE || (d.v > DISMISS_VELOCITY && d.dy > 24));
    el.style.transition = '';
    if (dismiss) {
      el.style.transform = `translateY(${d.dy}px)`;
      onCloseRef.current();
    } else {
      el.style.transform = '';
    }
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  // Portal to <body>: an ancestor with a transform would otherwise become
  // the containing block for position: fixed and clip the sheet.
  return createPortal(
    <div className={`infyn-sheet-root ${closing ? 'infyn-sheet-closing' : ''}`} role="presentation">
      <div className="infyn-sheet-backdrop" onClick={() => onCloseRef.current()} aria-hidden="true" />
      <div ref={sheetRef} className="infyn-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="infyn-sheet-grab" onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)} onPointerCancel={(e) => endDrag(e, true)}>
          <span className="infyn-sheet-handle" aria-hidden="true" />
          <h2 className="infyn-sheet-title">{title}</h2>
        </div>
        <div className="infyn-sheet-body">{children}</div>
        {footer && <div className="infyn-sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

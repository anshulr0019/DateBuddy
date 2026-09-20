'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createEarthRenderer } from './earth-renderer';
import styles from './PremiumGlobe.module.css';

export function PremiumGlobe({ vibe, onlineCount }: { vibe: string | null; onlineCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pose = useRef({ yaw: 1.3, pitch: -0.12, velocity: 0, dragging: false, pointer: -1, x: 0, y: 0 });
  const redraw = useRef<(() => void) | null>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);
  const motion = useRef({ paused: false, reduced: false });
  motion.current = { paused, reduced: reducedMotion };
  const helpId = useId();

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let previous = 0;
    let seconds = 0;
    let loaded = false;
    let visible = true;
    let stopped = false;
    let renderer: ReturnType<typeof createEarthRenderer> | undefined;
    const fail = () => { stopped = true; cancelAnimationFrame(frame); setFailed(true); setReady(false); };
    const draw = () => { if (loaded && !stopped) renderer?.draw(pose.current.yaw, pose.current.pitch, seconds); };
    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || !visible || stopped) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      const moving = !motion.current.paused && !motion.current.reduced;
      if (moving && !pose.current.dragging) {
        pose.current.yaw += (0.085 + pose.current.velocity) * dt;
        pose.current.velocity *= Math.exp(-3 * dt);
        seconds += dt;
      }
      draw();
      if (moving) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!document.hidden && visible && !stopped) frame = requestAnimationFrame(tick);
    };
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    const restored = () => setContextVersion(value => value + 1);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    setFailed(false);
    setReady(false);
    try {
      renderer = createEarthRenderer(canvas, () => { loaded = true; setReady(true); wake(); }, fail);
    } catch { fail(); }
    redraw.current = wake;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    observer.observe(canvas);
    const resize = new ResizeObserver(wake);
    resize.observe(canvas);
    document.addEventListener('visibilitychange', wake);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', wake);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      renderer?.dispose();
      redraw.current = null;
    };
  }, [contextVersion]);

  useEffect(() => { redraw.current?.(); }, [paused, reducedMotion]);

  const rotate = (amount: number) => { pose.current.yaw += amount; pose.current.velocity = 0; redraw.current?.(); };
  const endDrag = () => { pose.current.dragging = false; pose.current.pointer = -1; };

  return (
    <figure className={styles.figure}>
      <div className={styles.stage}>
        {(!ready || failed) && <div className={styles.fallback} role="img" aria-label="Earth map" />}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none' }}
          role="img"
          aria-label="Rotating Earth with continents, oceans and clouds"
          aria-describedby={helpId}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            pose.current = { ...pose.current, dragging: true, pointer: event.pointerId, x: event.clientX, y: event.clientY, velocity: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const p = pose.current;
            if (!p.dragging || p.pointer !== event.pointerId) return;
            const dx = event.clientX - p.x;
            p.yaw -= dx * 0.008;
            p.pitch = Math.max(-0.8, Math.min(0.8, p.pitch + (event.clientY - p.y) * 0.006));
            p.velocity = Math.max(-1.2, Math.min(1.2, -dx * 0.07));
            p.x = event.clientX;
            p.y = event.clientY;
            redraw.current?.();
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        />
      </div>
      {ready && <div className={styles.controls}>
        <button type="button" onClick={() => rotate(0.3)} aria-label="Rotate globe left">←</button>
        <button type="button" onClick={() => setPaused(value => !value)} disabled={reducedMotion} aria-pressed={paused || reducedMotion}>
          {paused || reducedMotion ? 'Rotation paused' : 'Pause rotation'}
        </button>
        <button type="button" onClick={() => rotate(-0.3)} aria-label="Rotate globe right">→</button>
      </div>}
      <figcaption className={styles.caption}>
        <p id={helpId}>{failed ? 'Earth preview · animation unavailable' : ready ? 'Drag to explore. Your location stays off the globe.' : 'Loading Earth…'}</p>
        <p className={styles.status}>{onlineCount > 0 ? `${onlineCount} people online` : 'Waiting for someone to join'}{vibe ? ` · ${vibe}` : ''}</p>
        <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Earth imagery: Solar System Scope · CC BY 4.0</a>
      </figcaption>
    </figure>
  );
}

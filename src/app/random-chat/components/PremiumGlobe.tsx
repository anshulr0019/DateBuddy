'use client';

import { useEffect, useRef, useState } from 'react';
import { createEarthRenderer } from './earth-renderer';
import styles from './PremiumGlobe.module.css';

export function PremiumGlobe({ vibe, onlineCount }: { vibe: string | null; onlineCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pose = useRef({ yaw: 1.3, pitch: -0.12 });
  const redraw = useRef<(() => void) | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);
  const motion = useRef({ reduced: false });
  motion.current = { reduced: reducedMotion };

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
      const moving = !motion.current.reduced;
      if (moving) {
        pose.current.yaw += 0.085 * dt;
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

  useEffect(() => { redraw.current?.(); }, [reducedMotion]);

  return (
    <figure className={styles.figure}>
      <div className={styles.stage}>
        {(!ready || failed) && <div className={styles.fallback} role="img" aria-label="Earth map" />}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ opacity: ready ? 1 : 0 }}
          role="img"
          aria-label="Animated cartoon globe with mint continents, blue oceans and floating clouds"
        />
      </div>
      <figcaption className={styles.caption}>
        <p className={styles.status}>{onlineCount > 0 ? `${onlineCount} people online` : 'Waiting for someone to join'}{vibe ? ` · ${vibe}` : ''}</p>
      </figcaption>
    </figure>
  );
}

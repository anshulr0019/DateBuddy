'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { hapticLight } from '@/app/lib/haptics';

interface CityBeacon {
  name: string;
  lat: number;
  lon: number;
  vibe: string;
  color: string;
}

// Major hub coordinates for authentic local connection feel
const CITIES: CityBeacon[] = [
  { name: 'Mumbai', lat: 19.076, lon: 72.877, vibe: 'Coffee & Banter', color: '#F43F5E' },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.209, vibe: 'Late Night Chats', color: '#7B68EE' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, vibe: 'Tech & Music', color: '#38BDF8' },
  { name: 'Goa', lat: 15.2993, lon: 74.124, vibe: 'Sunset Chill', color: '#F59E0B' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, vibe: 'Chai & Deep Talks', color: '#EC4899' },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867, vibe: 'Foodie Vibes', color: '#10B981' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, vibe: 'Art & Poetry', color: '#A855F7' },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, vibe: 'Royal Romance', color: '#FB923C' },
];

// Connected city pairs for luminous arcs
const ARCS: [number, number][] = [
  [0, 1], // Mumbai <-> Delhi
  [0, 2], // Mumbai <-> Bengaluru
  [2, 5], // Bengaluru <-> Hyderabad
  [1, 7], // Delhi <-> Jaipur
  [0, 4], // Mumbai <-> Pune
  [0, 3], // Mumbai <-> Goa
  [1, 6], // Delhi <-> Kolkata
];

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  alpha: number;
}

const SCAN_MESSAGES = [
  'Triangulating vibe frequencies…',
  'Syncing with active seekers…',
  'Scanning pulses in Mumbai & Delhi…',
  'Calibrating chemistry radar…',
  'Filtering matching wavelengths…',
  'Locking onto live signals…',
];

export function PremiumGlobe({
  vibe,
  onlineCount,
}: {
  vibe: string | null;
  onlineCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Rotation angles (radians)
  const rotYRef = useRef<number>(-1.3); // initial yaw facing India
  const rotXRef = useRef<number>(0.38); // axial tilt (~22 deg)
  const velYRef = useRef<number>(0.0035); // auto spin velocity
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const [activeCityName, setActiveCityName] = useState<string>('Mumbai');
  const [activeCityVibe, setActiveCityVibe] = useState<string>('Coffee & Banter');
  const [scanMessageIndex, setScanMessageIndex] = useState<number>(0);

  // Rotate status messages every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setScanMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Convert Lat/Lon (degrees) to 3D Cartesian coords on unit sphere
  const latLonToXYZ = useCallback((latDeg: number, lonDeg: number, radius: number) => {
    const phi = (90 - latDeg) * (Math.PI / 180);
    const theta = (lonDeg + 180) * (Math.PI / 180);
    return {
      x: -(radius * Math.sin(phi) * Math.cos(theta)),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta),
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Retina display scaling
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const size = 260; // Logical CSS pixels
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const globeRadius = 96;

    // Generate Fibonacci Sphere Dots (340 distributed points for dense, sleek sphere)
    const DOT_COUNT = 340;
    const points: Point3D[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < DOT_COUNT; i++) {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push({
        x: x * globeRadius,
        y: y * globeRadius,
        z: z * globeRadius,
        baseRadius: Math.random() < 0.15 ? 1.8 : 1.15,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }

    // Convert City nodes to initial 3D positions
    const cityNodes = CITIES.map((c) => ({
      ...c,
      ...latLonToXYZ(c.lat, c.lon, globeRadius),
    }));

    let arcProgress = 0;
    let sweepAngle = 0;

    const render = () => {
      // Rotation physics & damping
      if (!isDraggingRef.current) {
        // Natural continuous auto-rotation
        rotYRef.current += velYRef.current;
        // Ease back to baseline spin if it was spun fast by user drag
        velYRef.current += (0.0045 - velYRef.current) * 0.03;
      }

      sweepAngle = (sweepAngle + 0.024) % (Math.PI * 2);
      arcProgress = (arcProgress + 0.012) % 1;

      ctx.clearRect(0, 0, size, size);

      const rotY = rotYRef.current;
      const rotX = rotXRef.current;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Helper to rotate a 3D point around Y then X axis
      const rotatePoint = (x: number, y: number, z: number) => {
        // Yaw (around Y axis)
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Pitch (around X axis)
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        return { x: x1, y: y2, z: z2 };
      };

      // ─── 1. ATMOSPHERIC BACK GLOW & CORONA ───
      const backGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        globeRadius * 0.3,
        centerX,
        centerY,
        globeRadius * 1.35
      );
      backGlow.addColorStop(0, 'rgba(255, 107, 157, 0.14)');
      backGlow.addColorStop(0.5, 'rgba(123, 104, 238, 0.12)');
      backGlow.addColorStop(0.85, 'rgba(244, 63, 94, 0.04)');
      backGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = backGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // ─── 2. GLOBE BASE SPHERE (Subtle Glass core) ───
      const coreGrad = ctx.createRadialGradient(
        centerX - globeRadius * 0.35,
        centerY - globeRadius * 0.35,
        10,
        centerX,
        centerY,
        globeRadius
      );
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.55, 'rgba(255, 245, 248, 0.75)');
      coreGrad.addColorStop(0.92, 'rgba(241, 235, 253, 0.45)');
      coreGrad.addColorStop(1, 'rgba(244, 63, 94, 0.15)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Corona Rim
      ctx.strokeStyle = 'rgba(255, 107, 157, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ─── 3. ROTATING RADAR EQUATORIAL SCANNER RING ───
      ctx.save();
      ctx.translate(centerX, centerY);
      // Ring angled with axial tilt
      ctx.scale(1, 0.38);
      ctx.rotate(-0.25);

      const scannerGrad = ctx.createConicGradient(sweepAngle, 0, 0);
      scannerGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
      scannerGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0)');
      scannerGrad.addColorStop(0.88, 'rgba(123, 104, 238, 0.25)');
      scannerGrad.addColorStop(1, 'rgba(244, 63, 94, 0.85)');

      ctx.strokeStyle = scannerGrad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, globeRadius * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      // Outer faint orbital ring
      ctx.strokeStyle = 'rgba(123, 104, 238, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, globeRadius * 1.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ─── 4. RENDER BACK DOTS (z < 0) ───
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const r = rotatePoint(pt.x, pt.y, pt.z);
        if (r.z >= 0) continue; // front points handled later

        // Back dots: soft, small, fading into distance
        const depthNorm = (r.z + globeRadius) / globeRadius; // 0 (far back) to 1 (equator)
        const alpha = Math.max(0.06, depthNorm * 0.22);
        const dotSize = Math.max(0.6, pt.baseRadius * 0.65);

        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.beginPath();
        ctx.arc(centerX + r.x, centerY + r.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─── 5. ROTATED CITY NODES ───
      const rotatedCities = cityNodes.map((c) => {
        const r = rotatePoint(c.x, c.y, c.z);
        return { ...c, rx: r.x, ry: r.y, rz: r.z };
      });

      // Find front-most city to highlight in ticker
      let maxZCity = rotatedCities[0];
      for (const rc of rotatedCities) {
        if (rc.rz > maxZCity.rz) {
          maxZCity = rc;
        }
      }
      if (maxZCity && maxZCity.rz > globeRadius * 0.4) {
        if (activeCityName !== maxZCity.name) {
          setActiveCityName(maxZCity.name);
          setActiveCityVibe(maxZCity.vibe);
        }
      }

      // ─── 6. RENDER 3D CONNECTING ARCS ───
      ARCS.forEach(([idx1, idx2]) => {
        const c1 = rotatedCities[idx1];
        const c2 = rotatedCities[idx2];
        if (!c1 || !c2) return;

        // Only draw if at least one endpoint is facing forward
        if (c1.rz < -globeRadius * 0.3 && c2.rz < -globeRadius * 0.3) return;

        // Quadratic elevated 3D midpoint
        const midX = (c1.x + c2.x) / 2;
        const midY = (c1.y + c2.y) / 2;
        const midZ = (c1.z + c2.z) / 2;
        const midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;
        // Elevate 30% above the globe radius
        const elevation = globeRadius * 1.32;
        const arcPeak = rotatePoint(
          (midX / midLen) * elevation,
          (midY / midLen) * elevation,
          (midZ / midLen) * elevation
        );

        const p1 = { x: centerX + c1.rx, y: centerY + c1.ry };
        const p2 = { x: centerX + c2.rx, y: centerY + c2.ry };
        const cp = { x: centerX + arcPeak.x, y: centerY + arcPeak.y };

        // Average depth for opacity
        const avgZ = (c1.rz + c2.rz + arcPeak.z) / 3;
        const arcAlpha = Math.max(0.12, Math.min(0.75, (avgZ + globeRadius * 0.5) / globeRadius));

        // Draw curved arc
        ctx.strokeStyle = `rgba(244, 63, 94, ${arcAlpha * 0.45})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
        ctx.stroke();

        // Draw animated energy pulse traveling along the arc
        const t = arcProgress;
        const pulseX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cp.x + t * t * p2.x;
        const pulseY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cp.y + t * t * p2.y;

        if (avgZ > -globeRadius * 0.1) {
          // Luminous packet glow
          ctx.shadowColor = '#F43F5E';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // ─── 7. RENDER FRONT DOTS (z >= 0) ───
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const r = rotatePoint(pt.x, pt.y, pt.z);
        if (r.z < 0) continue;

        const depthNorm = r.z / globeRadius; // 0 (edge) to 1 (facing viewer)
        const dotSize = pt.baseRadius * (0.8 + depthNorm * 0.6);

        // Gradient color: blend pink/violet/cyan based on position
        let dotColor: string;
        if (i % 7 === 0) {
          dotColor = `rgba(56, 189, 248, ${0.5 + depthNorm * 0.45})`; // cyan highlight
        } else if (i % 3 === 0) {
          dotColor = `rgba(123, 104, 238, ${0.4 + depthNorm * 0.5})`; // violet
        } else {
          dotColor = `rgba(244, 63, 94, ${0.45 + depthNorm * 0.55})`; // romantic rose
        }

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(centerX + r.x, centerY + r.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─── 8. RENDER CITY BEACONS & PULSES (Front Facing) ───
      const now = Date.now() * 0.003;

      rotatedCities.forEach((city, idx) => {
        if (city.rz < -globeRadius * 0.2) return; // behind horizon

        const cx = centerX + city.rx;
        const cy = centerY + city.ry;
        const depthNorm = Math.max(0.1, (city.rz + globeRadius * 0.2) / (globeRadius * 1.2));
        const pulse = ((now + idx * 1.4) % 2) / 2; // 0 to 1

        // Pulsing radar ping ring from city
        ctx.strokeStyle = city.color;
        ctx.lineWidth = 1.3 * (1 - pulse);
        ctx.globalAlpha = (1 - pulse) * depthNorm * 0.85;
        ctx.beginPath();
        ctx.arc(cx, cy, 3 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Solid beacon core
        ctx.shadowColor = city.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.2 * depthNorm, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = city.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.0 * depthNorm, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // ─── 9. SPECULAR HIGHLIGHT SHEEN ───
      const sheenGrad = ctx.createLinearGradient(
        centerX - globeRadius * 0.6,
        centerY - globeRadius * 0.6,
        centerX + globeRadius * 0.2,
        centerY + globeRadius * 0.2
      );
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = sheenGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 0.96, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [latLonToXYZ, activeCityName]);

  // Touch & Pointer Gesture Handlers for Interactive Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    velYRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;
    const deltaX = e.clientX - lastPointerRef.current.x;
    const deltaY = e.clientY - lastPointerRef.current.y;

    rotYRef.current += deltaX * 0.009;
    rotXRef.current = Math.max(-0.65, Math.min(0.75, rotXRef.current + deltaY * 0.007));

    velYRef.current = deltaX * 0.003; // pass momentum
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      lastPointerRef.current = null;
      hapticLight();
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[320px] my-1">
      {/* 3D Interactive Holographic Globe Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-[260px] h-[260px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        role="img"
        aria-label="Interactive 3D Matchmaking Globe scanning for singles"
      >
        <canvas
          ref={canvasRef}
          className="w-[260px] h-[260px] transition-transform duration-150 ease-out"
        />

        {/* Floating Top Pill: Live City Beacon Detection */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#FF6B9D]/30 shadow-[0_4px_16px_rgba(244,63,94,0.12)] pointer-events-none transition-all duration-300 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F43F5E]" />
          </span>
          <span className="text-[11px] font-bold text-[#1E293B]">
            {activeCityName}
          </span>
          <span className="text-[10px] text-[#1E293B]/50 font-medium">
            • {activeCityVibe}
          </span>
        </div>

        {/* Orbiting Sparkle / Touch Indicator */}
        <div className="absolute bottom-1 right-3 text-[10px] font-medium text-[#1E293B]/40 bg-white/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-gray-200/50 pointer-events-none">
          Swipe to spin 🌐
        </div>
      </div>

      {/* Dynamic Telemetry Status Ticker */}
      <div className="flex items-center gap-2 mt-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFF0F5] via-white to-[#F3E8FF] border border-[#FF6B9D]/25 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F43F5E] animate-pulse" />
        <span className="text-[12px] font-semibold text-[#1E293B]/75 animate-fade-in tracking-tight">
          {SCAN_MESSAGES[scanMessageIndex]}
        </span>
      </div>
    </div>
  );
}

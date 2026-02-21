import { useEffect, useRef, useState } from 'react';
import { CLIENT_ORGS } from '../data/mockData';

/* ── helpers ──────────────────────────────────────── */
function latLngToXYZ(lat: number, lng: number, R: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: -R * Math.sin(phi) * Math.cos(theta),
    y: R * Math.cos(phi),
    z: R * Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(p: { x: number; y: number; z: number }, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
}

function project(p: { x: number; y: number; z: number }, cx: number, cy: number, fov: number) {
  const scale = fov / (fov + p.z);
  return { sx: cx + p.x * scale, sy: cy + p.y * scale, scale, z: p.z };
}

/* ── fibonacci sphere grid ────────────────────────── */
function fibSphere(count: number, R: number) {
  const pts: { x: number; y: number; z: number }[] = [];
  const golden = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / golden;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    pts.push({
      x: R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.cos(phi),
      z: R * Math.sin(phi) * Math.sin(theta),
    });
  }
  return pts;
}

/* ── component ────────────────────────────────────── */
export default function Globe3D({ size: sizeProp, className }: { size?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoSize, setAutoSize] = useState(sizeProp ?? 340);

  useEffect(() => {
    if (sizeProp != null || !wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setAutoSize(Math.min(width, height) || 340);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [sizeProp]);

  const size = sizeProp ?? autoSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const R = size * 0.36;
    const cx = size / 2;
    const cy = size / 2;
    const fov = 400;
    const gridDots = fibSphere(420, R);
    let rotation = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      /* ambient glow */
      const amb = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.3);
      amb.addColorStop(0, 'rgba(139,92,246,0.06)');
      amb.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, size, size);

      /* globe outline */
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* fibonacci grid */
      const sortedDots = gridDots
        .map((p) => {
          const r = rotateY(p, rotation);
          const pr = project(r, cx, cy, fov);
          return { ...pr, rz: r.z };
        })
        .sort((a, b) => a.z - b.z);

      for (const d of sortedDots) {
        if (d.rz < -R * 0.1) continue;
        const alpha = Math.max(0.08, ((d.rz / R + 1) / 2) * 0.4);
        ctx.beginPath();
        ctx.arc(d.sx, d.sy, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${alpha})`;
        ctx.fill();
      }

      /* client positions */
      const clients = CLIENT_ORGS.map((c) => {
        const raw = latLngToXYZ(c.lat, c.lng, R);
        const rot = rotateY(raw, rotation);
        const pr = project(rot, cx, cy, fov);
        return { ...pr, rz: rot.z, color: c.color, name: c.name };
      }).sort((a, b) => a.z - b.z);

      for (const c of clients) {
        if (c.rz < -R * 0.3) continue;
        const alpha = Math.max(0.3, (c.rz / R + 1) / 2);

        /* pulse ring */
        const pulseR = 7 + Math.sin(Date.now() * 0.003) * 3;
        ctx.beginPath();
        ctx.arc(c.sx, c.sy, pulseR * c.scale, 0, Math.PI * 2);
        ctx.strokeStyle = c.color + Math.round(alpha * 100).toString(16).padStart(2, '0');
        ctx.lineWidth = 1;
        ctx.stroke();

        /* dot */
        ctx.beginPath();
        ctx.arc(c.sx, c.sy, 3.5 * c.scale, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;

        /* glow */
        const glow = ctx.createRadialGradient(c.sx, c.sy, 0, c.sx, c.sy, 14 * c.scale);
        glow.addColorStop(0, c.color + '40');
        glow.addColorStop(1, c.color + '00');
        ctx.beginPath();
        ctx.arc(c.sx, c.sy, 14 * c.scale, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      /* connection arcs between visible clients */
      const visible = clients.filter((c) => c.rz > -R * 0.2);
      for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const a = visible[i];
          const b = visible[j];
          const midX = (a.sx + b.sx) / 2;
          const midY = (a.sy + b.sy) / 2;
          const dx = b.sx - a.sx;
          const dy = b.sy - a.sy;
          const cpx = midX - dy * 0.2;
          const cpy = midY + dx * 0.2;

          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.quadraticCurveTo(cpx, cpy, b.sx, b.sy);
          ctx.strokeStyle = 'rgba(139,92,246,0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();

          /* data packet */
          const t = (Math.sin(Date.now() * 0.002 + i * 2 + j * 3) + 1) / 2;
          const px = (1 - t) ** 2 * a.sx + 2 * (1 - t) * t * cpx + t ** 2 * b.sx;
          const py = (1 - t) ** 2 * a.sy + 2 * (1 - t) * t * cpy + t ** 2 * b.sy;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }

      rotation += 0.003;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <div ref={wrapperRef} className={className}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

import {
  ArrowRight,
  Camera,
  Cpu,
  Globe,
  Hand,
  HelpCircle,
  Layers,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface LandingScreenProps {
  onEnterSpatialMode: () => void;
  onExploreControls: () => void;
}

export function LandingScreen({ onEnterSpatialMode, onExploreControls }: LandingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lightweight procedural graphics background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Procedural nodes / particles
    const particleCount = Math.min(80, Math.floor((width * height) / 14000));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Fine grid background
      const gridSize = 48;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw subtle interactive perspective horizon lines
      const horizonY = height * 0.65;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.beginPath();
      for (let i = -10; i <= 10; i++) {
        ctx.moveTo(width / 2 + i * 40, horizonY);
        ctx.lineTo(width / 2 + i * 180, height);
      }
      ctx.stroke();

      // Update and draw particles with proximity links
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        const pulseFactor = Math.sin(time * 0.002 + p.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 240, 255, ${0.45 * pulseFactor})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / 110)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // React subtly to cursor
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 140) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 * (1 - mdist / 140)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Procedural Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Cyan Ambient Vignette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Minimal Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/25 to-sky-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs glow-cyan-sm">
            R(.)
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base tracking-wider text-white">
              Reality<span className="text-cyan-400">.exe</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Spatial OS
            </span>
          </div>
        </div>

        {/* Live Engine Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle border border-cyan-500/20 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-slate-300 font-medium">LIVE SPATIAL ENGINE</span>
          <span className="text-slate-500 text-[10px]">v1.0.0</span>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        {/* Technical Sub-Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6 glow-cyan-sm">
          <Sparkles size={12} className="text-cyan-400" />
          <span>Spatial Computing & Hand Gesture Synthesis</span>
        </div>

        {/* Bold Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Reality is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white text-glow-cyan">interface.</span>
        </h1>

        {/* Short Description */}
        <p className="text-base sm:text-lg text-slate-300 font-sans max-w-2xl leading-relaxed mb-10 font-light">
          Transform your physical surroundings into an interactive 3D operating system. Track 21 hand landmarks in real-time, manipulate virtual geometry, and command digital space with pure intuition.
        </p>

        {/* Prominent Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onEnterSpatialMode}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-200 glow-cyan cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            <span>ENTER SPATIAL MODE</span>
            <ArrowRight size={17} />
          </button>

          <button
            onClick={onExploreControls}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel hover:bg-white/10 active:scale-95 text-slate-200 font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all duration-200 border border-white/10 cursor-pointer"
          >
            <HelpCircle size={15} className="text-cyan-400" />
            <span>EXPLORE CONTROLS</span>
          </button>
        </div>

        {/* Feature Matrix Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2">
            <Hand size={18} className="text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              21-Point Tracking
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Sub-millimeter landmark tracking with exponential moving smoothing.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2">
            <Cpu size={18} className="text-sky-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Geometric Engine
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Seven distinct spatial gestures with stateful hysteresis and debouncing.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2">
            <Layers size={18} className="text-indigo-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Interactive 3D
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Procedural WebGL holograms, holographic lasers, and responsive physics.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2">
            <Shield size={18} className="text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Zero Cloud Latency
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Runs 100% locally in browser memory. Camera feed never leaves device.
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Compatibility Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 border-t border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <Camera size={13} className="text-cyan-400" />
          <span>Requires webcam access and a modern desktop browser (Chrome / Edge recommended).</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Globe size={13} />
            <span>WebGL 2.0 & WebAssembly</span>
          </span>
          <span>•</span>
          <span>Privacy Assured</span>
        </div>
      </footer>
    </div>
  );
}

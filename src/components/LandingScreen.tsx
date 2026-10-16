import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Code2,
  FileCode2,
  Globe,
  Hand,
  HelpCircle,
  Layers,
  Lock,
  Maximize2,
  MousePointer,
  RotateCw,
  Scan,
  Shield,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';
import React, { useState } from 'react';
import { LandingThreeBackground } from './LandingThreeBackground';

interface LandingScreenProps {
  onEnterSpatialMode: () => void;
  onExploreControls: () => void;
}

export function LandingScreen({ onEnterSpatialMode, onExploreControls }: LandingScreenProps) {
  const [activeDemoTab, setActiveDemoTab] = useState<number>(0);

  const demoInteractions = [
    {
      title: 'Pinch & Grab Manipulation',
      gesture: 'Index & Thumb Pinch',
      icon: Hand,
      tag: 'DIRECT MANIPULATION',
      description:
        'Touch-free 6-DOF translation. Grasp virtual polyhedra, rings, and crystalline nodes directly in physical space with zero pointer jumping or clipping.',
      specs: ['Distance Threshold: 0.052', 'Sub-millimeter Tracking', 'Adaptive Depth Clamping'],
      diagram: 'PINCH [THUMB + INDEX] ──> GRAB_OFFSET_LOCK ──> SPATIAL_TRANSLATE',
    },
    {
      title: 'Precision Raycasting Pointer',
      gesture: 'Extended Index Point',
      icon: MousePointer,
      tag: 'SPATIAL TARGETING',
      description:
        'Cast high-accuracy spatial rays from your fingertip to highlight, select, and activate floating holographic HUD elements or distant objects.',
      specs: ['Origin: INDEX_FINGER_TIP', 'Direction Vector: DIP -> TIP', 'Real-time Surface Hover'],
      diagram: 'INDEX_EXTENDED ──> RAYCAST_INTERSECT ──> HOVER_GLOW_FEEDBACK',
    },
    {
      title: 'Dual-Hand Scale & Rotate',
      gesture: 'Bimanual Pinch / Distance',
      icon: Maximize2,
      tag: 'BIMANUAL KINEMATICS',
      description:
        'Synthesize dual hand landmarks. Expand or contract your hands to scale objects smoothly from 0.3x to 3.5x with rotational angle tracking.',
      specs: ['Span Differential: d(L, R)', 'Continuous Angle Lock', 'Euler Discontinuity Guard'],
      diagram: 'HAND_L_PINCH + HAND_R_PINCH ──> DELTA_DISTANCE ──> UNIFORM_SCALE',
    },
    {
      title: 'Air Drawing & Spatial Ribbons',
      gesture: 'Drawing Pose with Index',
      icon: Wand2,
      tag: 'VOLUMETRIC CREATION',
      description:
        'Draw glowing neon trails directly in the air. Strokes are captured in 3D coordinates, smoothed with Catmull-Rom spline curves, and rendered with custom shaders.',
      specs: ['Trail Retention: 1,500 Pts', 'Additive Blending', 'Instant Clear Shortcut (Q)'],
      diagram: 'DRAW_ACTIVE ──> PUSH_3D_POINT ──> SPLINE_SMOOTH ──> MESH_RIBBON',
    },
    {
      title: 'Air Circle Menu Trigger',
      gesture: 'Clockwise Circular Sweep',
      icon: RotateCw,
      tag: 'GESTURE SYNTHESIS',
      description:
        'Trace an intuitive circle in the air to summon the contextual radial interface right at your fingertip without touching a physical keyboard.',
      specs: ['Sweep Arc: >= 300°', 'Hysteresis Debounce: 600ms', 'Angular Delta Accumulator'],
      diagram: 'ACCUMULATE_ANGLE ──> SWEEP >= 5.2rad ──> SUMMON_RADIAL_HUD',
    },
    {
      title: 'Reality Vision AI Understanding',
      gesture: 'Point at Physical Object',
      icon: Scan,
      tag: 'MULTIMODAL INTELLIGENCE',
      description:
        'Point your finger at any real-world object in your room. Reality.exe inspects the physical frame using multimodal vision and anchors holographic insights into 3D space.',
      specs: ['User-Triggered Inspection', 'Zero Continuous Stream', 'Contextual Spatial Placement'],
      diagram: 'TARGET_AIM ──> OPT-IN_FRAME_CAPTURE ──> MULTIMODAL_LLM ──> SPATIAL_HUD',
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#07070a] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Live Procedural Three.js 3D Background */}
      <LandingThreeBackground />

      {/* Atmospheric Cyan Vignette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Distinctive Reality.exe Wordmark */}
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/25 to-sky-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs glow-cyan-sm transition-transform duration-300 group-hover:scale-105">
            R(.)
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base tracking-wider text-white">
              Reality<span className="text-cyan-400">.exe</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Spatial OS v1.0
            </span>
          </div>
        </div>

        {/* Right Header Navigation & Status */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/MdKasif0/Reality-.-exe.git"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel-subtle hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 transition-colors"
          >
            <Code2 size={14} className="text-cyan-400" />
            <span>GitHub Repository</span>
          </a>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle border border-cyan-500/20 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-slate-300 font-medium">LIVE SPATIAL ENGINE</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
        {/* Technical Sub-Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-6 glow-cyan-sm animate-pulse">
          <Sparkles size={12} className="text-cyan-400" />
          <span>Spatial Computing & Hand Gesture Synthesis</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
          Reality is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white text-glow-cyan">interface.</span>
        </h1>

        {/* Product Description */}
        <p className="text-base sm:text-lg text-slate-300 font-sans max-w-2xl leading-relaxed mb-10 font-light">
          Reality.exe bridges your physical environment and 3D digital space. Track 21 hand landmarks directly on-device in WebAssembly, manipulate holographic geometry with natural gestures, query the physical world with multimodal AI, and persist spatial workspaces.
        </p>

        {/* Action Buttons */}
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
            <span>INTERACTION GUIDE</span>
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2 border border-white/5 hover:border-cyan-500/30 transition-colors">
            <Hand size={18} className="text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              21-Point Tracking
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Sub-millimeter landmark tracking with exponential moving smoothing.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2 border border-white/5 hover:border-sky-500/30 transition-colors">
            <Cpu size={18} className="text-sky-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Geometric Engine
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Hysteresis state machines, cooldown buffers, and gesture debouncing.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2 border border-white/5 hover:border-indigo-500/30 transition-colors">
            <Layers size={18} className="text-indigo-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Spatial Workspace
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Persistent desktop with Undo/Redo, JSON scene snapshot export, and restoration.
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col gap-2 border border-white/5 hover:border-emerald-500/30 transition-colors">
            <Shield size={18} className="text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
              Privacy First
            </span>
            <span className="text-[11px] text-slate-400 leading-snug">
              Runs 100% locally in browser memory. Camera feed never leaves device.
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="flex flex-col items-center text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            GESTURAL INTERACTION SYSTEM
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Natural Spatial Mechanics
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mt-2 font-light">
            Engineered with spatial kinematics and hysteresis filtering to eliminate false positives and accidental activations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {demoInteractions.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeDemoTab === index;
            return (
              <button
                key={item.title}
                onClick={() => setActiveDemoTab(index)}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                <span>{item.title.split(' ')[0]} {item.title.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Active Demonstration Card */}
        {(() => {
          const current = demoInteractions[activeDemoTab];
          const Icon = current.icon;
          return (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-[10px] font-mono tracking-widest uppercase">
                    {current.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Pose: <strong className="text-slate-200">{current.gesture}</strong>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-3">
                  <Icon className="text-cyan-400" size={24} />
                  <span>{current.title}</span>
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  {current.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {current.specs.map((spec) => (
                    <div
                      key={spec}
                      className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono text-slate-300 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Machine Flow Diagram */}
              <div className="md:col-span-5 flex flex-col justify-center p-5 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Cpu size={12} className="text-cyan-400" />
                  <span>Execution Pipeline</span>
                </span>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed break-words shadow-inner">
                  {current.diagram}
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Confidence: <strong>&gt; 92%</strong></span>
                  <span>Debounce: <strong>250ms</strong></span>
                  <span>Latency: <strong>&lt; 14ms</strong></span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Feature Architecture Overview */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-sky-400 mb-2">
            PRODUCTION SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Engineered for Spatial Reliability
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers size={20} />
            </div>
            <h3 className="text-base font-display font-bold text-white">
              Spatial Workspace & Persistence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Create, rename, scale, and manipulate unlimited 3D primitives. Includes full Undo/Redo historical stacks, boundary clipping protection, and validated JSON scene serialization for saving and restoring layouts.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-display font-bold text-white">
              Natural Spatial Command Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Speak or type commands naturally: "spawn a glowing sphere", "make selected object larger", "duplicate", or "reset scene". Interpreted into validated schemas without executing arbitrary unvetted code.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Video size={20} />
            </div>
            <h3 className="text-base font-display font-bold text-white">
              Deterministic Canvas Recording
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Record 1080p spatial sessions directly through browser MediaStream recorder. Exports standalone WebM captures with elapsed timers and zero background cloud streaming.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack & Camera Privacy Explanation */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tech Stack */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              CORE TECHNOLOGIES
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
              Modern WebAssembly & WebGL
            </h3>
            <div className="flex flex-col gap-3 mt-2 text-xs font-mono text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Computer Vision</span>
                <span className="text-cyan-400 font-semibold">MediaPipe Tasks Vision WASM (v1.1)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">3D Graphics Engine</span>
                <span className="text-sky-400 font-semibold">Three.js r182 (WebGL 2.0)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Frontend Architecture</span>
                <span className="text-indigo-400 font-semibold">React 19 & Tailwind CSS v4</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400">Environmental AI</span>
                <span className="text-emerald-400 font-semibold">Multimodal Vision Proxy (Gemini / OpenAI)</span>
              </div>
            </div>
          </div>

          {/* Privacy & Permissions Disclosure */}
          <div className="lg:col-span-6 p-6 rounded-3xl glass-panel border border-emerald-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock size={18} />
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider">
                Strict Local Camera Privacy
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Reality.exe processes optical frames strictly within your browser's local WebAssembly memory heap.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 font-light">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Camera hardware LEDs turn off immediately upon exiting spatial mode or clicking camera toggle.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Zero video frames or biometric measurements are streamed to background cloud servers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>AI Vision Scans occur solely when you explicitly tap Scan or trigger the inspection gesture.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Browser Compatibility Note */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-12">
        <div className="p-4 rounded-2xl glass-panel-subtle border border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe size={16} className="text-cyan-400 shrink-0" />
            <span>
              <strong>Browser Compatibility:</strong> Chrome 90+, Microsoft Edge 90+, Brave, Safari 16+, Firefox 110+.
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Requires 720p/1080p webcam & standard room lighting</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 border-t border-white/5 gap-3">
        <div className="flex items-center gap-2">
          <Camera size={14} className="text-cyan-400" />
          <span>Reality.exe — Production Interactive Spatial Computing Operating System</span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://github.com/MdKasif0/Reality-.-exe.git"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FileCode2 size={13} />
            <span>Source Code</span>
          </a>
          <span>•</span>
          <button
            onClick={onExploreControls}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Keyboard & Gestures
          </button>
          <span>•</span>
          <span className="text-slate-600">MIT License</span>
        </div>
      </footer>
    </div>
  );
}

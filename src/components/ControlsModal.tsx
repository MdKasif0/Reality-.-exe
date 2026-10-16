import { Hand, Keyboard, Sparkles, X } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ControlsModal({ isOpen, onClose }: ControlsModalProps) {
  if (!isOpen) return null;

  const gestures = [
    {
      name: 'Pinch (Thumb + Index)',
      action: 'Grab & Move',
      desc: 'Bring thumb and index fingertips together near any 3D object to attach it. Move your hand to translate it, then separate fingers to drop.',
      badge: 'Primary Interaction',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
    },
    {
      name: 'Point (Index Finger)',
      action: 'Virtual Pointer',
      desc: 'Extend your index finger while keeping other fingers tucked. The 3D reticle aligns with your fingertip to target objects.',
      badge: 'Targeting',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
    },
    {
      name: 'Open Palm',
      action: 'Summon Spatial Hub',
      desc: 'Spread all fingers wide facing the camera. Summons the holographic floating radial menu for quick color and scale commands.',
      badge: 'Context Menu',
      color: 'border-sky-500/40 text-sky-400 bg-sky-950/20',
    },
    {
      name: 'V Sign (Peace)',
      action: 'Switch Mode',
      desc: 'Extend index and middle fingers in a V. Toggles between Object Manipulation mode and Environment Navigation mode.',
      badge: 'Mode Switch',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20',
    },
    {
      name: 'Thumbs Up',
      action: 'Confirm / Cycle Color',
      desc: 'Raise thumb upward with fingers curled. Instantly cycles through the holographic neon color palette of the selected object.',
      badge: 'Palette Cycle',
      color: 'border-teal-500/40 text-teal-400 bg-teal-950/20',
    },
    {
      name: 'Two-Hand Expansion',
      action: 'Dual Scaling',
      desc: 'Bring both hands into view and move them closer or further apart to smoothly scale the active 3D object.',
      badge: 'Proportional Scale',
      color: 'border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-950/20',
    },
    {
      name: 'Closed Fist',
      action: 'Standby / Fold',
      desc: 'Curl all fingers tightly into a fist to close floating menus and enter passive observation state.',
      badge: 'Passive',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
    },
  ];

  const shortcuts = [
    { key: 'Space', desc: 'Pinch / Grab focused object' },
    { key: 'Arrows / WASD', desc: 'Translate selected object in 3D' },
    { key: '+ / -', desc: 'Scale selected object larger or smaller' },
    { key: 'C', desc: 'Cycle holographic color' },
    { key: 'M', desc: 'Toggle Manipulate / Navigate mode' },
    { key: 'Tab', desc: 'Cycle selection through virtual objects' },
    { key: 'P', desc: 'Pause / Resume vision hand tracking' },
    { key: 'Delete / Backspace', desc: 'Delete active virtual object' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                Gesture & Interaction Directory
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Natural computer vision gestures and keyboard fallbacks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Guide"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gestures Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Hand size={14} />
            <span>3D Hand Gestures</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gestures.map((g, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1.5 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100 font-sans">
                    {g.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md border ${g.color}`}
                  >
                    {g.badge}
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-300 font-medium">
                  → {g.action}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Alternatives (Accessibility) */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
            <Keyboard size={14} className="text-cyan-400" />
            <span>Keyboard Fallbacks (Full Accessibility)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {shortcuts.map((s, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1"
              >
                <code className="text-[11px] font-mono text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded w-fit">
                  {s.key}
                </code>
                <span className="text-[11px] text-slate-400 leading-snug">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-all glow-cyan-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

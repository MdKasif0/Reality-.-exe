import {
  Camera,
  Eye,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { BackgroundMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, backgroundMode } = useSpatialStore();

  if (!isOpen) return null;

  const bgModes: { id: BackgroundMode; label: string; desc: string }[] = [
    {
      id: 'camera',
      label: 'Live Augmented Reality',
      desc: 'Real physical surroundings with overlaid 3D spatial holograms.',
    },
    {
      id: 'dark',
      label: 'Dark Spatial Void',
      desc: 'Deep graphite spatial computing environment with ambient starfields.',
    },
    {
      id: 'minimal',
      label: 'Minimalist Debug',
      desc: 'High-contrast focused wireframe view for precision tracking inspection.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                System Preferences
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Reality.exe spatial computing & computer vision settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Environment / Background Mode */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Eye size={14} />
            <span>Environment View Mode</span>
          </span>
          <div className="grid grid-cols-1 gap-2">
            {bgModes.map((m) => {
              const active = backgroundMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => spatialStore.setBackgroundMode(m.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5 ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-white glow-cyan-sm'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm font-semibold font-sans flex items-center justify-between">
                    <span>{m.label}</span>
                    {active && <span className="text-[10px] font-mono text-cyan-300">ACTIVE</span>}
                  </span>
                  <span className="text-xs text-slate-400">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Computer Vision & Tracking Tuning */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Zap size={14} />
            <span>Vision Engine Sensitivity</span>
          </span>

          {/* Landmark Smoothing Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Landmark Jitter Smoothing</span>
              <span className="text-cyan-400">{settings.smoothingFactor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={settings.smoothingFactor}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                spatialStore.updateSettings({ smoothingFactor: val });
                mediaPipeService.setSmoothingFactor(val);
              }}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>More Responsive</span>
              <span>Smoother (Less Jitter)</span>
            </div>
          </div>

          {/* Pinch Sensitivity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Pinch Grab Sensitivity</span>
              <span className="text-cyan-400">{settings.pinchThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.45"
              step="0.02"
              value={settings.pinchThreshold}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                spatialStore.updateSettings({ pinchThreshold: val });
              }}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Strict Pinch</span>
              <span>Easier Pinch</span>
            </div>
          </div>
        </div>

        {/* 3. Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs font-mono">
          {/* Mirror Camera */}
          <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
            <span className="flex items-center gap-2 text-slate-300">
              <Camera size={14} className="text-cyan-400" />
              <span>Mirror Camera Stream</span>
            </span>
            <input
              type="checkbox"
              checked={settings.mirrorCamera}
              onChange={(e) => spatialStore.updateSettings({ mirrorCamera: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </label>

          {/* Show 21 Landmark Debug Points */}
          <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
            <span className="flex items-center gap-2 text-slate-300">
              <Sparkles size={14} className="text-cyan-400" />
              <span>21 Landmark Debug HUD</span>
            </span>
            <input
              type="checkbox"
              checked={settings.showDebugLandmarks}
              onChange={(e) => spatialStore.updateSettings({ showDebugLandmarks: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </label>

          {/* Sound Audio Cues */}
          <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
            <span className="flex items-center gap-2 text-slate-300">
              {settings.soundEffects ? (
                <Volume2 size={14} className="text-cyan-400" />
              ) : (
                <VolumeX size={14} className="text-slate-500" />
              )}
              <span>Haptic / Visual Audio</span>
            </span>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => spatialStore.updateSettings({ soundEffects: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-all glow-cyan-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

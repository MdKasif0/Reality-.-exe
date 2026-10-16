import {
  Box,
  Circle,
  Compass,
  Disc,
  HelpCircle,
  Layers,
  LogOut,
  Maximize2,
  Plus,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { GeometryType, SpatialMode } from '../types';

interface NavigationRailProps {
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export function NavigationRail({ onOpenGuide, onOpenSettings, onExit }: NavigationRailProps) {
  const { spatialMode } = useSpatialStore();
  const [showObjectMenu, setShowObjectMenu] = useState(false);

  const modes: { id: SpatialMode; label: string; icon: any }[] = [
    { id: 'MANIPULATE', label: 'Manipulate', icon: Maximize2 },
    { id: 'NAVIGATE', label: 'Navigate', icon: Compass },
  ];

  const geometries: { type: GeometryType; label: string; icon: any }[] = [
    { type: 'cube', label: 'Cube Matrix', icon: Box },
    { type: 'sphere', label: 'Sphere', icon: Circle },
    { type: 'ring', label: 'Torus Ring', icon: Disc },
    { type: 'octahedron', label: 'Hyper Prism', icon: Layers },
  ];

  return (
    <aside className="absolute left-4 top-4 bottom-4 w-16 z-30 flex flex-col items-center justify-between py-4 glass-panel rounded-2xl select-none transition-all">
      {/* Top Branding Emblem */}
      <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => spatialStore.resetScene()} title="Reality.exe - Click to reset scene">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-600/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs glow-cyan-sm transition-transform group-hover:scale-105">
          R(.)
        </div>
        <span className="text-[9px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
          0.1
        </span>
      </div>

      {/* Middle Controls */}
      <div className="flex flex-col items-center gap-3">
        {/* Spatial Modes */}
        <div className="p-1 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const active = spatialMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => spatialStore.setSpatialMode(mode.id)}
                title={`${mode.label} Mode (or show V-sign gesture)`}
                className={`p-2.5 rounded-lg transition-all flex items-center justify-center ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        {/* Add Object Menu */}
        <div className="relative">
          <button
            onClick={() => setShowObjectMenu(!showObjectMenu)}
            title="Spawn Virtual Object"
            className={`p-2.5 rounded-xl border transition-all ${
              showObjectMenu
                ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/50 glow-cyan-sm'
                : 'bg-black/40 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Plus size={18} />
          </button>

          {showObjectMenu && (
            <div className="absolute left-16 top-0 w-44 glass-panel rounded-xl p-2 flex flex-col gap-1 shadow-2xl border border-cyan-500/20 animate-in fade-in slide-in-from-left-2 duration-150">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2 py-1">
                Spawn Geometry
              </span>
              {geometries.map((g) => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.type}
                    onClick={() => {
                      spatialStore.spawnObject(g.type);
                      setShowObjectMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-cyan-500/20 transition-all text-left"
                  >
                    <Icon size={14} className="text-cyan-400" />
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reset Layout */}
        <button
          onClick={() => spatialStore.resetScene()}
          title="Reset 3D Scene"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all"
        >
          <RotateCcw size={18} />
        </button>

        {/* Gesture Guide */}
        <button
          onClick={onOpenGuide}
          title="Gesture Guide & Tutorials"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={onExit}
          title="Exit Spatial Mode"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

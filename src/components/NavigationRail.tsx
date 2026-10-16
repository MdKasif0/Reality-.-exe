import {
  Bookmark,
  Brush,
  Compass,
  Crosshair,
  HelpCircle,
  LogOut,
  Maximize2,
  MessageSquare,
  Plus,
  RotateCcw,
  Settings,
  Undo2,
} from 'lucide-react';
import React from 'react';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { SpatialMode } from '../types';

interface NavigationRailProps {
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onOpenSpawnModal: () => void;
  onToggleAskReality: () => void;
  onToggleSceneMemory: () => void;
  onExit: () => void;
}

export function NavigationRail({
  onOpenGuide,
  onOpenSettings,
  onOpenSpawnModal,
  onToggleAskReality,
  onToggleSceneMemory,
  onExit,
}: NavigationRailProps) {
  const { spatialMode, undoStack } = useSpatialStore();

  const modes: { id: SpatialMode; label: string; icon: any; shortcut: string }[] = [
    { id: 'MANIPULATE', label: 'Manipulate (Pinch to Grab)', icon: Maximize2, shortcut: 'V' },
    { id: 'NAVIGATE', label: 'Navigate Camera', icon: Compass, shortcut: 'V' },
    { id: 'SCAN_REALITY', label: 'Reality Scan (AI Object Analysis)', icon: Crosshair, shortcut: 'R' },
    { id: 'AIR_DRAW', label: 'Air Draw 3D Strokes', icon: Brush, shortcut: 'D' },
  ];

  return (
    <aside className="absolute left-4 top-4 bottom-4 w-16 z-30 flex flex-col items-center justify-between py-4 glass-panel rounded-2xl select-none transition-all">
      {/* Top Branding Emblem */}
      <div
        className="flex flex-col items-center gap-1 group cursor-pointer"
        onClick={() => spatialStore.resetScene()}
        title="Reality.exe - Reset scene"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-600/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs glow-cyan-sm transition-transform group-hover:scale-105">
          R(.)
        </div>
        <span className="text-[9px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
          0.2
        </span>
      </div>

      {/* Middle Controls (Modes + Key Tools) */}
      <div className="flex flex-col items-center gap-2.5 overflow-y-auto no-scrollbar py-1">
        {/* Spatial Modes Cluster */}
        <div className="p-1 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const active = spatialMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => spatialStore.setSpatialMode(mode.id)}
                title={`${mode.label} [${mode.shortcut}]`}
                className={`p-2.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan-sm scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>

        {/* Spawn Object Button */}
        <button
          onClick={onOpenSpawnModal}
          title="Spawn Virtual Object (Procedural & AI)"
          className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 hover:scale-105 transition-all glow-cyan-sm cursor-pointer"
        >
          <Plus size={18} />
        </button>

        {/* Ask Reality Q&A Drawer Toggle */}
        <button
          onClick={onToggleAskReality}
          title="Ask Reality (Environment Vision Q&A)"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <MessageSquare size={17} />
        </button>

        {/* Scene Memory Drawer Toggle */}
        <button
          onClick={onToggleSceneMemory}
          title="Session Spatial Memory (Analyzed Objects)"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <Bookmark size={17} />
        </button>

        {/* Undo Reversible Action */}
        <button
          onClick={() => spatialStore.undo()}
          disabled={undoStack.length === 0}
          title={`Undo Last Action (${undoStack.length} in stack) [Ctrl+Z]`}
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:text-slate-400 transition-all cursor-pointer"
        >
          <Undo2 size={16} />
        </button>

        {/* Scene Reset */}
        <button
          onClick={() => spatialStore.resetScene()}
          title="Reset 3D Scene"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>

        {/* Gesture Guide */}
        <button
          onClick={onOpenGuide}
          title="Gesture Guide & Tutorials [?]"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <HelpCircle size={17} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={onExit}
          title="Exit Spatial Mode"
          className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

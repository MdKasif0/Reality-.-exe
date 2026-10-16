import { Maximize, Minimize, Palette, Plus, X } from 'lucide-react';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';

export function ContextualRadialMenu() {
  const { radialMenuOpen, selectedObjectId, objects } = useSpatialStore();

  if (!radialMenuOpen) return null;

  const selectedObj = objects.find((o) => o.id === selectedObjectId);

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
      <div className="relative pointer-events-auto flex items-center justify-center">
        {/* Glowing backdrop rings */}
        <div className="absolute w-64 h-64 rounded-full border border-cyan-400/20 bg-black/60 backdrop-blur-xl animate-reticle" />
        <div className="absolute w-80 h-80 rounded-full border border-cyan-500/10 pointer-events-none" />

        {/* Center Hub */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            Spatial Hub
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
            {selectedObj ? selectedObj.name : 'Quick Actions'}
          </span>
          <button
            onClick={() => spatialStore.setRadialMenuOpen(false)}
            title="Close Spatial Menu"
            className="mt-2 p-1.5 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Radial Action Buttons */}
        {/* Top: Cycle Color */}
        <button
          onClick={() => {
            if (selectedObjectId) spatialStore.cycleObjectColor(selectedObjectId);
          }}
          disabled={!selectedObjectId}
          title="Cycle Color"
          className="absolute -top-16 p-3 rounded-2xl glass-panel-active text-cyan-400 hover:scale-110 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1 text-[9px] font-mono disabled:opacity-40"
        >
          <Palette size={18} />
          <span>Color</span>
        </button>

        {/* Right: Scale Up */}
        <button
          onClick={() => {
            if (selectedObjectId) spatialStore.updateObjectScale(selectedObjectId, 1.2);
          }}
          disabled={!selectedObjectId}
          title="Scale Up"
          className="absolute -right-20 p-3 rounded-2xl glass-panel text-sky-400 hover:scale-110 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1 text-[9px] font-mono disabled:opacity-40"
        >
          <Maximize size={18} />
          <span>Grow</span>
        </button>

        {/* Bottom: Spawn Object */}
        <button
          onClick={() => {
            spatialStore.spawnObject('cube');
          }}
          title="Spawn Cube"
          className="absolute -bottom-16 p-3 rounded-2xl glass-panel text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1 text-[9px] font-mono"
        >
          <Plus size={18} />
          <span>Spawn</span>
        </button>

        {/* Left: Scale Down */}
        <button
          onClick={() => {
            if (selectedObjectId) spatialStore.updateObjectScale(selectedObjectId, 0.85);
          }}
          disabled={!selectedObjectId}
          title="Scale Down"
          className="absolute -left-20 p-3 rounded-2xl glass-panel text-amber-400 hover:scale-110 active:scale-95 transition-all shadow-lg flex flex-col items-center gap-1 text-[9px] font-mono disabled:opacity-40"
        >
          <Minimize size={18} />
          <span>Shrink</span>
        </button>
      </div>
    </div>
  );
}

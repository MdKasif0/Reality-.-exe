import {
  Copy,
  Maximize2,
  MessageSquare,
  Move,
  Palette,
  Play,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';

interface SpatialContextMenuProps {
  onOpenAskReality: (prefillQuestion?: string) => void;
}

export function SpatialContextMenu({ onOpenAskReality }: SpatialContextMenuProps) {
  const { contextMenuTargetId, objects } = useSpatialStore();

  const selectedObj = useMemo(() => {
    return objects.find((o) => o.id === contextMenuTargetId);
  }, [objects, contextMenuTargetId]);

  if (!contextMenuTargetId || !selectedObj) return null;

  // Compute screen position based on pointer or center with screen clamping
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Convert 3D position approx to 2D screen percentage
  // 3D coordinates roughly map from [-5..5, -3..3] to [0..1, 0..1]
  const screenX = (selectedObj.position[0] / 8 + 0.5) * winW;
  const screenY = (-selectedObj.position[1] / 5 + 0.5) * winH;

  // Clamp within viewport
  const menuWidth = 240;
  const menuHeight = 310;
  const clampedX = Math.max(80, Math.min(winW - menuWidth - 280, screenX + 40));
  const clampedY = Math.max(80, Math.min(winH - menuHeight - 80, screenY - 100));

  const animations: ('float' | 'spin' | 'pulse' | 'orbit' | 'none')[] = [
    'float',
    'spin',
    'pulse',
    'orbit',
    'none',
  ];

  const handleCycleAnimation = () => {
    const cur = selectedObj.animation || 'float';
    const nextIdx = (animations.indexOf(cur) + 1) % animations.length;
    spatialStore.applyObjectAnimation(selectedObj.id, animations[nextIdx]);
  };

  return (
    <div
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-40 pointer-events-auto select-none w-56 glass-panel-active rounded-2xl p-2.5 flex flex-col gap-1 border border-cyan-400/40 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 pb-1.5 mb-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: selectedObj.color }}
          />
          <span className="text-[11px] font-mono font-bold text-slate-100 truncate">
            {selectedObj.name}
          </span>
        </div>
        <button
          onClick={() => spatialStore.setContextMenuTarget(null)}
          title="Dismiss Menu"
          className="text-slate-400 hover:text-white p-0.5 rounded"
        >
          <X size={13} />
        </button>
      </div>

      {/* Menu Actions */}
      <div className="flex flex-col gap-0.5 text-xs font-mono">
        {/* Grab / Move */}
        <button
          onClick={() => {
            spatialStore.grabObject(selectedObj.id);
            spatialStore.setContextMenuTarget(null);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <Move size={13} className="text-cyan-400" />
          <span>Move / Attach (Pinch)</span>
        </button>

        {/* Rotate +45° */}
        <button
          onClick={() => {
            spatialStore.rotateObjectBy(selectedObj.id, Math.PI / 4);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <RotateCw size={13} className="text-sky-400" />
          <span>Rotate 45°</span>
        </button>

        {/* Scale +20% */}
        <button
          onClick={() => {
            spatialStore.updateObjectScale(selectedObj.id, 1.2);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <Maximize2 size={13} className="text-indigo-400" />
          <span>Scale (+20%)</span>
        </button>

        {/* Duplicate */}
        <button
          onClick={() => {
            spatialStore.duplicateObject(selectedObj.id);
            spatialStore.setContextMenuTarget(null);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <Copy size={13} className="text-emerald-400" />
          <span>Duplicate Object</span>
        </button>

        {/* Change Color */}
        <button
          onClick={() => {
            spatialStore.cycleObjectColor(selectedObj.id);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <Palette size={13} className="text-amber-400" />
          <span>Cycle Material Color</span>
        </button>

        {/* Apply Animation */}
        <button
          onClick={handleCycleAnimation}
          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Play size={13} className="text-fuchsia-400" />
            <span>Animation</span>
          </div>
          <span className="text-[10px] text-cyan-300 uppercase">
            {selectedObj.animation || 'float'}
          </span>
        </button>

        {/* Ask AI about this object */}
        <button
          onClick={() => {
            onOpenAskReality(`What can you tell me about the ${selectedObj.name} (${selectedObj.type})?`);
            spatialStore.setContextMenuTarget(null);
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 text-left transition-colors border-t border-white/5 mt-0.5 pt-1.5"
        >
          <MessageSquare size={13} className="text-cyan-400" />
          <span>Ask AI About Object</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            spatialStore.deleteSelectedObject();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 text-left transition-colors"
        >
          <Trash2 size={13} />
          <span>Delete Object</span>
        </button>
      </div>
    </div>
  );
}

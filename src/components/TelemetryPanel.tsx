import {
  Activity,
  Cpu,
  Hand,
  Maximize,
  Palette,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { GestureType, VisionState } from '../types';

interface TelemetryPanelProps {
  visionState: VisionState;
}

const GESTURE_LABELS: Record<GestureType, { label: string; color: string; desc: string }> = {
  IDLE: { label: 'Standby / Neutral', color: 'text-slate-400', desc: 'No active command' },
  OPEN_PALM: { label: 'Open Palm', color: 'text-cyan-400', desc: 'Summon Spatial Menu' },
  PINCH: { label: 'Pinch Hold', color: 'text-sky-400', desc: 'Grab & Move Object' },
  POINT: { label: 'Pointer Ray', color: 'text-emerald-400', desc: 'Targeting & Select' },
  FIST: { label: 'Closed Fist', color: 'text-amber-400', desc: 'Fold Controls / Idle' },
  V_SIGN: { label: 'V Sign (Peace)', color: 'text-indigo-400', desc: 'Toggle Spatial Mode' },
  THUMBS_UP: { label: 'Thumbs Up', color: 'text-teal-400', desc: 'Confirm / Cycle Color' },
  TWO_HAND_EXPANSION: { label: 'Dual Expansion', color: 'text-fuchsia-400', desc: 'Scale Object' },
};

export function TelemetryPanel({ visionState }: TelemetryPanelProps) {
  const { objects, selectedObjectId, spatialMode } = useSpatialStore();

  const selectedObject = objects.find((o) => o.id === selectedObjectId);
  const activeGesture = visionState.activeGesture;
  const gestureMeta = GESTURE_LABELS[activeGesture] || GESTURE_LABELS.IDLE;
  const handCount = visionState.hands.length;

  return (
    <aside className="absolute right-4 top-4 bottom-4 w-72 z-30 flex flex-col gap-3 pointer-events-none select-none">
      {/* 1. Core Vision Telemetry HUD */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-200">
              Spatial Telemetry
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{visionState.fps} FPS</span>
          </div>
        </div>

        {/* Tracking Metrics */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] uppercase">Hands Tracked</span>
            <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Hand size={14} className={handCount > 0 ? 'text-cyan-400' : 'text-slate-600'} />
              {handCount === 0 ? 'Searching' : `${handCount} Active`}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-400 text-[9px] uppercase">Latency</span>
            <span className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Zap size={14} className="text-amber-400" />
              {visionState.latencyMs} ms
            </span>
          </div>
        </div>

        {/* Hand Landmark Status Details */}
        {handCount > 0 && (
          <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col gap-1.5 text-[10px] font-mono">
            {visionState.hands.map((hand, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {hand.handedness} Hand
                </span>
                <span className="text-cyan-400">{(hand.score * 100).toFixed(0)}% conf</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Recognized Gesture HUD */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5 pointer-events-auto border border-white/10">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Gesture Engine</span>
          </div>
          <span className="text-[10px] text-slate-400">Geometric 3D</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-mono font-bold ${gestureMeta.color}`}>
              {gestureMeta.label}
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {(visionState.gestureConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">{gestureMeta.desc}</span>

          {/* Confidence Meter Bar */}
          <div className="w-full h-1 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${Math.round(visionState.gestureConfidence * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Selected Virtual Object Inspector */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5 pointer-events-auto border border-white/10 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-sky-400" />
            <span>Spatial Object</span>
          </div>
          <span className="text-[10px] text-cyan-400">{spatialMode}</span>
        </div>

        {selectedObject ? (
          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <span className="font-semibold text-slate-100">{selectedObject.name}</span>
              <span className="text-[10px] text-slate-400 uppercase">{selectedObject.type}</span>
            </div>

            {/* Position Coordinates */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">3D Transform</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-center">
                  <span className="text-slate-400 text-[9px]">X: </span>
                  <span className="text-slate-200">{selectedObject.position[0].toFixed(2)}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-center">
                  <span className="text-slate-400 text-[9px]">Y: </span>
                  <span className="text-slate-200">{selectedObject.position[1].toFixed(2)}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 text-center">
                  <span className="text-slate-400 text-[9px]">Z: </span>
                  <span className="text-slate-200">{selectedObject.position[2].toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Scale and Color Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md border border-white/30 shadow-inner"
                  style={{ backgroundColor: selectedObject.color }}
                  title="Object Hologram Color"
                />
                <span className="text-[10px] text-slate-400">
                  Scale: {selectedObject.scale[0].toFixed(1)}x
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => spatialStore.cycleObjectColor(selectedObject.id)}
                  title="Cycle Color (Thumbs Up gesture)"
                  className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-cyan-500/20 transition-all"
                >
                  <Palette size={14} />
                </button>
                <button
                  onClick={() => spatialStore.updateObjectScale(selectedObject.id, 1.15)}
                  title="Scale Up (Two-Hand Expansion gesture)"
                  className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-cyan-500/20 transition-all"
                >
                  <Maximize size={14} />
                </button>
                <button
                  onClick={() => spatialStore.deleteSelectedObject()}
                  title="Delete Object"
                  className="p-1.5 rounded-lg bg-black/40 border border-rose-500/20 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400 gap-1.5">
            <span className="text-xs">No Object Selected</span>
            <span className="text-[10px] text-slate-400">
              Point & Pinch to grab or click any 3D object
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

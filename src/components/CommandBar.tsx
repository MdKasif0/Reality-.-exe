import {
  Camera,
  CameraOff,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cameraManager } from '../core/cameraManager';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { CameraState, VisionState } from '../types';

interface CommandBarProps {
  cameraState: CameraState;
  visionState: VisionState;
  onOpenGuide: () => void;
}

export function CommandBar({ cameraState, visionState, onOpenGuide }: CommandBarProps) {
  const { selectedObjectId, grabbedObjectId, spatialMode } = useSpatialStore();

  // Dynamic contextual hint
  const getContextualHint = (): string => {
    if (spatialMode === 'SCAN_REALITY') {
      return 'Reality Scan active — aim at physical object, pinch or tap Scan Target to analyze.';
    }
    if (spatialMode === 'AIR_DRAW') {
      return 'Air Draw active — pinch index & thumb to sculpt temporary 3D strokes in space.';
    }
    if (grabbedObjectId) {
      return 'Object grabbed — move hand to reposition, release pinch to drop.';
    }
    if (visionState.activeGesture === 'AIR_CIRCLE') {
      return 'Air Circle detected — summoning contextual radial menu.';
    }
    if (visionState.activeGesture === 'OPEN_PALM') {
      return 'Open Palm detected — contextual spatial menu active.';
    }
    if (visionState.activeGesture === 'V_SIGN') {
      return 'V-Sign detected — toggling navigation mode.';
    }
    if (visionState.activeGesture === 'THUMBS_UP') {
      return 'Thumbs Up detected — cycling holographic material color.';
    }
    if (visionState.activeGesture === 'TWO_HAND_EXPANSION') {
      return 'Two hands detected — move hands closer/apart to scale or rotate object.';
    }
    if (visionState.hands.length === 0) {
      return 'Raise hand in front of camera to begin gesture interaction.';
    }
    if (selectedObjectId) {
      return 'Pinch with thumb & index near object to grab, or show Thumbs-Up to cycle color.';
    }
    return 'Point toward any virtual object to target, pinch to select.';
  };

  const isPaused = visionState.paused;
  const isCameraActive = cameraState.status === 'ready';

  return (
    <footer className="absolute bottom-4 left-24 right-80 z-30 flex items-center justify-between px-4 py-2.5 glass-panel rounded-2xl select-none border border-white/10 transition-all">
      {/* Contextual Interaction Hint */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Sparkles size={14} className="animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            System Guide • {spatialMode}
          </span>
          <span className="text-xs font-mono text-slate-200 truncate">
            {getContextualHint()}
          </span>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Tracking Pause/Resume */}
        <button
          onClick={() => mediaPipeService.setPaused(!isPaused)}
          title={isPaused ? 'Resume Hand Tracking' : 'Pause Hand Tracking'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
            isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => {
            if (isCameraActive) {
              cameraManager.stopCamera();
            } else {
              cameraManager.requestCamera().catch(console.error);
            }
          }}
          title={isCameraActive ? 'Stop Camera Stream' : 'Restart Camera'}
          className={`p-1.5 rounded-xl border transition-all ${
            isCameraActive
              ? 'bg-black/40 border-white/10 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
          }`}
        >
          {isCameraActive ? <Camera size={14} /> : <CameraOff size={14} />}
        </button>

        {/* Scene Reset */}
        <button
          onClick={() => spatialStore.resetScene()}
          title="Reset Virtual Space"
          className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all"
        >
          <RotateCcw size={14} />
        </button>

        {/* Keyboard Shortcuts Hint */}
        <button
          onClick={onOpenGuide}
          title="Keyboard Shortcuts & Accessibility"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
        >
          <Keyboard size={13} />
          <span>Shortcuts</span>
        </button>
      </div>
    </footer>
  );
}

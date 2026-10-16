import {
  Activity,
  Camera,
  CameraOff,
  CornerDownLeft,
  FileJson,
  Keyboard,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  StopCircle,
  Undo2,
  Video,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cameraManager } from '../core/cameraManager';
import { mediaPipeService } from '../core/mediaPipeService';
import { SpatialCommandExecutor } from '../spatial/spatialCommandExecutor';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { CameraState, VisionState } from '../types';
import { canvasRecorder, RecorderState } from '../utils/canvasRecorder';

interface CommandBarProps {
  cameraState: CameraState;
  visionState: VisionState;
  onOpenGuide: () => void;
  onOpenSnapshots: () => void;
}

export function CommandBar({
  cameraState,
  visionState,
  onOpenGuide,
  onOpenSnapshots,
}: CommandBarProps) {
  const { selectedObjectId, grabbedObjectId, spatialMode, undoStack, redoStack, settings } =
    useSpatialStore();

  const [commandInput, setCommandInput] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>(canvasRecorder.getState());

  useEffect(() => {
    return canvasRecorder.subscribe(setRecorderState);
  }, []);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = commandInput.trim();
    if (!query) return;

    const res = SpatialCommandExecutor.execute(query);
    setCommandFeedback(res.message);
    setCommandInput('');

    setTimeout(() => {
      setCommandFeedback(null);
    }, 3500);
  };

  const handleToggleRecording = () => {
    if (recorderState.status === 'recording') {
      canvasRecorder.stopRecording();
      // Prompt download after small delay
      setTimeout(() => {
        canvasRecorder.downloadRecording();
      }, 300);
    } else {
      canvasRecorder.startRecording();
    }
  };

  // Dynamic contextual hint
  const getContextualHint = (): string => {
    if (commandFeedback) {
      return commandFeedback;
    }
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
      return 'Pinch near object to grab, or type commands below (e.g. "make larger", "duplicate").';
    }
    return 'Point toward any virtual object to target, pinch to select.';
  };

  const isPaused = visionState.paused;
  const isCameraActive = cameraState.status === 'ready';
  const isRecording = recorderState.status === 'recording';

  return (
    <footer className="absolute bottom-4 left-24 right-80 z-30 flex items-center justify-between px-4 py-2.5 glass-panel rounded-2xl select-none border border-white/10 transition-all gap-4">
      {/* Left: Contextual Hint & Command Line Input */}
      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Sparkles size={14} className="animate-pulse" />
        </div>

        <form onSubmit={handleCommandSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder={getContextualHint()}
              className="w-full pl-3 pr-7 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400/50 text-xs font-mono text-slate-100 placeholder:text-slate-500 outline-none truncate transition-all"
            />
            {commandInput.trim() && (
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white p-0.5"
              >
                <CornerDownLeft size={12} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
          <button
            onClick={() => spatialStore.undo()}
            disabled={undoStack.length === 0}
            title={`Undo (${undoStack.length}) [Ctrl+Z]`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => spatialStore.redo()}
            disabled={redoStack.length === 0}
            title={`Redo (${redoStack.length}) [Ctrl+Y]`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Canvas Screen Recording */}
        <button
          onClick={handleToggleRecording}
          title={isRecording ? 'Stop and download recording' : 'Record 3D canvas interaction clip'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
            isRecording
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
              : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isRecording ? (
            <>
              <StopCircle size={13} className="text-rose-400" />
              <span>REC {String(recorderState.durationSeconds).padStart(2, '0')}s</span>
            </>
          ) : (
            <>
              <Video size={13} className="text-cyan-400" />
              <span>Record</span>
            </>
          )}
        </button>

        {/* Scene Snapshots Export/Import */}
        <button
          onClick={onOpenSnapshots}
          title="Scene Snapshots (Export & Restore JSON)"
          className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <FileJson size={14} />
        </button>

        {/* Diagnostics HUD Toggle */}
        <button
          onClick={() =>
            spatialStore.updateSettings({ showDiagnostics: !settings.showDiagnostics })
          }
          title="Toggle Gesture Diagnostics HUD"
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            settings.showDiagnostics
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
              : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Activity size={14} />
        </button>

        {/* Tracking Pause/Resume */}
        <button
          onClick={() => mediaPipeService.setPaused(!isPaused)}
          title={isPaused ? 'Resume Hand Tracking' : 'Pause Hand Tracking'}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-mono transition-all ${
            isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
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
          {isCameraActive ? <Camera size={13} /> : <CameraOff size={13} />}
        </button>

        {/* Scene Reset */}
        <button
          onClick={() => spatialStore.resetScene()}
          title="Reset Virtual Space"
          className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenGuide}
          title="Keyboard Shortcuts & Accessibility [?]"
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
        >
          <Keyboard size={12} />
        </button>
      </div>
    </footer>
  );
}

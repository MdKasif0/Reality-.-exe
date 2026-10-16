import { Hand, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cameraManager } from '../core/cameraManager';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialInteractionManager } from '../spatial/spatialInteractionManager';
import { spatialStore } from '../store/useSpatialStore';
import { CameraState, VisionState } from '../types';
import { CommandBar } from './CommandBar';
import { ContextualRadialMenu } from './ContextualRadialMenu';
import { ControlsModal } from './ControlsModal';
import { HandLandmarkOverlay } from './HandLandmarkOverlay';
import { KeyboardControls } from './KeyboardControls';
import { NavigationRail } from './NavigationRail';
import { SettingsModal } from './SettingsModal';
import { TelemetryPanel } from './TelemetryPanel';
import { ThreeScene } from './three/ThreeScene';

interface SpatialWorkspaceProps {
  onExit: () => void;
}

export function SpatialWorkspace({ onExit }: SpatialWorkspaceProps) {
  const [cameraState, setCameraState] = useState<CameraState>(cameraManager.getState());
  const [visionState, setVisionState] = useState<VisionState>(mediaPipeService.getState());

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFirstUseToast, setShowFirstUseToast] = useState(true);

  useEffect(() => {
    // Initialize spatial interaction manager listeners
    spatialInteractionManager.init();

    // Subscribe to camera and vision state updates
    const unsubCamera = cameraManager.subscribe((state) => {
      setCameraState(state);
    });

    const unsubVision = mediaPipeService.subscribe((state) => {
      setVisionState(state);
    });

    // Hide first use toast after 6 seconds
    const timer = setTimeout(() => {
      setShowFirstUseToast(false);
    }, 6500);

    return () => {
      unsubCamera();
      unsubVision();
      clearTimeout(timer);
      spatialInteractionManager.destroy();
    };
  }, []);

  const handleExit = () => {
    cameraManager.stopCamera();
    mediaPipeService.close();
    spatialStore.resetScene();
    onExit();
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#060608] overflow-hidden select-none">
      {/* 1. Underlying Camera Feed & 2D Hand Landmark Overlay */}
      <HandLandmarkOverlay />

      {/* 2. Interactive 3D Spatial Canvas */}
      <ThreeScene />

      {/* 3. Left Navigation Rail */}
      <NavigationRail
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExit={handleExit}
      />

      {/* 4. Right Telemetry & Object Inspector */}
      <TelemetryPanel visionState={visionState} />

      {/* 5. Bottom Command Bar */}
      <CommandBar
        cameraState={cameraState}
        visionState={visionState}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* 6. Contextual Holographic Radial Menu (triggered by Open Palm) */}
      <ContextualRadialMenu />

      {/* 7. Keyboard Accessibility Handler */}
      <KeyboardControls
        onToggleGuide={() => setIsGuideOpen((prev) => !prev)}
        onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
      />

      {/* 8. Modals */}
      <ControlsModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* First-use Gentle Onboarding Banner */}
      {showFirstUseToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 glass-panel-active rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl border border-cyan-400/40">
          <div className="w-8 h-8 rounded-xl bg-cyan-400/20 flex items-center justify-center text-cyan-400">
            <Hand size={18} />
          </div>
          <div className="flex flex-col text-xs font-mono">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>Spatial Engine Active</span>
              <Sparkles size={13} className="text-cyan-400" />
            </span>
            <span className="text-slate-300">
              Raise your hand: Point to aim, Pinch to grab & translate objects.
            </span>
          </div>
          <button
            onClick={() => setShowFirstUseToast(false)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

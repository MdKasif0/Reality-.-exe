import { Hand, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cameraManager } from '../core/cameraManager';
import { mediaPipeService } from '../core/mediaPipeService';
import { physicalObjectSelector } from '../spatial/physicalObjectSelector';
import { spatialInteractionManager } from '../spatial/spatialInteractionManager';
import { aiService, AIServiceState } from '../services/ai/aiService';
import { sceneContextStore } from '../store/useSceneContextStore';
import { spatialStore } from '../store/useSpatialStore';
import { CameraState, VisionState } from '../types';
import { AskRealityPanel } from './ai/AskRealityPanel';
import { RealityScanPanel } from './ai/RealityScanPanel';
import { SceneContextDrawer } from './ai/SceneContextDrawer';
import { SpawnObjectModal } from './ai/SpawnObjectModal';
import { TargetingReticleOverlay } from './ai/TargetingReticleOverlay';
import { CommandBar } from './CommandBar';
import { ContextualRadialMenu } from './ContextualRadialMenu';
import { ControlsModal } from './ControlsModal';
import { GestureDiagnosticsHUD } from './GestureDiagnosticsHUD';
import { HandLandmarkOverlay } from './HandLandmarkOverlay';
import { KeyboardControls } from './KeyboardControls';
import { NavigationRail } from './NavigationRail';
import { SceneSnapshotModal } from './SceneSnapshotModal';
import { SettingsModal } from './SettingsModal';
import { SpatialContextMenu } from './SpatialContextMenu';
import { TelemetryPanel } from './TelemetryPanel';
import { ThreeScene } from './three/ThreeScene';

interface SpatialWorkspaceProps {
  onExit: () => void;
}

export function SpatialWorkspace({ onExit }: SpatialWorkspaceProps) {
  const [cameraState, setCameraState] = useState<CameraState>(cameraManager.getState());
  const [visionState, setVisionState] = useState<VisionState>(mediaPipeService.getState());
  const [aiState, setAiState] = useState<AIServiceState>(aiService.getState());

  // UI Modal and Panel states
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
  const [isAskRealityOpen, setIsAskRealityOpen] = useState(false);
  const [askRealityPrefill, setAskRealityPrefill] = useState('');
  const [isScanPanelOpen, setIsScanPanelOpen] = useState(false);
  const [showFirstUseToast, setShowFirstUseToast] = useState(true);

  // Trigger Reality Scan analysis
  const handleTriggerScan = async () => {
    const video = cameraManager.getVideoElement();
    if (!video) {
      console.warn('Camera feed not ready for scan.');
      return;
    }

    const reticleBox = physicalObjectSelector.getState().box;
    const settings = spatialStore.getState().settings;

    try {
      await aiService.scanPhysicalObject(
        video,
        reticleBox,
        settings.mirrorCamera
      );
      setIsScanPanelOpen(true);
    } catch (err: any) {
      console.error('Reality scan error:', err);
    }
  };

  const handleOpenAskReality = (prefill?: string) => {
    setAskRealityPrefill(prefill || '');
    setIsAskRealityOpen(true);
  };

  useEffect(() => {
    // Initialize spatial interaction manager listeners
    spatialInteractionManager.init();

    // Wire scan trigger from pinch gesture in SCAN_REALITY mode
    const unsubScanTrigger = spatialInteractionManager.onScanTrigger(() => {
      handleTriggerScan();
    });

    // Subscribe to camera, vision, and AI state updates
    const unsubCamera = cameraManager.subscribe(setCameraState);
    const unsubVision = mediaPipeService.subscribe(setVisionState);
    const unsubAi = aiService.subscribe(setAiState);

    // Hide first use toast after 6.5s
    const timer = setTimeout(() => {
      setShowFirstUseToast(false);
    }, 6500);

    return () => {
      unsubScanTrigger();
      unsubCamera();
      unsubVision();
      unsubAi();
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

      {/* 3. Physical Object Targeting Reticle (active in SCAN_REALITY mode) */}
      <TargetingReticleOverlay
        onTriggerScan={handleTriggerScan}
        isScanning={aiState.isScanning}
      />

      {/* 4. Left Navigation Rail */}
      <NavigationRail
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSpawnModal={() => setIsSpawnModalOpen(true)}
        onToggleAskReality={() => setIsAskRealityOpen((prev) => !prev)}
        onToggleSceneMemory={() => sceneContextStore.toggleDrawer()}
        onExit={handleExit}
      />

      {/* 5. Right Telemetry & Object Inspector */}
      <TelemetryPanel visionState={visionState} />

      {/* 6. Bottom Command Bar */}
      <CommandBar
        cameraState={cameraState}
        visionState={visionState}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSnapshots={() => setIsSnapshotsOpen(true)}
      />

      {/* 7. Contextual Holographic Radial Menu (triggered by Open Palm or Air Circle) */}
      <ContextualRadialMenu />

      {/* 8. 3D Object Spatial Contextual Menu */}
      <SpatialContextMenu onOpenAskReality={handleOpenAskReality} />

      {/* 9. Reality Scan Structured Output Panel */}
      <RealityScanPanel
        scanResult={aiState.lastScanResult}
        isOpen={isScanPanelOpen}
        onClose={() => setIsScanPanelOpen(false)}
        onOpenAskReality={handleOpenAskReality}
      />

      {/* 10. Ask Reality Conversational Environment Panel */}
      <AskRealityPanel
        isOpen={isAskRealityOpen}
        onClose={() => setIsAskRealityOpen(false)}
        initialQuestion={askRealityPrefill}
      />

      {/* 11. Session Memory Drawer */}
      <SceneContextDrawer onOpenAskReality={handleOpenAskReality} />

      {/* 12. Spawn Virtual Object Modal (Procedural & AI Modes) */}
      <SpawnObjectModal
        isOpen={isSpawnModalOpen}
        onClose={() => setIsSpawnModalOpen(false)}
      />

      {/* 13. Scene Snapshots Export/Import Modal */}
      <SceneSnapshotModal
        isOpen={isSnapshotsOpen}
        onClose={() => setIsSnapshotsOpen(false)}
      />

      {/* 14. Real-time Gesture Diagnostics HUD */}
      <GestureDiagnosticsHUD />

      {/* 15. Keyboard Accessibility Handler */}
      <KeyboardControls
        onToggleGuide={() => setIsGuideOpen((prev) => !prev)}
        onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
      />

      {/* 16. Modals */}
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
              Point to aim, pinch to grab. Use Reality Scan [R] to analyze physical surroundings.
            </span>
          </div>
          <button
            onClick={() => setShowFirstUseToast(false)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

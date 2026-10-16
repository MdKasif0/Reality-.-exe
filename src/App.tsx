import { useEffect, useState } from 'react';
import { ControlsModal } from './components/ControlsModal';
import { InitializationModal } from './components/InitializationModal';
import { LandingScreen } from './components/LandingScreen';
import { SpatialWorkspace } from './components/SpatialWorkspace';
import { cameraManager } from './core/cameraManager';
import { mediaPipeService } from './core/mediaPipeService';
import { spatialStore } from './store/useSpatialStore';
import { CameraState, VisionState } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const [cameraState, setCameraState] = useState<CameraState>(cameraManager.getState());
  const [visionState, setVisionState] = useState<VisionState>(mediaPipeService.getState());

  useEffect(() => {
    const unsubCamera = cameraManager.subscribe(setCameraState);
    const unsubVision = mediaPipeService.subscribe(setVisionState);
    return () => {
      unsubCamera();
      unsubVision();
    };
  }, []);

  const handleEnterSpatialMode = () => {
    setIsInitModalOpen(true);
  };

  const handleInitSuccess = () => {
    setIsInitModalOpen(false);
    setCurrentView('workspace');
  };

  const handleContinueOffline = () => {
    setIsInitModalOpen(false);
    spatialStore.setBackgroundMode('dark');
    setCurrentView('workspace');
  };

  const handleExitWorkspace = () => {
    setCurrentView('landing');
  };

  return (
    <div className={`w-full h-full min-h-screen bg-[#07070a] text-slate-100 font-sans ${currentView === 'landing' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {currentView === 'landing' ? (
        <LandingScreen
          onEnterSpatialMode={handleEnterSpatialMode}
          onExploreControls={() => setIsGuideOpen(true)}
        />
      ) : (
        <SpatialWorkspace onExit={handleExitWorkspace} />
      )}

      {/* Camera & Vision Initialization Modal */}
      <InitializationModal
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
        onSuccess={handleInitSuccess}
        onContinueOfflineDemo={handleContinueOffline}
        cameraState={cameraState}
        visionState={visionState}
      />

      {/* Gesture Guide & Keyboard Directory Modal */}
      <ControlsModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

export default App;

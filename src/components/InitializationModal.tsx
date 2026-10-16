import { AlertCircle, Camera, CheckCircle2, Loader2, RefreshCw, Shield, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { cameraManager } from '../core/cameraManager';
import { mediaPipeService } from '../core/mediaPipeService';
import { CameraState, VisionState } from '../types';

interface InitializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onContinueOfflineDemo?: () => void;
  cameraState: CameraState;
  visionState: VisionState;
}

export function InitializationModal({
  isOpen,
  onClose,
  onSuccess,
  onContinueOfflineDemo,
  cameraState,
  visionState,
}: InitializationModalProps) {
  const [step, setStep] = useState<'prompt' | 'initializing' | 'error'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartInitialization = async () => {
    setStep('initializing');
    setErrorMessage(null);

    try {
      // 1. Request camera stream
      console.log('[Init] Requesting camera stream...');
      await cameraManager.requestCamera();

      // 2. Initialize MediaPipe
      console.log('[Init] Initializing MediaPipe vision engine...');
      await mediaPipeService.initialize();

      // 3. Success
      onSuccess();
    } catch (err: any) {
      console.error('[Init] Initialization failed:', err);
      setStep('error');
      setErrorMessage(
        err?.message || 'An error occurred during spatial engine initialization.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-wide">
                Initialize Spatial Engine
              </h2>
              <p className="text-xs font-mono text-cyan-400">
                Webcam & Vision Model Calibration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cancel"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content based on Step */}
        {step === 'prompt' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              To enable natural 3D hand gesture tracking, <strong className="text-white">Reality.exe</strong> requires access to your front-facing webcam.
            </p>

            {/* Privacy Guarantee Box */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3">
              <Shield size={18} className="text-cyan-400 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-cyan-300">100% Local & Private Processing</span>
                <p className="text-slate-400 leading-normal">
                  All computer vision models and neural landmark inferences run directly inside your browser using WebAssembly. Your camera video never leaves your computer.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleStartInitialization}
                className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] text-black font-semibold font-display tracking-wider uppercase text-xs flex items-center justify-center gap-2 transition-all glow-cyan cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Grant Access & Launch Spatial OS</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                Return to Landing
              </button>
            </div>
          </div>
        )}

        {step === 'initializing' && (
          <div className="flex flex-col gap-5 py-4">
            <div className="flex items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                <Sparkles size={24} className="text-cyan-400 absolute animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-mono">
              {/* Step 1: Camera */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="flex items-center gap-2 text-slate-300">
                  {cameraState.status === 'ready' ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <Loader2 size={15} className="text-cyan-400 animate-spin" />
                  )}
                  <span>Webcam Video Feed</span>
                </span>
                <span className="text-[10px] text-cyan-400">
                  {cameraState.status === 'ready' ? '720p Active' : 'Connecting...'}
                </span>
              </div>

              {/* Step 2: MediaPipe Vision Runtime */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="flex items-center gap-2 text-slate-300">
                  {visionState.status === 'ready' ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <Loader2 size={15} className="text-cyan-400 animate-spin" />
                  )}
                  <span>Hand Landmarker WASM Engine</span>
                </span>
                <span className="text-[10px] text-cyan-400">
                  {visionState.status === 'ready'
                    ? '100% Ready'
                    : `${visionState.progress}%`}
                </span>
              </div>
            </div>

            <p className="text-center text-xs font-mono text-slate-400 animate-pulse">
              {visionState.statusMessage || 'Preparing spatial computing engine...'}
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-400 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-rose-300">Initialization Notice</span>
                <p className="text-slate-300 leading-relaxed">
                  {errorMessage || 'Unable to connect to webcam or initialize vision runtime.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleStartInitialization}
                className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-display tracking-wider uppercase text-xs flex items-center justify-center gap-2 transition-all glow-cyan"
              >
                <RefreshCw size={15} />
                <span>Retry Camera Permission & Load</span>
              </button>

              {onContinueOfflineDemo && (
                <button
                  onClick={onContinueOfflineDemo}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all"
                >
                  Continue with Mouse & Keyboard Simulator Mode
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

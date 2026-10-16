import { Crosshair, Move, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { physicalObjectSelector } from '../../spatial/physicalObjectSelector';
import { useSpatialStore } from '../../store/useSpatialStore';
import { TargetingReticleState } from '../../types';

interface TargetingReticleOverlayProps {
  onTriggerScan: () => void;
  isScanning: boolean;
}

export function TargetingReticleOverlay({ onTriggerScan, isScanning }: TargetingReticleOverlayProps) {
  const { spatialMode, settings } = useSpatialStore();
  const [reticle, setReticle] = useState<TargetingReticleState>(physicalObjectSelector.getState());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-br' | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialBox: any } | null>(null);

  useEffect(() => {
    return physicalObjectSelector.subscribe(setReticle);
  }, []);

  if (spatialMode !== 'SCAN_REALITY') return null;

  const box = reticle.box;
  // Normalized to percentage
  const leftPct = `${box.x * 100}%`;
  const topPct = `${box.y * 100}%`;
  const widthPct = `${box.width * 100}%`;
  const heightPct = `${box.height * 100}%`;

  const handlePointerDownMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('move');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialBox: { ...box },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('resize-br');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialBox: { ...box },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !dragStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.mouseX) / rect.width;
    const dy = (e.clientY - dragStartRef.current.mouseY) / rect.height;
    const initial = dragStartRef.current.initialBox;

    if (dragMode === 'move') {
      physicalObjectSelector.adjustBox(
        {
          x: Math.max(0, Math.min(1 - initial.width, initial.x + dx)),
          y: Math.max(0, Math.min(1 - initial.height, initial.y + dy)),
        },
        true
      );
    } else if (dragMode === 'resize-br') {
      physicalObjectSelector.adjustBox(
        {
          width: Math.max(0.1, Math.min(1 - initial.x, initial.width + dx)),
          height: Math.max(0.1, Math.min(1 - initial.y, initial.height + dy)),
        },
        true
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode) {
      setDragMode(null);
      dragStartRef.current = null;
      physicalObjectSelector.adjustBox({}, false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Direct tap anywhere on background to relocate box
  const handleContainerClick = (e: React.MouseEvent) => {
    if (dragMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Convert to unmirrored space if mirrorCamera is active
    const actualNormX = settings.mirrorCamera ? 1 - clickX : clickX;
    physicalObjectSelector.setTargetAt(actualNormX, clickY);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 z-30 pointer-events-auto select-none overflow-hidden cursor-crosshair"
    >
      {/* Top Banner Guide */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel-active rounded-xl flex items-center gap-2.5 text-xs font-mono text-cyan-300 shadow-xl border border-cyan-400/40 animate-in fade-in slide-in-from-top-2">
        <Crosshair size={15} className="animate-spin text-cyan-400" />
        <span>Aim index finger or tap camera image to select physical object</span>
      </div>

      {/* Holographic Target Bounding Box */}
      <div
        style={{
          left: leftPct,
          top: topPct,
          width: widthPct,
          height: heightPct,
        }}
        className={`absolute rounded-xl border-2 transition-all ${
          isScanning
            ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] bg-emerald-950/20'
            : 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.35)] bg-cyan-950/15'
        }`}
      >
        {/* Corner Cyber Brackets */}
        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-white pointer-events-none" />

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-6 h-0.5 bg-cyan-300" />
          <div className="h-6 w-0.5 bg-cyan-300 absolute" />
        </div>

        {/* Move Drag Handle in Center */}
        <div
          onPointerDown={handlePointerDownMove}
          title="Drag to reposition target area"
          className="absolute inset-2 flex items-center justify-center cursor-move text-cyan-300/40 hover:text-cyan-300 transition-colors"
        >
          <Move size={20} />
        </div>

        {/* Resize Handle in Bottom Right */}
        <div
          onPointerDown={handlePointerDownResize}
          title="Drag to resize target area"
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-cyan-400 border border-white text-black flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-110 active:scale-95 transition-transform"
        >
          <div className="w-2 h-2 rounded-full bg-black" />
        </div>

        {/* Floating Scan Action Bar attached below box */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerScan();
            }}
            disabled={isScanning}
            className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg glow-cyan disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Scan Target (Pinch)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { SKELETON_CONNECTIONS } from '../constants/landmarks';
import { cameraManager } from '../core/cameraManager';
import { gestureEngine } from '../core/gestureEngine';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialInteractionManager } from '../spatial/spatialInteractionManager';
import { useSpatialStore } from '../store/useSpatialStore';
import { HandData } from '../types';

interface HandLandmarkOverlayProps {
  onHandsDetected?: (hands: HandData[]) => void;
}

export function HandLandmarkOverlay({ onHandsDetected }: HandLandmarkOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const { backgroundMode, settings } = useSpatialStore();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      cameraManager.attachVideoElement(video);
    }
    return () => {
      cameraManager.attachVideoElement(null);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const renderLoop = (time: number) => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // Sync canvas resolution with actual video stream size
        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Process vision frame
            const hands = mediaPipeService.processVideoFrame(video, time);

            // Run gesture recognition & spatial interaction
            const { activeGesture, confidence } = gestureEngine.evaluateHands(hands, time);
            spatialInteractionManager.updateFrame(hands);

            if (onHandsDetected) {
              onHandsDetected(hands);
            }

            // Draw hand skeleton & landmarks
            drawHandOverlay(
              ctx,
              hands,
              canvas.width,
              canvas.height,
              settings.mirrorCamera,
              settings.showDebugLandmarks,
              activeGesture,
              confidence
            );
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [settings.mirrorCamera, settings.showDebugLandmarks, onHandsDetected]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      {/* Actual Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          backgroundMode === 'camera'
            ? 'opacity-85 brightness-90 contrast-105'
            : backgroundMode === 'minimal'
            ? 'opacity-0'
            : 'opacity-20 blur-sm'
        } ${settings.mirrorCamera ? '-scale-x-100' : ''}`}
      />

      {/* Cinematic subtle vignette and scanlines */}
      {backgroundMode === 'camera' && (
        <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/75 pointer-events-none" />
      )}

      {/* 2D Hand Landmark & Skeletal Wireframe Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      />
    </div>
  );
}

function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  hands: HandData[],
  width: number,
  height: number,
  mirror: boolean,
  showDebug: boolean,
  activeGesture: string,
  gestureConfidence: number
) {
  if (hands.length === 0) return;

  ctx.save();

  // If camera is mirrored, flip canvas horizontally so landmarks match mirrored video
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  for (let h = 0; h < hands.length; h++) {
    const hand = hands[h];
    const lm = hand.smoothedLandmarks;
    if (!lm || lm.length < 21) continue;

    // Draw skeletal bones
    ctx.lineWidth = 2.5;
    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const p1 = lm[startIdx];
      const p2 = lm[endIdx];

      const x1 = p1.x * width;
      const y1 = p1.y * height;
      const x2 = p2.x * width;
      const y2 = p2.y * height;

      // Glowing gradient bone
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.7)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.4)');

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw joint nodes
    for (let i = 0; i < lm.length; i++) {
      const pt = lm[i];
      const x = pt.x * width;
      const y = pt.y * height;

      const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const isIndexTip = i === 8;
      const isThumbTip = i === 4;

      // Glow halo
      ctx.fillStyle = isIndexTip
        ? '#ffffff'
        : isThumbTip
        ? '#a5f3fc'
        : isTip
        ? '#38bdf8'
        : 'rgba(0, 240, 255, 0.9)';

      ctx.beginPath();
      ctx.arc(x, y, isIndexTip ? 5 : isTip ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer rings on tips
      if (isTip) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw debug index numbers
      if (showDebug) {
        ctx.save();
        if (mirror) {
          ctx.translate(x, y);
          ctx.scale(-1, 1);
          ctx.translate(-x, -y);
        }
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`${i}`, x + 6, y - 4);
        ctx.restore();
      }
    }

    // Draw pinch indicator line between thumb tip and index tip
    const thumbTip = lm[4];
    const indexTip = lm[8];
    const tx = thumbTip.x * width;
    const ty = thumbTip.y * height;
    const ix = indexTip.x * width;
    const iy = indexTip.y * height;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
  }

  ctx.restore();

  // Draw HUD debug overlay (unmirrored screen space)
  if (showDebug && hands.length > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(16, 16, 260, 110);
    ctx.strokeRect(16, 16, 260, 110);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SPATIAL VISION DEBUGGER', 28, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Hands Detected: ${hands.length}`, 28, 54);
    ctx.fillText(`Active Gesture: ${activeGesture}`, 28, 72);
    ctx.fillText(`Confidence: ${(gestureConfidence * 100).toFixed(0)}%`, 28, 90);
    ctx.fillText(`Index Tip Pos: (${hands[0].smoothedLandmarks[8].x.toFixed(2)}, ${hands[0].smoothedLandmarks[8].y.toFixed(2)})`, 28, 108);

    ctx.restore();
  }
}

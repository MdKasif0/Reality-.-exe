import { Landmark3D } from '../types';

export function distance3D(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distance2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function lerpLandmark(a: Landmark3D, b: Landmark3D, t: number): Landmark3D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z ?? 0, b.z ?? 0, t),
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Maps normalized camera coordinates (0..1, 0..1, mirrored optionally)
 * to 3D Three.js world space coordinates on a projection plane at depth z.
 */
export function mapCameraTo3D(
  normalizedX: number,
  normalizedY: number,
  viewWidth: number = 10,
  viewHeight: number = 6,
  depth: number = 0,
  mirrored: boolean = true
): [number, number, number] {
  // If mirrored, flip x
  const xNorm = mirrored ? 1 - normalizedX : normalizedX;
  
  // Convert from [0, 1] to [-viewWidth/2, viewWidth/2]
  const worldX = (xNorm - 0.5) * viewWidth;
  
  // Invert Y because camera coords have (0,0) at top-left, 3D has +Y up
  const worldY = -(normalizedY - 0.5) * viewHeight;
  
  return [worldX, worldY, depth];
}

/**
 * Computes angle at vertex B formed by line segments AB and BC in 3D.
 * Output is in radians.
 */
export function calculateAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 * mag2 === 0) return 0;
  const cosTheta = clamp(dot / (mag1 * mag2), -1, 1);
  return Math.acos(cosTheta);
}

/**
 * Exponential Moving Average filter for 21 hand landmarks to eliminate jitter
 */
export class LandmarkFilter {
  private prevLandmarks: Landmark3D[] | null = null;
  private alpha: number;

  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  public setAlpha(alpha: number) {
    this.alpha = clamp(alpha, 0.05, 0.95);
  }

  public filter(currentLandmarks: Landmark3D[]): Landmark3D[] {
    if (!this.prevLandmarks || this.prevLandmarks.length !== currentLandmarks.length) {
      this.prevLandmarks = currentLandmarks.map((lm) => ({ ...lm }));
      return currentLandmarks;
    }

    const smoothed: Landmark3D[] = [];
    for (let i = 0; i < currentLandmarks.length; i++) {
      const cur = currentLandmarks[i];
      const prev = this.prevLandmarks[i];

      // Dynamic alpha based on velocity: fast motion should have lower smoothing to eliminate lag
      const dist = distance3D(cur, prev);
      const dynamicAlpha = clamp(this.alpha + dist * 2.0, this.alpha, 0.92);

      const smoothedLm = {
        x: lerp(prev.x, cur.x, dynamicAlpha),
        y: lerp(prev.y, cur.y, dynamicAlpha),
        z: lerp(prev.z ?? 0, cur.z ?? 0, dynamicAlpha),
      };

      smoothed.push(smoothedLm);
    }

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset() {
    this.prevLandmarks = null;
  }
}

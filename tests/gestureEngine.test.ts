import test from 'node:test';
import assert from 'node:assert/strict';
import { distance3D, distance2D, calculateAngle, mapCameraTo3D, LandmarkFilter } from '../src/utils/mathUtils';
import { GestureEngine } from '../src/core/gestureEngine';
import { Landmark3D, HandData } from '../src/types';

test('Gesture Geometry - distance3D calculates accurate Euclidean distance', () => {
  const p1: Landmark3D = { x: 0, y: 0, z: 0 };
  const p2: Landmark3D = { x: 3, y: 4, z: 0 };
  assert.equal(distance3D(p1, p2), 5);

  const p3: Landmark3D = { x: 1, y: 2, z: 2 };
  const p4: Landmark3D = { x: 4, y: 6, z: 2 };
  assert.equal(distance3D(p3, p4), 5);
});

test('Gesture Geometry - distance2D calculates planar distance', () => {
  const p1 = { x: 1, y: 1 };
  const p2 = { x: 4, y: 5 };
  assert.equal(distance2D(p1, p2), 5);
});

test('Gesture Geometry - calculateAngle computes 3D vertex angle in radians', () => {
  const a: Landmark3D = { x: 1, y: 0, z: 0 };
  const b: Landmark3D = { x: 0, y: 0, z: 0 };
  const c: Landmark3D = { x: 0, y: 1, z: 0 };
  
  const angle = calculateAngle(a, b, c);
  // 90 degrees = pi / 2 = ~1.57079
  assert.ok(Math.abs(angle - Math.PI / 2) < 1e-4);
});

test('Coordinate Mapping - mapCameraTo3D maps normalized coords to 3D frustum', () => {
  // Center (0.5, 0.5) should map to (0, 0, depth)
  const [cx, cy, cz] = mapCameraTo3D(0.5, 0.5, 10, 6, -1, true);
  assert.ok(Math.abs(cx) < 1e-6);
  assert.ok(Math.abs(cy) < 1e-6);
  assert.equal(cz, -1);

  // Mirrored top-left (0, 0) maps to (+5, +3, 0)
  const [tlX, tlY] = mapCameraTo3D(0, 0, 10, 6, 0, true);
  assert.equal(tlX, 5); // Mirrored: (1 - 0 - 0.5) * 10 = +5
  assert.equal(tlY, 3); // - (0 - 0.5) * 6 = +3
});

test('Landmark Smoothing - LandmarkFilter suppresses high-frequency jitter', () => {
  const filter = new LandmarkFilter(0.5);
  
  const initial: Landmark3D[] = [{ x: 0.5, y: 0.5, z: 0 }];
  const f1 = filter.filter(initial);
  assert.equal(f1[0].x, 0.5);

  // Jitter jump to 0.55
  const jittered: Landmark3D[] = [{ x: 0.55, y: 0.5, z: 0 }];
  const f2 = filter.filter(jittered);
  
  // Smoothed coordinate should be between 0.5 and 0.55, not abruptly jumping
  assert.ok(f2[0].x > 0.5 && f2[0].x < 0.55);
});

test('Gesture Engine - Pinch detection fires when thumb and index tips are close', () => {
  const engine = new GestureEngine();
  let pinchStarted = false;

  engine.onPinch((evt) => {
    if (evt.phase === 'started') {
      pinchStarted = true;
    }
  });

  // Construct mock 21 landmarks where thumb tip (4) and index tip (8) are extremely close
  const mockLandmarks: Landmark3D[] = Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + i * 0.01,
    y: 0.5,
    z: 0,
  }));

  // Wrist at 0.5, 0.7; middle MCP at 0.5, 0.4 -> palm size = 0.3
  mockLandmarks[0] = { x: 0.5, y: 0.7, z: 0 };
  mockLandmarks[9] = { x: 0.5, y: 0.4, z: 0 };

  // Set thumb tip (4) and index tip (8) distance to 0.015 (well below 0.052 * 0.3 = 0.0156)
  mockLandmarks[4] = { x: 0.5, y: 0.5, z: 0 };
  mockLandmarks[8] = { x: 0.505, y: 0.5, z: 0 };

  const mockHand: HandData = {
    landmarks: mockLandmarks,
    smoothedLandmarks: mockLandmarks,
    handedness: 'Right',
    score: 0.98,
    handIndex: 0,
  };

  // Evaluate frame
  engine.evaluateHands([mockHand], 1000);
  assert.equal(pinchStarted, true, 'Pinch start event should be triggered');
});

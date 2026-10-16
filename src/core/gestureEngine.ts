import { GESTURE_THRESHOLDS, HAND_LANDMARKS } from '../constants/landmarks';
import { GestureEvent, GestureType, HandData, Landmark3D, PinchEvent } from '../types';
import { distance3D } from '../utils/mathUtils';

type GestureEventListener = (event: GestureEvent) => void;
type PinchEventListener = (event: PinchEvent) => void;
type HandLostListener = (handIndex: number) => void;

interface HandGestureState {
  currentGesture: GestureType;
  lastGesture: GestureType;
  consecutiveFrames: number;
  lastTriggerTime: number;
  isPinching: boolean;
  pinchStartPos: Landmark3D | null;
  lastPinchPos: Landmark3D | null;
}

export class GestureEngine {
  private gestureListeners: Set<GestureEventListener> = new Set();
  private pinchListeners: Set<PinchEventListener> = new Set();
  private handLostListeners: Set<HandLostListener> = new Set();

  private handStates: HandGestureState[] = [
    this.createInitialHandState(),
    this.createInitialHandState(),
  ];

  private previousHandCount: number = 0;
  private previousTwoHandDistance: number | null = null;
  private pinchThresholdRatio: number = GESTURE_THRESHOLDS.PINCH_START_RATIO;

  private createInitialHandState(): HandGestureState {
    return {
      currentGesture: 'IDLE',
      lastGesture: 'IDLE',
      consecutiveFrames: 0,
      lastTriggerTime: 0,
      isPinching: false,
      pinchStartPos: null,
      lastPinchPos: null,
    };
  }

  public setPinchThreshold(threshold: number) {
    this.pinchThresholdRatio = threshold;
  }

  public onGesture(listener: GestureEventListener): () => void {
    this.gestureListeners.add(listener);
    return () => this.gestureListeners.delete(listener);
  }

  public onPinch(listener: PinchEventListener): () => void {
    this.pinchListeners.add(listener);
    return () => this.pinchListeners.delete(listener);
  }

  public onHandLost(listener: HandLostListener): () => void {
    this.handLostListeners.add(listener);
    return () => this.handLostListeners.delete(listener);
  }

  private emitGesture(event: GestureEvent) {
    this.gestureListeners.forEach((l) => l(event));
  }

  private emitPinch(event: PinchEvent) {
    this.pinchListeners.forEach((l) => l(event));
  }

  private emitHandLost(handIndex: number) {
    this.handLostListeners.forEach((l) => l(handIndex));
  }

  /**
   * Main evaluation loop invoked on every processed frame with detected hands
   */
  public evaluateHands(hands: HandData[], timestamp: number = performance.now()): {
    activeGesture: GestureType;
    confidence: number;
  } {
    // Check for hands lost
    if (this.previousHandCount > hands.length) {
      for (let i = hands.length; i < this.previousHandCount; i++) {
        const state = this.handStates[i];
        if (state.currentGesture !== 'IDLE') {
          this.emitGesture({
            type: state.currentGesture,
            phase: 'ended',
            handIndex: i,
            confidence: 0,
            timestamp,
          });
        }
        if (state.isPinching && state.lastPinchPos) {
          this.emitPinch({
            phase: 'released',
            position: state.lastPinchPos,
            distance: 0,
            handIndex: i,
            timestamp,
          });
          state.isPinching = false;
        }
        this.handStates[i] = this.createInitialHandState();
        this.emitHandLost(i);
      }
    }
    this.previousHandCount = hands.length;

    if (hands.length === 0) {
      this.previousTwoHandDistance = null;
      return { activeGesture: 'IDLE', confidence: 0 };
    }

    // 1. Check for two-hand expansion gesture if 2 hands are detected
    if (hands.length >= 2) {
      const h1Wrist = hands[0].smoothedLandmarks[HAND_LANDMARKS.WRIST];
      const h2Wrist = hands[1].smoothedLandmarks[HAND_LANDMARKS.WRIST];
      const twoHandDist = distance3D(h1Wrist, h2Wrist);

      if (this.previousTwoHandDistance !== null) {
        const delta = twoHandDist - this.previousTwoHandDistance;
        // If hands are changing distance noticeably and both are visible
        if (Math.abs(delta) > 0.008) {
          this.emitGesture({
            type: 'TWO_HAND_EXPANSION',
            phase: 'held',
            handIndex: 0,
            confidence: 0.9,
            timestamp,
            metadata: {
              deltaDistance: delta,
              currentDistance: twoHandDist,
              scaleMultiplier: 1 + delta * 2.5,
            },
          });
          this.previousTwoHandDistance = twoHandDist;
          return { activeGesture: 'TWO_HAND_EXPANSION', confidence: 0.9 };
        }
      }
      this.previousTwoHandDistance = twoHandDist;
    } else {
      this.previousTwoHandDistance = null;
    }

    // 2. Evaluate individual hand gestures (prioritize primary hand / hand 0)
    let dominantGesture: GestureType = 'IDLE';
    let dominantConfidence = 0;

    for (let i = 0; i < hands.length; i++) {
      const hand = hands[i];
      const state = this.handStates[i];
      const { gesture, confidence, pinchDistance, pinchCenter } = this.classifyHand(
        hand.smoothedLandmarks,
        state
      );

      // Handle Pinch Specific Stream
      const isCurrentlyPinching =
        pinchDistance < (state.isPinching ? GESTURE_THRESHOLDS.PINCH_RELEASE_RATIO : this.pinchThresholdRatio);

      if (isCurrentlyPinching && !state.isPinching) {
        // Pinch started
        state.isPinching = true;
        state.pinchStartPos = pinchCenter;
        state.lastPinchPos = pinchCenter;
        this.emitPinch({
          phase: 'started',
          position: pinchCenter,
          distance: pinchDistance,
          handIndex: i,
          timestamp,
        });
      } else if (isCurrentlyPinching && state.isPinching) {
        // Pinch moved
        state.lastPinchPos = pinchCenter;
        this.emitPinch({
          phase: 'moved',
          position: pinchCenter,
          distance: pinchDistance,
          handIndex: i,
          timestamp,
        });
      } else if (!isCurrentlyPinching && state.isPinching) {
        // Pinch released
        state.isPinching = false;
        this.emitPinch({
          phase: 'released',
          position: state.lastPinchPos || pinchCenter,
          distance: pinchDistance,
          handIndex: i,
          timestamp,
        });
      }

      // Handle Discrete Gesture State Machine & Hysteresis
      if (gesture === state.currentGesture) {
        state.consecutiveFrames++;
        if (gesture !== 'IDLE') {
          // Gesture is being held
          this.emitGesture({
            type: gesture,
            phase: 'held',
            handIndex: i,
            confidence,
            timestamp,
            metadata: { consecutiveFrames: state.consecutiveFrames },
          });
        }
      } else {
        // Potential gesture transition
        if (state.currentGesture !== 'IDLE') {
          this.emitGesture({
            type: state.currentGesture,
            phase: 'ended',
            handIndex: i,
            confidence: 0,
            timestamp,
          });
        }

        const timeSinceLastTrigger = timestamp - state.lastTriggerTime;
        if (
          gesture !== 'IDLE' &&
          timeSinceLastTrigger >= GESTURE_THRESHOLDS.COOLDOWN_MS
        ) {
          state.currentGesture = gesture;
          state.consecutiveFrames = 1;
          state.lastTriggerTime = timestamp;
          this.emitGesture({
            type: gesture,
            phase: 'started',
            handIndex: i,
            confidence,
            timestamp,
          });
        } else {
          state.currentGesture = 'IDLE';
          state.consecutiveFrames = 0;
        }
      }

      if (i === 0 || (dominantGesture === 'IDLE' && gesture !== 'IDLE')) {
        dominantGesture = state.currentGesture;
        dominantConfidence = confidence;
      }
    }

    return {
      activeGesture: dominantGesture,
      confidence: dominantConfidence,
    };
  }

  /**
   * Geometric classification of a single hand's 21 landmarks
   */
  private classifyHand(
    lm: Landmark3D[],
    state: HandGestureState
  ): {
    gesture: GestureType;
    confidence: number;
    pinchDistance: number;
    pinchCenter: Landmark3D;
  } {
    const wrist = lm[HAND_LANDMARKS.WRIST];
    const middleMcp = lm[HAND_LANDMARKS.MIDDLE_FINGER_MCP];
    const indexMcp = lm[HAND_LANDMARKS.INDEX_FINGER_MCP];

    // Palm size: reference unit scale
    const palmScale = Math.max(0.04, distance3D(wrist, middleMcp));

    // Landmark distances from wrist normalized by palm scale
    const indexTipDist = distance3D(wrist, lm[HAND_LANDMARKS.INDEX_FINGER_TIP]) / palmScale;
    const middleTipDist = distance3D(wrist, lm[HAND_LANDMARKS.MIDDLE_FINGER_TIP]) / palmScale;
    const ringTipDist = distance3D(wrist, lm[HAND_LANDMARKS.RING_FINGER_TIP]) / palmScale;
    const pinkyTipDist = distance3D(wrist, lm[HAND_LANDMARKS.PINKY_TIP]) / palmScale;

    // Check individual finger extension
    // Tip further than PIP and MCP indicates extended finger
    const isIndexExtended =
      indexTipDist > GESTURE_THRESHOLDS.FINGER_EXTENDED_RATIO &&
      distance3D(wrist, lm[HAND_LANDMARKS.INDEX_FINGER_TIP]) >
        distance3D(wrist, lm[HAND_LANDMARKS.INDEX_FINGER_PIP]);

    const isMiddleExtended =
      middleTipDist > GESTURE_THRESHOLDS.FINGER_EXTENDED_RATIO &&
      distance3D(wrist, lm[HAND_LANDMARKS.MIDDLE_FINGER_TIP]) >
        distance3D(wrist, lm[HAND_LANDMARKS.MIDDLE_FINGER_PIP]);

    const isRingExtended =
      ringTipDist > GESTURE_THRESHOLDS.FINGER_EXTENDED_RATIO &&
      distance3D(wrist, lm[HAND_LANDMARKS.RING_FINGER_TIP]) >
        distance3D(wrist, lm[HAND_LANDMARKS.RING_FINGER_PIP]);

    const isPinkyExtended =
      pinkyTipDist > GESTURE_THRESHOLDS.FINGER_EXTENDED_RATIO &&
      distance3D(wrist, lm[HAND_LANDMARKS.PINKY_TIP]) >
        distance3D(wrist, lm[HAND_LANDMARKS.PINKY_PIP]);

    // Thumb extension: thumb tip distance from index MCP
    const thumbToIndexMcp =
      distance3D(lm[HAND_LANDMARKS.THUMB_TIP], indexMcp) / palmScale;
    const isThumbExtended = thumbToIndexMcp > 0.75;

    // Pinch evaluation (distance between thumb tip & index tip)
    const rawPinchDist = distance3D(
      lm[HAND_LANDMARKS.THUMB_TIP],
      lm[HAND_LANDMARKS.INDEX_FINGER_TIP]
    );
    const normalizedPinchDist = rawPinchDist / palmScale;

    const pinchCenter: Landmark3D = {
      x: (lm[HAND_LANDMARKS.THUMB_TIP].x + lm[HAND_LANDMARKS.INDEX_FINGER_TIP].x) / 2,
      y: (lm[HAND_LANDMARKS.THUMB_TIP].y + lm[HAND_LANDMARKS.INDEX_FINGER_TIP].y) / 2,
      z: ((lm[HAND_LANDMARKS.THUMB_TIP].z ?? 0) + (lm[HAND_LANDMARKS.INDEX_FINGER_TIP].z ?? 0)) / 2,
    };

    const isPinching =
      normalizedPinchDist <
      (state.isPinching
        ? GESTURE_THRESHOLDS.PINCH_RELEASE_RATIO
        : this.pinchThresholdRatio);

    // 1. PINCH
    if (isPinching) {
      const confidence = Math.max(0.6, 1 - normalizedPinchDist);
      return { gesture: 'PINCH', confidence, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    // 2. OPEN PALM (all or most 4-5 fingers extended)
    const extendedCount =
      (isIndexExtended ? 1 : 0) +
      (isMiddleExtended ? 1 : 0) +
      (isRingExtended ? 1 : 0) +
      (isPinkyExtended ? 1 : 0);

    if (extendedCount >= 4 && isThumbExtended) {
      return { gesture: 'OPEN_PALM', confidence: 0.95, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    // 3. V SIGN (Index + Middle extended, Ring + Pinky folded)
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'V_SIGN', confidence: 0.92, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    // 4. POINT (Index extended, Middle, Ring, Pinky folded)
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return { gesture: 'POINT', confidence: 0.9, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    // 5. THUMBS UP (Thumb extended upwards, other 4 fingers folded)
    // Thumb tip Y must be significantly above wrist Y and thumb MCP in camera coords (smaller Y is higher in camera space)
    const thumbPointingUp =
      lm[HAND_LANDMARKS.THUMB_TIP].y < lm[HAND_LANDMARKS.THUMB_IP].y &&
      lm[HAND_LANDMARKS.THUMB_IP].y < lm[HAND_LANDMARKS.THUMB_MCP].y;

    if (extendedCount === 0 && isThumbExtended && thumbPointingUp) {
      return { gesture: 'THUMBS_UP', confidence: 0.88, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    // 6. FIST (All fingers folded close to palm/wrist)
    if (
      extendedCount === 0 &&
      !isThumbExtended &&
      indexTipDist < GESTURE_THRESHOLDS.FINGER_FOLDED_RATIO &&
      middleTipDist < GESTURE_THRESHOLDS.FINGER_FOLDED_RATIO
    ) {
      return { gesture: 'FIST', confidence: 0.86, pinchDistance: normalizedPinchDist, pinchCenter };
    }

    return { gesture: 'IDLE', confidence: 0, pinchDistance: normalizedPinchDist, pinchCenter };
  }

  public reset() {
    this.handStates = [
      this.createInitialHandState(),
      this.createInitialHandState(),
    ];
    this.previousHandCount = 0;
    this.previousTwoHandDistance = null;
  }
}

export const gestureEngine = new GestureEngine();

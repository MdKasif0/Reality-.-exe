import { HAND_LANDMARKS } from '../constants/landmarks';
import { gestureEngine } from '../core/gestureEngine';
import { spatialStore } from '../store/useSpatialStore';
import { GestureEvent, HandData, PinchEvent } from '../types';
import { mapCameraTo3D } from '../utils/mathUtils';

export class SpatialInteractionManager {
  private unsubscribeGesture: (() => void) | null = null;
  private unsubscribePinch: (() => void) | null = null;
  private unsubscribeHandLost: (() => void) | null = null;

  private isMirrored: boolean = true;
  private viewWidth: number = 10;
  private viewHeight: number = 6;
  private interactionDepth: number = 0;

  private lastModeToggleTime: number = 0;
  private lastPalmToggleTime: number = 0;
  private lastThumbsUpTime: number = 0;

  public init() {
    this.unsubscribeGesture = gestureEngine.onGesture(this.handleGesture);
    this.unsubscribePinch = gestureEngine.onPinch(this.handlePinch);
    this.unsubscribeHandLost = gestureEngine.onHandLost(this.handleHandLost);
  }

  public setProjectionDimensions(width: number, height: number, mirrored: boolean = true) {
    this.viewWidth = width;
    this.viewHeight = height;
    this.isMirrored = mirrored;
  }

  /**
   * Update pointer and hover states based on hand tracking landmarks
   */
  public updateFrame(hands: HandData[]) {
    if (hands.length === 0) {
      const state = spatialStore.getState();
      if (state.pointer.active) {
        spatialStore.updatePointer({ active: false, targetedObjectId: null });
        spatialStore.hoverObject(null);
      }
      return;
    }

    const primaryHand = hands[0];
    const indexTip = primaryHand.smoothedLandmarks[HAND_LANDMARKS.INDEX_FINGER_TIP];

    // Map 2D camera coordinates (0..1) to 3D scene coordinates
    const [pointerX, pointerY, pointerZ] = mapCameraTo3D(
      indexTip.x,
      indexTip.y,
      this.viewWidth,
      this.viewHeight,
      this.interactionDepth,
      this.isMirrored
    );

    const storeState = spatialStore.getState();
    const currentGrabbedId = storeState.grabbedObjectId;

    // If an object is grabbed, move it with the pointer
    if (currentGrabbedId) {
      spatialStore.updateObjectPosition(currentGrabbedId, [pointerX, pointerY, pointerZ]);
    }

    // Hit-testing / proximity detection for hover
    let closestId: string | null = null;
    let minDistance = 1.35; // Selection hit radius in 3D units

    for (const obj of storeState.objects) {
      const dx = obj.position[0] - pointerX;
      const dy = obj.position[1] - pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        closestId = obj.id;
      }
    }

    spatialStore.updatePointer({
      active: true,
      position: [pointerX, pointerY, pointerZ],
      rawPosition: [indexTip.x, indexTip.y, indexTip.z ?? 0],
      targetedObjectId: closestId,
      handIndex: 0,
    });

    if (!currentGrabbedId) {
      spatialStore.hoverObject(closestId);
    }
  }

  private handleGesture = (event: GestureEvent) => {
    const storeState = spatialStore.getState();
    const now = event.timestamp;

    switch (event.type) {
      case 'V_SIGN': {
        // Switch between MANIPULATE and NAVIGATE mode with debounce
        if (event.phase === 'started' && now - this.lastModeToggleTime > 800) {
          this.lastModeToggleTime = now;
          const nextMode =
            storeState.spatialMode === 'MANIPULATE' ? 'NAVIGATE' : 'MANIPULATE';
          spatialStore.setSpatialMode(nextMode);
        }
        break;
      }

      case 'OPEN_PALM': {
        // Toggle contextual radial interface
        if (event.phase === 'started' && now - this.lastPalmToggleTime > 700) {
          this.lastPalmToggleTime = now;
          spatialStore.setRadialMenuOpen(!storeState.radialMenuOpen);
        }
        break;
      }

      case 'THUMBS_UP': {
        // Confirm action or cycle color of currently selected object
        if (
          event.phase === 'started' &&
          storeState.selectedObjectId &&
          now - this.lastThumbsUpTime > 600
        ) {
          this.lastThumbsUpTime = now;
          spatialStore.cycleObjectColor(storeState.selectedObjectId);
        }
        break;
      }

      case 'TWO_HAND_EXPANSION': {
        // Scale selected object
        if (storeState.selectedObjectId && event.metadata?.scaleMultiplier) {
          spatialStore.updateObjectScale(
            storeState.selectedObjectId,
            event.metadata.scaleMultiplier
          );
        }
        break;
      }

      case 'POINT': {
        // Pointing: if hovering over an object, ensure it's prioritized
        if (storeState.hoveredObjectId && !storeState.selectedObjectId) {
          spatialStore.selectObject(storeState.hoveredObjectId);
        }
        break;
      }

      default:
        break;
    }
  };

  private handlePinch = (event: PinchEvent) => {
    const storeState = spatialStore.getState();

    if (event.phase === 'started') {
      spatialStore.updatePointer({ pinchActive: true });

      // If pointing/hovering at an object, select and grab it
      const targetId = storeState.hoveredObjectId || storeState.pointer.targetedObjectId;
      if (targetId) {
        spatialStore.selectObject(targetId);
        spatialStore.grabObject(targetId);
      }
    } else if (event.phase === 'released') {
      spatialStore.updatePointer({ pinchActive: false });
      if (storeState.grabbedObjectId) {
        spatialStore.grabObject(null);
      }
    }
  };

  private handleHandLost = (_handIndex: number) => {
    const storeState = spatialStore.getState();
    if (storeState.grabbedObjectId) {
      spatialStore.grabObject(null);
    }
    spatialStore.updatePointer({ active: false, pinchActive: false, targetedObjectId: null });
    spatialStore.hoverObject(null);
  };

  public destroy() {
    if (this.unsubscribeGesture) this.unsubscribeGesture();
    if (this.unsubscribePinch) this.unsubscribePinch();
    if (this.unsubscribeHandLost) this.unsubscribeHandLost();
  }
}

export const spatialInteractionManager = new SpatialInteractionManager();

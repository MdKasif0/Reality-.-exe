import { BoundingBox2D, TargetingReticleState } from '../types';

export class PhysicalObjectSelector {
  private reticleState: TargetingReticleState = {
    active: false,
    position: { x: 0.5, y: 0.5 },
    box: { x: 0.35, y: 0.35, width: 0.3, height: 0.3 },
    isAdjusting: false,
    estimatedLabel: 'Target Region',
  };

  private listeners: Set<(state: TargetingReticleState) => void> = new Set();

  public getState(): TargetingReticleState {
    return { ...this.reticleState, box: { ...this.reticleState.box } };
  }

  public subscribe(listener: (state: TargetingReticleState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getState();
    this.listeners.forEach((l) => l(current));
  }

  public setActive(active: boolean) {
    this.reticleState.active = active;
    this.notify();
  }

  /**
   * Updates position from hand pointer (index finger tip normalized [0, 1])
   * Only updates if the user is not manually adjusting the box with a mouse
   */
  public updateFromPointer(normX: number, normY: number, mirrored: boolean = true) {
    if (!this.reticleState.active || this.reticleState.isAdjusting) return;

    // Convert mirrored screen X to video normalized space if needed
    const actualX = mirrored ? 1 - normX : normX;
    const actualY = normY;

    const width = this.reticleState.box.width;
    const height = this.reticleState.box.height;

    // Center box around finger pointer
    const boxX = Math.max(0, Math.min(1 - width, actualX - width / 2));
    const boxY = Math.max(0, Math.min(1 - height, actualY - height / 2));

    this.reticleState.position = { x: actualX, y: actualY };
    this.reticleState.box = {
      x: boxX,
      y: boxY,
      width,
      height,
    };
    this.notify();
  }

  /**
   * Sets target center directly via screen tap/click
   */
  public setTargetAt(normX: number, normY: number) {
    const width = this.reticleState.box.width;
    const height = this.reticleState.box.height;

    const boxX = Math.max(0, Math.min(1 - width, normX - width / 2));
    const boxY = Math.max(0, Math.min(1 - height, normY - height / 2));

    this.reticleState.position = { x: normX, y: normY };
    this.reticleState.box = { x: boxX, y: boxY, width, height };
    this.reticleState.active = true;
    this.notify();
  }

  /**
   * Manual adjustment of bounding box by user dragging handles
   */
  public adjustBox(newBox: Partial<BoundingBox2D>, isAdjusting: boolean = false) {
    this.reticleState.isAdjusting = isAdjusting;
    this.reticleState.box = {
      x: Math.max(0, Math.min(0.9, newBox.x ?? this.reticleState.box.x)),
      y: Math.max(0, Math.min(0.9, newBox.y ?? this.reticleState.box.y)),
      width: Math.max(0.1, Math.min(0.9, newBox.width ?? this.reticleState.box.width)),
      height: Math.max(0.1, Math.min(0.9, newBox.height ?? this.reticleState.box.height)),
    };
    this.notify();
  }
}

export const physicalObjectSelector = new PhysicalObjectSelector();

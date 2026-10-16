import { useSyncExternalStore } from 'react';
import {
  BackgroundMode,
  GeometryType,
  Pointer3DState,
  SettingsState,
  SpatialMode,
  Stroke3D,
  UndoAction,
  VirtualObject,
} from '../types';

interface SpatialStoreState {
  objects: VirtualObject[];
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  grabbedObjectId: string | null;
  spatialMode: SpatialMode;
  backgroundMode: BackgroundMode;
  radialMenuOpen: boolean;
  scanPanelOpen: boolean;
  askPanelOpen: boolean;
  contextMenuTargetId: string | null;
  strokes: Stroke3D[];
  activeStroke: Stroke3D | null;
  undoStack: UndoAction[];
  pointer: Pointer3DState;
  settings: SettingsState;
  onboardingActive: boolean;
}

const DEFAULT_OBJECTS: VirtualObject[] = [
  {
    id: 'obj-1',
    name: 'Quantum Cube',
    type: 'cube',
    position: [-2.2, 0.4, 0],
    rotation: [0.2, 0.4, 0],
    scale: [1, 1, 1],
    color: '#00f0ff',
    emissive: '#003344',
    animation: 'float',
  },
  {
    id: 'obj-2',
    name: 'Neural Sphere',
    type: 'sphere',
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: '#38bdf8',
    emissive: '#0c4a6e',
    animation: 'pulse',
  },
  {
    id: 'obj-3',
    name: 'Torus Ring',
    type: 'ring',
    position: [2.2, 0.4, 0],
    rotation: [0.6, 0.2, 0],
    scale: [1.1, 1.1, 1.1],
    color: '#a5f3fc',
    emissive: '#083344',
    animation: 'spin',
  },
  {
    id: 'obj-4',
    name: 'Prism Octahedron',
    type: 'octahedron',
    position: [0, -1.5, 0.5],
    rotation: [0.3, 0.5, 0.1],
    scale: [0.9, 0.9, 0.9],
    color: '#22d3ee',
    emissive: '#164e63',
    animation: 'float',
  },
];

const PALETTE = ['#00f0ff', '#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24', '#f8fafc'];

class SpatialStore {
  private state: SpatialStoreState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    let savedSettings: Partial<SettingsState> = {};
    try {
      const persisted = localStorage.getItem('reality_exe_settings');
      if (persisted) savedSettings = JSON.parse(persisted);
    } catch (e) {
      console.warn('Could not read settings from localStorage:', e);
    }

    this.state = {
      objects: DEFAULT_OBJECTS,
      selectedObjectId: 'obj-2',
      hoveredObjectId: null,
      grabbedObjectId: null,
      spatialMode: 'MANIPULATE',
      backgroundMode: 'camera',
      radialMenuOpen: false,
      scanPanelOpen: false,
      askPanelOpen: false,
      contextMenuTargetId: null,
      strokes: [],
      activeStroke: null,
      undoStack: [],
      pointer: {
        active: false,
        position: [0, 0, 0],
        rawPosition: [0, 0, 0],
        pinchActive: false,
        targetedObjectId: null,
        handIndex: 0,
      },
      settings: {
        backgroundMode: 'camera',
        smoothingFactor: 0.65,
        pinchThreshold: 0.32,
        showDebugLandmarks: false,
        soundEffects: true,
        reducedMotion: false,
        mirrorCamera: true,
        ...savedSettings,
      },
      onboardingActive: false,
    };
  }

  public getState(): SpatialStoreState {
    return this.state;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public selectObject(id: string | null) {
    if (this.state.selectedObjectId === id) return;
    this.state = {
      ...this.state,
      selectedObjectId: id,
      contextMenuTargetId: id ? this.state.contextMenuTargetId : null,
      objects: this.state.objects.map((obj) => ({
        ...obj,
        selected: obj.id === id,
      })),
    };
    this.notify();
  }

  public hoverObject(id: string | null) {
    if (this.state.hoveredObjectId === id) return;
    this.state = {
      ...this.state,
      hoveredObjectId: id,
      objects: this.state.objects.map((obj) => ({
        ...obj,
        hovered: obj.id === id,
      })),
    };
    this.notify();
  }

  public grabObject(id: string | null) {
    if (this.state.grabbedObjectId === id) return;
    this.state = {
      ...this.state,
      grabbedObjectId: id,
      objects: this.state.objects.map((obj) => ({
        ...obj,
        grabbed: obj.id === id,
      })),
    };
    this.notify();
  }

  public updatePointer(pointer: Partial<Pointer3DState>) {
    this.state = {
      ...this.state,
      pointer: {
        ...this.state.pointer,
        ...pointer,
      },
    };
    this.notify();
  }

  public updateObjectPosition(id: string, position: [number, number, number]) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) =>
        obj.id === id ? { ...obj, position } : obj
      ),
    };
    this.notify();
  }

  public updateObjectRotation(id: string, rotation: [number, number, number]) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) =>
        obj.id === id ? { ...obj, rotation } : obj
      ),
    };
    this.notify();
  }

  public rotateObjectBy(id: string, deltaY: number, deltaZ: number = 0) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          rotation: [
            obj.rotation[0],
            obj.rotation[1] + deltaY,
            obj.rotation[2] + deltaZ,
          ],
        };
      }),
    };
    this.notify();
  }

  public updateObjectScale(id: string, multiplier: number) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        const currentScale = obj.scale[0];
        const newScale = Math.max(0.3, Math.min(3.5, currentScale * multiplier));
        return {
          ...obj,
          scale: [newScale, newScale, newScale] as [number, number, number],
        };
      }),
    };
    this.notify();
  }

  public cycleObjectColor(id: string) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        const currentIndex = PALETTE.indexOf(obj.color);
        const nextColor = PALETTE[(currentIndex + 1) % PALETTE.length];
        return { ...obj, color: nextColor };
      }),
    };
    this.notify();
  }

  public applyObjectAnimation(
    id: string,
    animation: 'float' | 'spin' | 'pulse' | 'orbit' | 'none'
  ) {
    this.state = {
      ...this.state,
      objects: this.state.objects.map((obj) =>
        obj.id === id ? { ...obj, animation } : obj
      ),
    };
    this.notify();
  }

  public duplicateObject(id: string): VirtualObject | null {
    const original = this.state.objects.find((o) => o.id === id);
    if (!original) return null;

    const newId = `obj-copy-${Date.now()}`;
    const copy: VirtualObject = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      position: [
        original.position[0] + 0.6,
        original.position[1] + 0.2,
        original.position[2] + 0.2,
      ],
      selected: true,
    };

    this.spawnDirectObject(copy);
    return copy;
  }

  public spawnObject(type: GeometryType) {
    const id = `obj-${Date.now()}`;
    const nameMap: Record<GeometryType, string> = {
      cube: 'Voxel Matrix',
      sphere: 'Singularity',
      ring: 'Orbital Ring',
      octahedron: 'Hyper Prism',
      torus: 'Flux Field',
      cylinder: 'Core Column',
      cone: 'Hyper Cone',
    };

    const offset = (this.state.objects.length % 5) - 2;
    const newObj: VirtualObject = {
      id,
      name: `${nameMap[type] || 'Spatial Unit'} #${this.state.objects.length + 1}`,
      type,
      position: [offset * 1.2, 0.2 + (Math.random() * 0.6 - 0.3), 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: PALETTE[this.state.objects.length % PALETTE.length],
      emissive: '#042f2e',
      animation: 'float',
      selected: true,
    };

    this.spawnDirectObject(newObj);
  }

  public spawnDirectObject(object: VirtualObject) {
    this.pushUndo({
      id: `undo-${Date.now()}`,
      type: 'CREATE',
      objectId: object.id,
      previousState: null,
      nextState: object,
      timestamp: Date.now(),
    });

    this.state = {
      ...this.state,
      objects: [...this.state.objects.map((o) => ({ ...o, selected: false })), object],
      selectedObjectId: object.id,
    };
    this.notify();
  }

  public deleteSelectedObject() {
    if (!this.state.selectedObjectId) return;
    const target = this.state.objects.find((o) => o.id === this.state.selectedObjectId);
    if (target) {
      this.pushUndo({
        id: `undo-${Date.now()}`,
        type: 'DELETE',
        objectId: target.id,
        previousState: target,
        nextState: null,
        timestamp: Date.now(),
      });
    }

    const remaining = this.state.objects.filter(
      (obj) => obj.id !== this.state.selectedObjectId
    );
    this.state = {
      ...this.state,
      objects: remaining,
      selectedObjectId: remaining.length > 0 ? remaining[0].id : null,
      grabbedObjectId: null,
      contextMenuTargetId: null,
    };
    this.notify();
  }

  // Air Drawing Stroke Management
  public addStrokePoint(pos: [number, number, number], color: string = '#00f0ff') {
    if (!this.state.activeStroke) {
      const newStroke: Stroke3D = {
        id: `stroke-${Date.now()}`,
        points: [{ position: pos, timestamp: Date.now(), color }],
        color,
        createdAt: Date.now(),
      };
      this.state = { ...this.state, activeStroke: newStroke };
    } else {
      const updatedPoints = [
        ...this.state.activeStroke.points,
        { position: pos, timestamp: Date.now(), color },
      ];
      this.state = {
        ...this.state,
        activeStroke: { ...this.state.activeStroke, points: updatedPoints },
      };
    }
    this.notify();
  }

  public finishActiveStroke() {
    if (this.state.activeStroke && this.state.activeStroke.points.length > 2) {
      this.state = {
        ...this.state,
        strokes: [...this.state.strokes, this.state.activeStroke],
        activeStroke: null,
      };
      this.notify();
    } else {
      this.state = { ...this.state, activeStroke: null };
      this.notify();
    }
  }

  public clearStrokes() {
    this.state = { ...this.state, strokes: [], activeStroke: null };
    this.notify();
  }

  // Undo System (Phase 6 Requirement 10)
  public pushUndo(action: UndoAction) {
    this.state = {
      ...this.state,
      undoStack: [action, ...this.state.undoStack.slice(0, 20)],
    };
  }

  public undoLastAction() {
    if (this.state.undoStack.length === 0) return;
    const [action, ...remainingUndo] = this.state.undoStack;

    switch (action.type) {
      case 'CREATE': {
        this.state = {
          ...this.state,
          objects: this.state.objects.filter((o) => o.id !== action.objectId),
          selectedObjectId: null,
          undoStack: remainingUndo,
        };
        break;
      }
      case 'DELETE': {
        if (action.previousState) {
          this.state = {
            ...this.state,
            objects: [...this.state.objects, action.previousState],
            selectedObjectId: action.previousState.id,
            undoStack: remainingUndo,
          };
        }
        break;
      }
      default:
        this.state = { ...this.state, undoStack: remainingUndo };
        break;
    }
    this.notify();
  }

  public resetScene() {
    this.state = {
      ...this.state,
      objects: DEFAULT_OBJECTS,
      selectedObjectId: 'obj-2',
      grabbedObjectId: null,
      hoveredObjectId: null,
      contextMenuTargetId: null,
      strokes: [],
      activeStroke: null,
    };
    this.notify();
  }

  public setSpatialMode(spatialMode: SpatialMode) {
    this.state = { ...this.state, spatialMode };
    this.notify();
  }

  public setBackgroundMode(backgroundMode: BackgroundMode) {
    this.state = {
      ...this.state,
      backgroundMode,
      settings: { ...this.state.settings, backgroundMode },
    };
    this.notify();
  }

  public setRadialMenuOpen(radialMenuOpen: boolean) {
    this.state = { ...this.state, radialMenuOpen };
    this.notify();
  }

  public setScanPanelOpen(scanPanelOpen: boolean) {
    this.state = { ...this.state, scanPanelOpen };
    this.notify();
  }

  public setAskPanelOpen(askPanelOpen: boolean) {
    this.state = { ...this.state, askPanelOpen };
    this.notify();
  }

  public setContextMenuTarget(id: string | null) {
    this.state = { ...this.state, contextMenuTargetId: id };
    this.notify();
  }

  public setOnboardingActive(onboardingActive: boolean) {
    this.state = { ...this.state, onboardingActive };
    this.notify();
  }

  public updateSettings(settings: Partial<SettingsState>) {
    const updated = { ...this.state.settings, ...settings };
    this.state = {
      ...this.state,
      settings: updated,
      backgroundMode: updated.backgroundMode ?? this.state.backgroundMode,
    };
    try {
      localStorage.setItem('reality_exe_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }
    this.notify();
  }
}

export const spatialStore = new SpatialStore();

export function useSpatialStore(): SpatialStoreState {
  return useSyncExternalStore(spatialStore.subscribe, () => spatialStore.getState());
}

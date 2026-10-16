export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right';

export interface HandData {
  handedness: Handedness;
  score: number;
  landmarks: Landmark3D[];
  smoothedLandmarks: Landmark3D[];
  worldLandmarks?: Landmark3D[];
}

export type GestureType =
  | 'IDLE'
  | 'OPEN_PALM'
  | 'PINCH'
  | 'POINT'
  | 'FIST'
  | 'V_SIGN'
  | 'THUMBS_UP'
  | 'TWO_HAND_EXPANSION'
  | 'AIR_CIRCLE'
  | 'AIR_DRAW';

export type GesturePhase = 'started' | 'held' | 'ended';

export interface GestureEvent {
  type: GestureType;
  phase: GesturePhase;
  handIndex: number;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PinchEvent {
  phase: 'started' | 'moved' | 'released';
  position: Landmark3D;
  distance: number;
  handIndex: number;
  timestamp: number;
}

export type SpatialMode = 'MANIPULATE' | 'NAVIGATE' | 'INSPECT' | 'SCAN_REALITY' | 'AIR_DRAW';

export type BackgroundMode = 'camera' | 'dark' | 'minimal';

export type GeometryType = 'cube' | 'sphere' | 'ring' | 'octahedron' | 'torus' | 'cylinder' | 'cone';

export interface VirtualObject {
  id: string;
  name: string;
  type: GeometryType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  emissive: string;
  wireframe?: boolean;
  selected?: boolean;
  hovered?: boolean;
  grabbed?: boolean;
  animation?: 'float' | 'spin' | 'pulse' | 'orbit' | 'none';
  metadata?: Record<string, any>;
}

export * from './ai';


export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error' | 'stopped';

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  deviceId: string | null;
  resolution: { width: number; height: number };
  error: string | null;
  isMirrored: boolean;
}

export type VisionEngineStatus = 'uninitialized' | 'loading' | 'ready' | 'error';

export interface VisionState {
  status: VisionEngineStatus;
  progress: number;
  statusMessage: string;
  hands: HandData[];
  activeGesture: GestureType;
  gestureConfidence: number;
  fps: number;
  debugMode: boolean;
  paused: boolean;
  latencyMs: number;
}

export interface SettingsState {
  backgroundMode: BackgroundMode;
  smoothingFactor: number;
  pinchThreshold: number;
  showDebugLandmarks: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
  mirrorCamera: boolean;
}

export interface Pointer3DState {
  active: boolean;
  position: [number, number, number];
  rawPosition: [number, number, number];
  pinchActive: boolean;
  targetedObjectId: string | null;
  handIndex: number;
}

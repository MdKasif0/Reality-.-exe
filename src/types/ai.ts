import { GeometryType } from './index';

export type AIProviderType = 'gemini' | 'openai' | 'proxy' | 'simulated';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  enabled: boolean;
  temperature?: number;
}

export interface BoundingBox2D {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  width: number; // Normalized [0, 1]
  height: number; // Normalized [0, 1]
}

export interface RealityScanResult {
  id: string;
  timestamp: number;
  objectName: string;
  category: string;
  shortDescription: string;
  visibleAttributes: string[];
  materialEstimate: string;
  potentialUseCases: string[];
  interestingFacts: string[];
  confidenceNote: string;
  suggestedInteractions: string[];
  conciseSummary: string;
  boundingBox?: BoundingBox2D;
  thumbnailDataUrl?: string;
  suggested3DSpec?: AISpawnObjectSpec;
}

export interface AskRealityMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  attachedImage?: string;
  relatedScanId?: string;
}

export type AnimationType = 'float' | 'spin' | 'pulse' | 'orbit' | 'none';

export interface AISpawnObjectSpec {
  type: GeometryType;
  name: string;
  description: string;
  scale: [number, number, number];
  color: string;
  emissive: string;
  wireframe: boolean;
  animation: AnimationType;
  metadata?: Record<string, any>;
}

export interface SessionSceneObject {
  id: string;
  label: string;
  category: string;
  screenRegion: BoundingBox2D;
  description: string;
  thumbnail: string;
  createdVirtualObjectIds: string[];
  timestamp: number;
}

export interface TargetingReticleState {
  active: boolean;
  position: { x: number; y: number }; // Normalized [0, 1]
  box: BoundingBox2D;
  isAdjusting: boolean;
  estimatedLabel?: string;
  confidence?: number;
}

export interface StrokePoint3D {
  position: [number, number, number];
  timestamp: number;
  color?: string;
}

export interface Stroke3D {
  id: string;
  points: StrokePoint3D[];
  color: string;
  createdAt: number;
}

export type UndoActionType = 'CREATE' | 'MOVE' | 'SCALE' | 'ROTATE' | 'DELETE' | 'COLOR';

export interface UndoAction {
  id: string;
  type: UndoActionType;
  objectId: string;
  previousState: any;
  nextState: any;
  timestamp: number;
}

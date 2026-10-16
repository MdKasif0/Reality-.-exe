import { spatialStore } from '../store/useSpatialStore';
import { BackgroundMode, GeometryType, VirtualObject } from '../types';

export interface SceneSnapshotData {
  version: string;
  name: string;
  timestamp: number;
  environment: {
    backgroundMode: BackgroundMode;
  };
  objects: Array<{
    id: string;
    name: string;
    type: GeometryType;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    emissive: string;
    wireframe?: boolean;
    animation?: 'float' | 'spin' | 'pulse' | 'orbit' | 'none';
    metadata?: Record<string, any>;
  }>;
}

const VALID_GEOMETRIES: Set<GeometryType> = new Set([
  'cube',
  'sphere',
  'ring',
  'octahedron',
  'torus',
  'cylinder',
  'cone',
]);

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export class SceneSerializer {
  /**
   * Serialize current workspace objects and environment into structured JSON
   */
  public static exportScene(sceneName: string = 'Spatial Desktop'): SceneSnapshotData {
    const state = spatialStore.getState();

    const cleanObjects = state.objects.map((obj) => ({
      id: obj.id,
      name: String(obj.name).slice(0, 40).replace(/[<>'"&]/g, ''),
      type: obj.type,
      position: [
        Number(obj.position[0]) || 0,
        Number(obj.position[1]) || 0,
        Number(obj.position[2]) || 0,
      ] as [number, number, number],
      rotation: [
        Number(obj.rotation[0]) || 0,
        Number(obj.rotation[1]) || 0,
        Number(obj.rotation[2]) || 0,
      ] as [number, number, number],
      scale: [
        Math.max(0.3, Math.min(3.5, Number(obj.scale[0]) || 1)),
        Math.max(0.3, Math.min(3.5, Number(obj.scale[1]) || 1)),
        Math.max(0.3, Math.min(3.5, Number(obj.scale[2]) || 1)),
      ] as [number, number, number],
      color: HEX_COLOR_REGEX.test(obj.color) ? obj.color : '#00f0ff',
      emissive: HEX_COLOR_REGEX.test(obj.emissive) ? obj.emissive : '#003344',
      wireframe: Boolean(obj.wireframe),
      animation: obj.animation || 'float',
      metadata: {
        exportedAt: Date.now(),
        isAIGenerated: Boolean(obj.metadata?.isAIGenerated),
      },
    }));

    return {
      version: '1.0.0',
      name: sceneName.slice(0, 50),
      timestamp: Date.now(),
      environment: {
        backgroundMode: state.backgroundMode,
      },
      objects: cleanObjects,
    };
  }

  /**
   * Triggers client-side download of the exported JSON file
   */
  public static exportToFile(sceneName: string = 'RealityScene') {
    const data = this.exportScene(sceneName);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `reality-scene-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates imported JSON string with strict schema and boundary verification
   */
  public static validateAndParse(jsonString: string): {
    valid: boolean;
    data?: SceneSnapshotData;
    error?: string;
  } {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { valid: false, error: 'Empty or invalid file content.' };
      }

      // Check for prototype pollution attempt
      if (jsonString.includes('__proto__') || jsonString.includes('constructor')) {
        return { valid: false, error: 'Security violation: Disallowed properties in scene file.' };
      }

      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Invalid JSON structure.' };
      }

      if (!Array.isArray(parsed.objects)) {
        return { valid: false, error: 'Invalid scene file: missing objects array.' };
      }

      const sanitizedObjects: VirtualObject[] = [];

      for (let i = 0; i < parsed.objects.length; i++) {
        const item = parsed.objects[i];
        if (!item || typeof item !== 'object') continue;

        if (!VALID_GEOMETRIES.has(item.type)) {
          return {
            valid: false,
            error: `Security validation error: Unsupported geometry type "${item.type}".`,
          };
        }

        const geomType: GeometryType = item.type;

        const position: [number, number, number] = [
          Math.max(-5.0, Math.min(5.0, Number(item.position?.[0]) || 0)),
          Math.max(-3.5, Math.min(3.5, Number(item.position?.[1]) || 0)),
          Math.max(-2.5, Math.min(2.5, Number(item.position?.[2]) || 0)),
        ];

        const scale: [number, number, number] = [
          Math.max(0.3, Math.min(3.5, Number(item.scale?.[0]) || 1)),
          Math.max(0.3, Math.min(3.5, Number(item.scale?.[1]) || 1)),
          Math.max(0.3, Math.min(3.5, Number(item.scale?.[2]) || 1)),
        ];

        const color = HEX_COLOR_REGEX.test(item.color) ? item.color : '#00f0ff';
        const emissive = HEX_COLOR_REGEX.test(item.emissive) ? item.emissive : '#003344';
        const animation = ['float', 'spin', 'pulse', 'orbit', 'none'].includes(item.animation)
          ? item.animation
          : 'float';

        sanitizedObjects.push({
          id: `restored-obj-${i}-${Date.now()}`,
          name: String(item.name || `Object #${i + 1}`).slice(0, 32).replace(/[<>'"&]/g, ''),
          type: geomType,
          position,
          rotation: [0, 0, 0],
          scale,
          color,
          emissive,
          wireframe: Boolean(item.wireframe),
          animation,
          metadata: {
            restoredFrom: parsed.name || 'Imported Scene',
            restoredAt: Date.now(),
          },
        });
      }

      if (sanitizedObjects.length === 0) {
        return { valid: false, error: 'No valid objects found in scene file.' };
      }

      const snapshot: SceneSnapshotData = {
        version: parsed.version || '1.0.0',
        name: String(parsed.name || 'Restored Scene').slice(0, 50),
        timestamp: parsed.timestamp || Date.now(),
        environment: {
          backgroundMode: ['camera', 'dark', 'minimal'].includes(parsed.environment?.backgroundMode)
            ? parsed.environment.backgroundMode
            : 'camera',
        },
        objects: sanitizedObjects,
      };

      return { valid: true, data: snapshot };
    } catch (e: any) {
      return { valid: false, error: `Malformed JSON: ${e.message}` };
    }
  }

  /**
   * Imports and applies a scene snapshot into the workspace
   */
  public static importScene(jsonString: string): { success: boolean; count: number; error?: string } {
    const result = this.validateAndParse(jsonString);
    if (!result.valid || !result.data) {
      return { success: false, count: 0, error: result.error || 'Failed to import scene.' };
    }

    spatialStore.setObjects(result.data.objects as VirtualObject[]);
    if (result.data.environment.backgroundMode) {
      spatialStore.setBackgroundMode(result.data.environment.backgroundMode);
    }

    return { success: true, count: result.data.objects.length };
  }
}

export const exportScene = (
  objectsOrName?: VirtualObject[] | string,
  sceneName: string = 'Spatial Desktop'
): string => {
  let name = typeof objectsOrName === 'string' ? objectsOrName : sceneName;
  const data = SceneSerializer.exportScene(name);

  if (Array.isArray(objectsOrName)) {
    data.objects = objectsOrName.map((obj) => ({
      id: obj.id,
      name: String(obj.name).slice(0, 40),
      type: obj.type,
      position: [obj.position[0] || 0, obj.position[1] || 0, obj.position[2] || 0],
      rotation: [obj.rotation[0] || 0, obj.rotation[1] || 0, obj.rotation[2] || 0],
      scale: [
        Number(Array.isArray(obj.scale) ? obj.scale[0] : obj.scale) || 1,
        Number(Array.isArray(obj.scale) ? obj.scale[1] : obj.scale) || 1,
        Number(Array.isArray(obj.scale) ? obj.scale[2] : obj.scale) || 1,
      ],
      color: obj.color || '#00f0ff',
      emissive: obj.emissive || '#003344',
      animation: obj.animation || 'float',
    }));
  }

  return JSON.stringify(data, null, 2);
};

export const validateAndParse = (jsonString: string) => {
  const res = SceneSerializer.validateAndParse(jsonString);
  return {
    ...res,
    success: res.valid,
  };
};


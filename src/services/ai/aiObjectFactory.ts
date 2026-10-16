import { spatialStore } from '../../store/useSpatialStore';
import { AISpawnObjectSpec, GeometryType, VirtualObject } from '../../types';

export class AIObjectFactory {
  private static VALID_GEOMETRIES: Set<GeometryType> = new Set([
    'cube',
    'sphere',
    'ring',
    'octahedron',
    'torus',
    'cylinder',
    'cone',
  ]);

  private static HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

  /**
   * Validates an AI-generated object specification and safely injects
   * a corresponding 3D VirtualObject into the spatial workspace.
   */
  public static spawnFromSpec(
    spec: Partial<AISpawnObjectSpec>,
    preferredPosition?: [number, number, number]
  ): VirtualObject {
    // 1. Validate and sanitize geometry type
    let geometryType: GeometryType = 'sphere';
    if (spec.type && this.VALID_GEOMETRIES.has(spec.type as GeometryType)) {
      geometryType = spec.type as GeometryType;
    }

    // 2. Validate scale with strict clamp [0.3, 3.5]
    let scale: [number, number, number] = [1, 1, 1];
    if (Array.isArray(spec.scale) && spec.scale.length === 3) {
      scale = [
        Math.max(0.3, Math.min(3.5, Number(spec.scale[0]) || 1)),
        Math.max(0.3, Math.min(3.5, Number(spec.scale[1]) || 1)),
        Math.max(0.3, Math.min(3.5, Number(spec.scale[2]) || 1)),
      ];
    }

    // 3. Sanitize color & emissive hex
    const color = spec.color && this.HEX_COLOR_REGEX.test(spec.color)
      ? spec.color
      : '#00f0ff';

    const emissive = spec.emissive && this.HEX_COLOR_REGEX.test(spec.emissive)
      ? spec.emissive
      : '#003344';

    // 4. Sanitize strings (avoid script injection)
    const rawName = String(spec.name || `Synthetic ${geometryType}`).slice(0, 32);
    const cleanName = rawName.replace(/[<>'"&]/g, '');

    // Stagger position if none provided
    const storeState = spatialStore.getState();
    const count = storeState.objects.length;
    const defaultX = ((count % 5) - 2) * 1.3;
    const position: [number, number, number] = preferredPosition || [defaultX, 0.4, 0];

    // 5. Instantiate VirtualObject
    const newObj: VirtualObject = {
      id: `ai-obj-${Date.now()}`,
      name: cleanName,
      type: geometryType,
      position,
      rotation: [0, 0, 0],
      scale,
      color,
      emissive,
      wireframe: Boolean(spec.wireframe),
      animation: spec.animation || 'float',
      selected: true,
      metadata: {
        isAIGenerated: true,
        sourceDescription: spec.description?.slice(0, 140),
        generatedAt: Date.now(),
      },
    };

    spatialStore.spawnDirectObject(newObj);
    return newObj;
  }
}

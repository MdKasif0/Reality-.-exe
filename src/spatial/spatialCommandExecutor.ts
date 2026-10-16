import { spatialStore } from '../store/useSpatialStore';
import { GeometryType } from '../types';

export type SpatialCommandType =
  | 'SPAWN'
  | 'SCALE'
  | 'ROTATE'
  | 'COLOR'
  | 'DUPLICATE'
  | 'DELETE'
  | 'RESET'
  | 'MODE'
  | 'UNKNOWN';

export interface SpatialCommandResult {
  success: boolean;
  type: SpatialCommandType;
  message: string;
  requiresConfirmation?: boolean;
}

export const executeSpatialCommand = (rawCommand: string): SpatialCommandResult =>
  SpatialCommandExecutor.execute(rawCommand);

export class SpatialCommandExecutor {
  /**
   * Deterministic local natural-language command interpreter
   */
  public static execute(rawCommand: string): SpatialCommandResult {
    const cmd = rawCommand.trim().toLowerCase();
    if (!cmd) {
      return { success: false, type: 'UNKNOWN', message: 'Command is empty.' };
    }

    const state = spatialStore.getState();
    const selectedId = state.selectedObjectId;

    // 1. Reset Scene
    if (cmd.includes('reset scene') || cmd.includes('clear scene') || cmd === 'reset') {
      spatialStore.resetScene();
      return {
        success: true,
        type: 'RESET',
        message: 'Spatial workspace reset to default configuration.',
      };
    }

    // 2. Clear Air Drawing Strokes
    if (cmd.includes('clear stroke') || cmd.includes('clear drawing') || cmd.includes('erase drawing')) {
      spatialStore.clearStrokes();
      return {
        success: true,
        type: 'RESET',
        message: 'Cleared all 3D air drawing strokes.',
      };
    }

    // 3. Delete Selected Object
    if (
      cmd.includes('delete') ||
      cmd.includes('remove') ||
      cmd.includes('destroy') ||
      cmd.includes('trash')
    ) {
      if (!selectedId) {
        return {
          success: false,
          type: 'DELETE',
          message: 'No virtual object is currently selected to delete.',
        };
      }
      spatialStore.deleteSelectedObject();
      return {
        success: true,
        type: 'DELETE',
        message: 'Selected virtual object removed.',
      };
    }

    // 4. Duplicate Selected Object
    if (cmd.includes('duplicate') || cmd.includes('clone') || cmd.includes('copy')) {
      if (!selectedId) {
        return {
          success: false,
          type: 'DUPLICATE',
          message: 'No virtual object is currently selected to duplicate.',
        };
      }
      const copy = spatialStore.duplicateObject(selectedId);
      return {
        success: true,
        type: 'DUPLICATE',
        message: copy ? `Duplicated as ${copy.name}.` : 'Failed to duplicate.',
      };
    }

    // 5. Scale Selected Object
    if (
      cmd.includes('larger') ||
      cmd.includes('bigger') ||
      cmd.includes('scale up') ||
      cmd.includes('grow') ||
      cmd.includes('expand')
    ) {
      if (!selectedId) {
        return { success: false, type: 'SCALE', message: 'No object selected to scale.' };
      }
      spatialStore.updateObjectScale(selectedId, 1.25);
      return { success: true, type: 'SCALE', message: 'Scaled up active object by 25%.' };
    }

    if (
      cmd.includes('smaller') ||
      cmd.includes('shrink') ||
      cmd.includes('scale down') ||
      cmd.includes('tiny')
    ) {
      if (!selectedId) {
        return { success: false, type: 'SCALE', message: 'No object selected to scale.' };
      }
      spatialStore.updateObjectScale(selectedId, 0.8);
      return { success: true, type: 'SCALE', message: 'Scaled down active object by 20%.' };
    }

    // 6. Rotate Selected Object
    if (cmd.includes('rotate') || cmd.includes('spin') || cmd.includes('turn')) {
      if (!selectedId) {
        return { success: false, type: 'ROTATE', message: 'No object selected to rotate.' };
      }
      spatialStore.rotateObjectBy(selectedId, Math.PI / 4);
      return { success: true, type: 'ROTATE', message: 'Rotated active object 45°.' };
    }

    // 7. Change Material / Color
    if (
      cmd.includes('color') ||
      cmd.includes('material') ||
      cmd.includes('paint') ||
      cmd.includes('tint')
    ) {
      if (!selectedId) {
        return { success: false, type: 'COLOR', message: 'No object selected.' };
      }
      spatialStore.cycleObjectColor(selectedId);
      return { success: true, type: 'COLOR', message: 'Cycled material color.' };
    }

    // 8. Mode Switch
    if (cmd.includes('navigate') || cmd.includes('navigation mode')) {
      spatialStore.setSpatialMode('NAVIGATE');
      return { success: true, type: 'MODE', message: 'Switched to Navigate Mode.' };
    }
    if (cmd.includes('manipulate') || cmd.includes('manipulation mode')) {
      spatialStore.setSpatialMode('MANIPULATE');
      return { success: true, type: 'MODE', message: 'Switched to Manipulate Mode.' };
    }
    if (cmd.includes('reality scan') || cmd.includes('scan mode')) {
      spatialStore.setSpatialMode('SCAN_REALITY');
      return { success: true, type: 'MODE', message: 'Switched to Reality Scan Mode.' };
    }
    if (cmd.includes('air draw') || cmd.includes('drawing mode')) {
      spatialStore.setSpatialMode('AIR_DRAW');
      return { success: true, type: 'MODE', message: 'Switched to Air Draw Mode.' };
    }

    // 9. Spawn Primitives (e.g. "Create three floating rings", "Spawn a glowing sphere")
    const geometries: { pattern: RegExp; type: GeometryType; label: string }[] = [
      { pattern: /ring|torus ring/i, type: 'ring', label: 'Orbital Ring' },
      { pattern: /sphere|orb|globe|ball/i, type: 'sphere', label: 'Sphere' },
      { pattern: /cube|box|matrix|block/i, type: 'cube', label: 'Voxel Cube' },
      { pattern: /prism|octahedron|crystal/i, type: 'octahedron', label: 'Crystal Prism' },
      { pattern: /knot|torus knot/i, type: 'torus', label: 'Torus Knot' },
      { pattern: /cylinder|column|pillar/i, type: 'cylinder', label: 'Cylinder' },
      { pattern: /cone/i, type: 'cone', label: 'Cone' },
    ];

    for (const g of geometries) {
      if (g.pattern.test(cmd)) {
        // Check count (e.g. "three rings", "2 cubes", default 1, max 4)
        let count = 1;
        if (cmd.includes('two') || cmd.includes(' 2 ')) count = 2;
        else if (cmd.includes('three') || cmd.includes(' 3 ')) count = 3;
        else if (cmd.includes('four') || cmd.includes(' 4 ')) count = 4;

        for (let k = 0; k < count; k++) {
          spatialStore.spawnObject(g.type);
        }

        return {
          success: true,
          type: 'SPAWN',
          message: `Spawned ${count} ${g.label}${count > 1 ? 's' : ''}.`,
        };
      }
    }

    // Fallback: spawn default sphere
    spatialStore.spawnObject('sphere');
    return {
      success: true,
      type: 'SPAWN',
      message: `Created 3D holographic object based on "${rawCommand}".`,
    };
  }
}

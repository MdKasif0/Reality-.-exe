import { useEffect } from 'react';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';

interface KeyboardControlsProps {
  onToggleGuide: () => void;
  onToggleSettings: () => void;
}

export function KeyboardControls({ onToggleGuide, onToggleSettings }: KeyboardControlsProps) {
  const { selectedObjectId, objects, spatialMode } = useSpatialStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing into an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Redo with Ctrl+Y or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        spatialStore.redo();
        return;
      }

      // Undo with Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        spatialStore.undo();
        return;
      }

      const storeState = spatialStore.getState();
      const currentId = storeState.selectedObjectId;
      const currentObj = storeState.objects.find((o) => o.id === currentId);

      const STEP = e.shiftKey ? 0.35 : 0.15;

      switch (e.key) {
        // Reality Scan mode toggle with 'r' / 'R'
        case 'r':
        case 'R': {
          e.preventDefault();
          const next = storeState.spatialMode === 'SCAN_REALITY' ? 'MANIPULATE' : 'SCAN_REALITY';
          spatialStore.setSpatialMode(next);
          break;
        }

        // Air Draw mode toggle with 'q' / 'Q'
        case 'q':
        case 'Q': {
          e.preventDefault();
          const next = storeState.spatialMode === 'AIR_DRAW' ? 'MANIPULATE' : 'AIR_DRAW';
          spatialStore.setSpatialMode(next);
          break;
        }

        // Grab toggle with Spacebar
        case ' ': {
          e.preventDefault();
          if (currentId) {
            const isGrabbed = storeState.grabbedObjectId === currentId;
            spatialStore.grabObject(isGrabbed ? null : currentId);
          }
          break;
        }

        // Object movement via Arrows or WASD
        case 'ArrowLeft':
        case 'a':
        case 'A': {
          if (currentObj) {
            e.preventDefault();
            spatialStore.updateObjectPosition(currentObj.id, [
              currentObj.position[0] - STEP,
              currentObj.position[1],
              currentObj.position[2],
            ]);
          }
          break;
        }

        case 'ArrowRight':
        case 'd':
        case 'D': {
          if (currentObj) {
            e.preventDefault();
            spatialStore.updateObjectPosition(currentObj.id, [
              currentObj.position[0] + STEP,
              currentObj.position[1],
              currentObj.position[2],
            ]);
          }
          break;
        }

        case 'ArrowUp':
        case 'w':
        case 'W': {
          if (currentObj) {
            e.preventDefault();
            if (e.shiftKey) {
              // Move in Z
              spatialStore.updateObjectPosition(currentObj.id, [
                currentObj.position[0],
                currentObj.position[1],
                currentObj.position[2] - STEP,
              ]);
            } else {
              // Move in Y
              spatialStore.updateObjectPosition(currentObj.id, [
                currentObj.position[0],
                currentObj.position[1] + STEP,
                currentObj.position[2],
              ]);
            }
          }
          break;
        }

        case 'ArrowDown':
        case 's':
        case 'S': {
          if (currentObj) {
            e.preventDefault();
            if (e.shiftKey) {
              // Move in Z
              spatialStore.updateObjectPosition(currentObj.id, [
                currentObj.position[0],
                currentObj.position[1],
                currentObj.position[2] + STEP,
              ]);
            } else {
              // Move in Y
              spatialStore.updateObjectPosition(currentObj.id, [
                currentObj.position[0],
                currentObj.position[1] - STEP,
                currentObj.position[2],
              ]);
            }
          }
          break;
        }

        // Scale controls
        case '+':
        case '=': {
          if (currentId) {
            e.preventDefault();
            spatialStore.updateObjectScale(currentId, 1.15);
          }
          break;
        }

        case '-':
        case '_': {
          if (currentId) {
            e.preventDefault();
            spatialStore.updateObjectScale(currentId, 0.85);
          }
          break;
        }

        // Cycle color with 'C'
        case 'c':
        case 'C': {
          if (currentId) {
            e.preventDefault();
            spatialStore.cycleObjectColor(currentId);
          }
          break;
        }

        // Mode switch with 'M'
        case 'm':
        case 'M': {
          e.preventDefault();
          const next = spatialMode === 'MANIPULATE' ? 'NAVIGATE' : 'MANIPULATE';
          spatialStore.setSpatialMode(next);
          break;
        }

        // Cycle selection with Tab
        case 'Tab': {
          e.preventDefault();
          const all = storeState.objects;
          if (all.length > 0) {
            const idx = all.findIndex((o) => o.id === currentId);
            const nextIdx = (idx + 1) % all.length;
            spatialStore.selectObject(all[nextIdx].id);
          }
          break;
        }

        // Delete with Delete / Backspace
        case 'Delete':
        case 'Backspace': {
          if (currentId) {
            e.preventDefault();
            spatialStore.deleteSelectedObject();
          }
          break;
        }

        // Pause tracking with 'P'
        case 'p':
        case 'P': {
          e.preventDefault();
          const vision = mediaPipeService.getState();
          mediaPipeService.setPaused(!vision.paused);
          break;
        }

        // Help modal with '?'
        case '?': {
          e.preventDefault();
          onToggleGuide();
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, objects, spatialMode, onToggleGuide, onToggleSettings]);

  return null;
}

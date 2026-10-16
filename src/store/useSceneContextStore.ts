import { useSyncExternalStore } from 'react';
import { RealityScanResult, SessionSceneObject } from '../types';

interface SceneContextState {
  analyzedObjects: SessionSceneObject[];
  activeObjectContextId: string | null;
  drawerOpen: boolean;
}

class SceneContextStore {
  private state: SceneContextState = {
    analyzedObjects: [],
    activeObjectContextId: null,
    drawerOpen: false,
  };

  private listeners: Set<() => void> = new Set();

  public getState(): SceneContextState {
    return this.state;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setDrawerOpen(open: boolean) {
    this.state = { ...this.state, drawerOpen: open };
    this.notify();
  }

  public toggleDrawer() {
    this.setDrawerOpen(!this.state.drawerOpen);
  }

  public setActiveObjectContext(id: string | null) {
    this.state = { ...this.state, activeObjectContextId: id };
    this.notify();
  }

  public addFromScan(scan: RealityScanResult, createdVirtualObjectId?: string): SessionSceneObject {
    const existingIdx = this.state.analyzedObjects.findIndex(
      (o) => o.label.toLowerCase() === scan.objectName.toLowerCase()
    );

    const newObj: SessionSceneObject = {
      id: scan.id || `scene-obj-${Date.now()}`,
      label: scan.objectName,
      category: scan.category,
      screenRegion: scan.boundingBox || { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
      description: scan.conciseSummary || scan.shortDescription,
      thumbnail: scan.thumbnailDataUrl || '',
      createdVirtualObjectIds: createdVirtualObjectId ? [createdVirtualObjectId] : [],
      timestamp: scan.timestamp || Date.now(),
    };

    if (existingIdx >= 0) {
      // Update existing
      const updated = [...this.state.analyzedObjects];
      const existing = updated[existingIdx];
      updated[existingIdx] = {
        ...existing,
        description: newObj.description,
        thumbnail: newObj.thumbnail || existing.thumbnail,
        createdVirtualObjectIds: createdVirtualObjectId
          ? Array.from(new Set([...existing.createdVirtualObjectIds, createdVirtualObjectId]))
          : existing.createdVirtualObjectIds,
      };
      this.state = {
        ...this.state,
        analyzedObjects: updated,
        activeObjectContextId: existing.id,
      };
    } else {
      this.state = {
        ...this.state,
        analyzedObjects: [newObj, ...this.state.analyzedObjects],
        activeObjectContextId: newObj.id,
      };
    }

    this.notify();
    return newObj;
  }

  public renameObject(id: string, newLabel: string) {
    this.state = {
      ...this.state,
      analyzedObjects: this.state.analyzedObjects.map((obj) =>
        obj.id === id ? { ...obj, label: newLabel.trim() || obj.label } : obj
      ),
    };
    this.notify();
  }

  public removeObject(id: string) {
    this.state = {
      ...this.state,
      analyzedObjects: this.state.analyzedObjects.filter((obj) => obj.id !== id),
      activeObjectContextId:
        this.state.activeObjectContextId === id ? null : this.state.activeObjectContextId,
    };
    this.notify();
  }

  public clearContext() {
    this.state = {
      ...this.state,
      analyzedObjects: [],
      activeObjectContextId: null,
    };
    this.notify();
  }
}

export const sceneContextStore = new SceneContextStore();

export function useSceneContextStore(): SceneContextState {
  return useSyncExternalStore(sceneContextStore.subscribe, () => sceneContextStore.getState());
}

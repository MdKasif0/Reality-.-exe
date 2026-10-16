import test from 'node:test';
import assert from 'node:assert/strict';
import { spatialStore } from '../src/store/useSpatialStore';

test('Spatial Store - object spawning, selection, and renaming', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('cube');

  spatialStore.selectObject(id);
  assert.equal(spatialStore.getState().selectedObjectId, id);

  spatialStore.renameObject(id, 'Renamed Kinetic Block');
  const obj = spatialStore.getState().objects.find((o) => o.id === id);
  assert.equal(obj?.name, 'Renamed Kinetic Block');
});

test('Spatial Store - Undo and Redo stack management', () => {
  spatialStore.setObjects([]);
  assert.equal(spatialStore.getState().undoStack.length, 0);

  // Spawn object 1
  const id1 = spatialStore.spawnObject('sphere');
  assert.equal(spatialStore.getState().objects.length, 1);
  assert.ok(spatialStore.getState().undoStack.length > 0);

  // Undo spawn
  spatialStore.undo();
  assert.equal(spatialStore.getState().objects.length, 0);
  assert.ok(spatialStore.getState().redoStack.length > 0);

  // Redo spawn
  spatialStore.redo();
  assert.equal(spatialStore.getState().objects.length, 1);
  assert.equal(spatialStore.getState().objects[0].id, id1);
});

test('Spatial Store - duplication duplicates geometry and attributes', () => {
  spatialStore.setObjects([]);
  const id = spatialStore.spawnObject('torus');
  const copy = spatialStore.duplicateObject(id);

  assert.ok(copy);
  assert.notEqual(copy?.id, id);
  assert.equal(copy?.type, 'torus');
  assert.equal(spatialStore.getState().objects.length, 2);
});

test('Spatial Store - position clamping preserves boundary bounds', () => {
  spatialStore.setObjects([]);
  const id = spatialStore.spawnObject('cube');

  // Push object beyond boundary
  spatialStore.updateObjectPosition(id, [100, -200, 50]);

  const obj = spatialStore.getState().objects.find((o) => o.id === id);
  assert.ok(obj);
  // Clamped within [-4.8..4.8, -3.0..3.0, -2.5..2.5]
  assert.ok(obj.position[0] <= 4.8);
  assert.ok(obj.position[1] >= -3.0);
  assert.ok(obj.position[2] <= 2.5);
});

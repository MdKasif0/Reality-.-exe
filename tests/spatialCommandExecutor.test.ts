import test from 'node:test';
import assert from 'node:assert/strict';
import { executeSpatialCommand } from '../src/spatial/spatialCommandExecutor';
import { spatialStore } from '../src/store/useSpatialStore';

test('Spatial Command - parse and spawn glowing sphere', () => {
  spatialStore.resetScene();
  const res = executeSpatialCommand('spawn a glowing sphere');
  assert.equal(res.success, true);
  assert.equal(res.type, 'SPAWN');

  const state = spatialStore.getState();
  const sphere = state.objects.find((o) => o.type === 'sphere');
  assert.ok(sphere, 'A sphere primitive should have been spawned');
});

test('Spatial Command - parse and create multiple objects (three floating rings)', () => {
  spatialStore.resetScene();
  const res = executeSpatialCommand('create three floating rings');
  assert.equal(res.success, true);
  assert.equal(res.type, 'SPAWN');

  const state = spatialStore.getState();
  const rings = state.objects.filter((o) => o.type === 'ring' || o.type === 'torus');
  assert.ok(rings.length >= 3, 'Ring/torus primitives should be spawned');
});

test('Spatial Command - scale up / make larger on selected object', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('cube');
  spatialStore.selectObject(id);

  const initialScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale[0] ?? 1;

  const res = executeSpatialCommand('make the selected object larger');
  assert.equal(res.success, true);
  assert.equal(res.type, 'SCALE');

  const newScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale[0] ?? 1;
  assert.ok(newScale > initialScale, 'Object scale should increase');
});

test('Spatial Command - scale down / make smaller', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('cylinder');
  spatialStore.selectObject(id);

  const initialScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale[0] ?? 1;

  const res = executeSpatialCommand('make smaller');
  assert.equal(res.success, true);
  assert.equal(res.type, 'SCALE');

  const newScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale[0] ?? 1;
  assert.ok(newScale < initialScale, 'Object scale should decrease');
});

test('Spatial Command - duplicate selected object', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('octahedron');
  spatialStore.selectObject(id);

  const initialCount = spatialStore.getState().objects.length;
  const res = executeSpatialCommand('duplicate object');
  assert.equal(res.success, true);
  assert.equal(res.type, 'DUPLICATE');

  const newCount = spatialStore.getState().objects.length;
  assert.equal(newCount, initialCount + 1, 'Object count should increment by 1');
});

test('Spatial Command - reset scene resets to default baseline objects', () => {
  spatialStore.spawnObject('cone');
  spatialStore.spawnObject('torus');

  const res = executeSpatialCommand('reset the scene');
  assert.equal(res.success, true);
  assert.equal(res.type, 'RESET');

  const state = spatialStore.getState();
  assert.equal(state.objects.length, 4, 'Default scene has 4 baseline objects');
});

test('Spatial Command - reject unsupported or ambiguous operations gracefully', () => {
  const res = executeSpatialCommand('format the hard drive');
  assert.equal(res.success, false);
  assert.match(res.message, /unrecognized/i);
});

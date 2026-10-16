import test from 'node:test';
import assert from 'node:assert/strict';
import { executeSpatialCommand } from '../src/spatial/spatialCommandExecutor';
import { spatialStore } from '../src/store/useSpatialStore';

test('Spatial Command - parse and spawn glowing sphere', () => {
  spatialStore.resetScene();
  const res = executeSpatialCommand('spawn a glowing sphere');
  assert.equal(res.success, true);
  assert.equal(res.action, 'SPAWN');

  const state = spatialStore.getState();
  const sphere = state.objects.find((o) => o.type === 'sphere');
  assert.ok(sphere, 'A sphere primitive should have been spawned');
});

test('Spatial Command - parse and create multiple objects (three floating rings)', () => {
  spatialStore.resetScene();
  const res = executeSpatialCommand('create three floating rings');
  assert.equal(res.success, true);
  assert.equal(res.action, 'SPAWN');

  const state = spatialStore.getState();
  const rings = state.objects.filter((o) => o.type === 'torus');
  assert.equal(rings.length, 3, 'Three torus primitives should be spawned');
});

test('Spatial Command - scale up / make larger on selected object', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('cube');
  spatialStore.selectObject(id);

  const initialScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale ?? 1;

  const res = executeSpatialCommand('make the selected object larger');
  assert.equal(res.success, true);
  assert.equal(res.action, 'SCALE');

  const newScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale ?? 1;
  assert.ok(newScale > initialScale, 'Object scale should increase');
});

test('Spatial Command - scale down / make smaller', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('cylinder');
  spatialStore.selectObject(id);

  const initialScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale ?? 1;

  const res = executeSpatialCommand('make smaller');
  assert.equal(res.success, true);
  assert.equal(res.action, 'SCALE');

  const newScale = spatialStore.getState().objects.find((o) => o.id === id)?.scale ?? 1;
  assert.ok(newScale < initialScale, 'Object scale should decrease');
});

test('Spatial Command - duplicate selected object', () => {
  spatialStore.resetScene();
  const id = spatialStore.spawnObject('icosahedron');
  spatialStore.selectObject(id);

  const initialCount = spatialStore.getState().objects.length;
  const res = executeSpatialCommand('duplicate object');
  assert.equal(res.success, true);
  assert.equal(res.action, 'DUPLICATE');

  const newCount = spatialStore.getState().objects.length;
  assert.equal(newCount, initialCount + 1, 'Object count should increment by 1');
});

test('Spatial Command - reset scene removes non-default objects', () => {
  spatialStore.spawnObject('cone');
  spatialStore.spawnObject('torus');

  const res = executeSpatialCommand('reset the scene');
  assert.equal(res.success, true);
  assert.equal(res.action, 'RESET');

  const state = spatialStore.getState();
  assert.equal(state.objects.length, 0);
});

test('Spatial Command - reject unsupported or ambiguous operations gracefully', () => {
  const res = executeSpatialCommand('format the hard drive');
  assert.equal(res.success, false);
  assert.match(res.message, /unrecognized/i);
});

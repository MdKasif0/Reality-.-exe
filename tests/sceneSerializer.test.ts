import test from 'node:test';
import assert from 'node:assert/strict';
import { exportScene, validateAndParse } from '../src/spatial/sceneSerializer';
import { VirtualObject } from '../src/types';

test('Scene Serializer - exportScene serializes virtual objects faithfully', () => {
  const sampleObjects: VirtualObject[] = [
    {
      id: 'obj-1',
      name: 'Cyber Cube',
      type: 'cube',
      position: [1.2, -0.5, 0.2],
      rotation: [0, 0.5, 0],
      scale: [1.5, 1.5, 1.5],
      color: '#00f0ff',
      emissive: '#042f2e',
      animation: 'float',
    },
  ];

  const jsonStr = exportScene(sampleObjects, 'Test Workspace');
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.version, '1.0.0');
  assert.equal(parsed.name, 'Test Workspace');
  assert.equal(parsed.objects.length, 1);
  assert.equal(parsed.objects[0].name, 'Cyber Cube');
  assert.equal(parsed.objects[0].type, 'cube');
  assert.equal(parsed.objects[0].scale[0], 1.5);
});

test('Scene Serializer - validateAndParse accepts valid scene JSON', () => {
  const validJson = JSON.stringify({
    version: '1.0.0',
    name: 'Validated Scene',
    timestamp: Date.now(),
    environment: { backgroundMode: 'camera' },
    objects: [
      {
        id: 'sphere-99',
        name: 'Glowing Orb',
        type: 'sphere',
        position: [0.5, 0.2, -0.1],
        rotation: [0, 0, 0],
        scale: [1.0, 1.0, 1.0],
        color: '#ff0055',
        emissive: '#003344',
      },
    ],
  });

  const res = validateAndParse(validJson);
  assert.equal(res.success, true);
  assert.ok(res.data);
  assert.equal(res.data?.objects.length, 1);
  assert.equal(res.data?.objects[0].type, 'sphere');
});

test('Scene Serializer - validateAndParse rejects prototype pollution attacks', () => {
  const maliciousJson = JSON.stringify({
    version: '1.0.0',
    __proto__: { isAdmin: true },
    constructor: { prototype: { hacked: true } },
    objects: [],
  });

  const res = validateAndParse(maliciousJson);
  assert.equal(res.success, false);
  assert.match(res.error ?? '', /violation|disallowed/i);
});

test('Scene Serializer - validateAndParse rejects unsupported object types', () => {
  const invalidTypeJson = JSON.stringify({
    version: '1.0.0',
    name: 'Hack',
    objects: [
      {
        id: 'bad-1',
        name: 'Malicious Object',
        type: 'eval_executable_script',
        position: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
  });

  const res = validateAndParse(invalidTypeJson);
  assert.equal(res.success, false);
  assert.match(res.error ?? '', /unsupported geometry type/i);
});

test('Scene Serializer - validateAndParse clamps out-of-bounds coordinates & scales', () => {
  const extremeJson = JSON.stringify({
    version: '1.0.0',
    name: 'Extreme Bounds Scene',
    objects: [
      {
        id: 'extreme-1',
        name: 'Super Massive',
        type: 'octahedron',
        position: [999, -999, 1000], // Far outside [-5..5]
        rotation: [0, 0, 0],
        scale: [50.0, 50.0, 50.0], // Far above max 3.5
        color: '#00f0ff',
      },
    ],
  });

  const res = validateAndParse(extremeJson);
  assert.equal(res.success, true);
  const obj = res.data?.objects[0];
  assert.ok(obj);
  assert.ok(obj.position[0] <= 5.0);
  assert.ok(obj.position[1] >= -5.0);
  assert.ok(obj.scale[0] <= 3.5);
});

test('Scene Serializer - validateAndParse gracefully handles malformed JSON without throwing', () => {
  const malformed = '{ version: "1.0.0", broken json... ';
  const res = validateAndParse(malformed);
  assert.equal(res.success, false);
  assert.ok(res.error);
});

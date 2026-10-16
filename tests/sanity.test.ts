import test from 'node:test';
import assert from 'node:assert/strict';
import { distance3D } from '../src/utils/mathUtils.ts';

test('Node native test runner executes TS import with .ts extension', () => {
  const d = distance3D({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
  assert.equal(d, 5);
});

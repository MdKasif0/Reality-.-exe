import test from 'node:test';
import assert from 'node:assert/strict';

test('Node native test runner executes TypeScript successfully', () => {
  const version: string = 'v1.0.0';
  assert.equal(version, 'v1.0.0');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { aiService } from '../src/services/ai/aiService';

test('AI Vision Service - cancelActiveRequest clears in-flight state and resets flags', () => {
  aiService.cancelActiveRequest();
  const state = aiService.getState();
  assert.equal(state.isScanning, false);
  assert.equal(state.isAsking, false);
  assert.equal(state.isGeneratingSpec, false);
  assert.equal(state.activeOperation, null);
});

test('AI Vision Service - generates validated 3D object spec without arbitrary executable code', async () => {
  const spec = await aiService.generateSpecFromPrompt('A glowing crystal tetrahedron');

  assert.ok(spec, 'Spec should be returned');
  assert.ok(typeof spec.name === 'string');
  assert.ok(['cube', 'sphere', 'cylinder', 'torus', 'cone', 'icosahedron'].includes(spec.geometry));
  assert.ok(spec.color.startsWith('#'));
  assert.ok(typeof spec.scale === 'number');
  assert.ok(spec.scale >= 0.3 && spec.scale <= 3.5);
  // Guarantee no executable scripts or functions are embedded in spec
  assert.equal(typeof (spec as any).exec, 'undefined');
  assert.equal(typeof (spec as any).run, 'undefined');
});

test('AI Vision Service - clearHistory resets scan and question history', () => {
  aiService.clearHistory();
  const state = aiService.getState();
  assert.equal(state.askHistory.length, 0);
  assert.equal(state.lastScanResult, null);
  assert.equal(state.lastError, null);
});

import {
  Box,
  Circle,
  Disc,
  Layers,
  Sparkles,
  Wand2,
  X,
  Play,
  RotateCw,
  Palette,
  Check,
  AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { AIObjectFactory } from '../../services/ai/aiObjectFactory';
import { aiService } from '../../services/ai/aiService';
import { spatialStore } from '../../store/useSpatialStore';
import { GeometryType, VirtualObject } from '../../types';

interface SpawnObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpawnObjectModal({ isOpen, onClose }: SpawnObjectModalProps) {
  const [activeTab, setActiveTab] = useState<'procedural' | 'ai'>('procedural');

  // Procedural Form State
  const [selectedGeom, setSelectedGeom] = useState<GeometryType>('cube');
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [isWireframe, setIsWireframe] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<'float' | 'spin' | 'pulse' | 'orbit' | 'none'>('float');
  const [scale, setScale] = useState(1.0);

  // AI Generation Form State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [recentlySpawned, setRecentlySpawned] = useState<string | null>(null);

  if (!isOpen) return null;

  const geometries: { type: GeometryType; label: string; icon: any; desc: string }[] = [
    { type: 'cube', label: 'Cube Matrix', icon: Box, desc: 'Isometric volumetric voxel grid' },
    { type: 'sphere', label: 'Sphere', icon: Circle, desc: 'Smooth curved orbital body' },
    { type: 'ring', label: 'Torus Ring', icon: Disc, desc: 'Holographic planar halo ring' },
    { type: 'octahedron', label: 'Hyper Prism', icon: Layers, desc: 'Refractive faceted octahedron' },
    { type: 'torus', label: 'Torus Knot', icon: RotateCw, desc: 'Interlaced continuous ribbon' },
    { type: 'cylinder', label: 'Cylinder', icon: Box, desc: 'Vertical axial column' },
    { type: 'cone', label: 'Cone', icon: Play, desc: 'Tapered directional vertex' },
  ];

  const colorPresets = [
    { name: 'Cyan', hex: '#00f0ff' },
    { name: 'Sky', hex: '#38bdf8' },
    { name: 'Emerald', hex: '#34d399' },
    { name: 'Indigo', hex: '#818cf8' },
    { name: 'Fuchsia', hex: '#f43f5e' },
    { name: 'Amber', hex: '#fbbf24' },
    { name: 'White', hex: '#f8fafc' },
  ];

  const inspirationPrompts = [
    'Create a glowing sphere',
    'Spawn a floating cube',
    'Create a miniature planet',
    'Generate a holographic ring',
    'Create a low-poly coffee mug',
    'Spawn a quantum prism',
  ];

  const handleSpawnProcedural = () => {
    const store = spatialStore.getState();
    const count = store.objects.length;
    const defaultX = ((count % 5) - 2) * 1.3;

    const newObj: VirtualObject = {
      id: `proc-obj-${Date.now()}`,
      name: `${geometries.find((g) => g.type === selectedGeom)?.label || 'Object'}`,
      type: selectedGeom,
      position: [defaultX, 0.4, 0],
      rotation: [0, 0, 0],
      scale: [scale, scale, scale],
      color: selectedColor,
      emissive: selectedColor,
      wireframe: isWireframe,
      animation: selectedAnimation,
      selected: true,
    };

    spatialStore.spawnDirectObject(newObj);
    setRecentlySpawned(newObj.name);
    setTimeout(() => onClose(), 350);
  };

  const handleSpawnAI = async (customPrompt?: string) => {
    const targetPrompt = (customPrompt || prompt).trim();
    if (!targetPrompt || isGenerating) return;

    setIsGenerating(true);
    setAiError(null);

    try {
      const spec = await aiService.generateSpecFromPrompt(targetPrompt);
      const obj = AIObjectFactory.spawnFromSpec(spec);
      setRecentlySpawned(obj.name);
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      console.error('AI Object synthesis failed:', err);
      setAiError(err.message || 'Failed to synthesize 3D object.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                Spawn Virtual Object
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Procedural 3D geometry engine & AI multimodal synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('procedural')}
            className={`py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'procedural'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode A: Procedural Geometry
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 size={13} />
            <span>Mode B: AI Natural Language</span>
          </button>
        </div>

        {/* TAB 1: PROCEDURAL GEOMETRY */}
        {activeTab === 'procedural' && (
          <div className="flex flex-col gap-4">
            {/* Geometry Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono uppercase text-slate-400">Select Primitive</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {geometries.map((g) => {
                  const Icon = g.icon;
                  const active = selectedGeom === g.type;
                  return (
                    <button
                      key={g.type}
                      onClick={() => setSelectedGeom(g.type)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                        active
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-white glow-cyan-sm'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={16} className={active ? 'text-cyan-400' : 'text-slate-400'} />
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </div>
                      <span className="text-xs font-semibold font-mono text-slate-200">{g.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight truncate">{g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono uppercase text-slate-400">Material Hue</span>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPresets.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-transform hover:scale-110 ${
                      selectedColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-white/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor === c.hex && <Check size={14} className="text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation & Wireframe Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Animation Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase text-slate-400">Idle Animation</span>
                <select
                  value={selectedAnimation}
                  onChange={(e: any) => setSelectedAnimation(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-slate-200 outline-none"
                >
                  <option value="float">Float & Levitate</option>
                  <option value="spin">Axial Spin</option>
                  <option value="pulse">Volumetric Pulse</option>
                  <option value="orbit">Harmonic Orbit</option>
                  <option value="none">Static Anchor</option>
                </select>
              </div>

              {/* Wireframe Toggle */}
              <div className="flex flex-col gap-1.5 justify-end">
                <label className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all text-xs font-mono text-slate-300">
                  <span>Holographic Wireframe</span>
                  <input
                    type="checkbox"
                    checked={isWireframe}
                    onChange={(e) => setIsWireframe(e.target.checked)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Object Scale</span>
                <span className="text-cyan-400">{scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Spawn Procedural Action */}
            <button
              onClick={handleSpawnProcedural}
              className="mt-2 w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg glow-cyan flex items-center justify-center gap-2 cursor-pointer"
            >
              <Box size={15} />
              <span>Spawn Procedural Object</span>
            </button>
          </div>
        )}

        {/* TAB 2: AI NATURAL LANGUAGE SYNTHESIS */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs font-sans text-cyan-200 flex flex-col gap-1">
              <span className="font-semibold font-mono uppercase text-cyan-300 text-[11px] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Deterministic AI Synthesis</span>
              </span>
              <p className="text-[11px] text-slate-300">
                Type natural language commands to synthesize interactive 3D models. The AI generates safe, validated Three.js parameters.
              </p>
            </div>

            {/* Prompt Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">
                Natural Language Request
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpawnAI()}
                  placeholder='e.g. "Create a glowing sphere" or "Spawn a miniature planet"'
                  disabled={isGenerating}
                  className="w-full pl-3 pr-10 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400/50 text-xs font-mono text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Inspiration Prompt Pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500">
                Inspiration Commands:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspirationPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(p);
                      handleSpawnAI(p);
                    }}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all text-left"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            {/* AI Error */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={() => handleSpawnAI()}
              disabled={!prompt.trim() || isGenerating}
              className="mt-2 w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg glow-cyan flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Synthesizing 3D Specification...</span>
                </>
              ) : (
                <>
                  <Wand2 size={15} />
                  <span>Synthesize & Spawn Object</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

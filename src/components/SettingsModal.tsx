import {
  AlertCircle,
  Brain,
  Camera,
  CheckCircle2,
  Eye,
  Key,
  Link,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { mediaPipeService } from '../core/mediaPipeService';
import { aiConfigService, AVAILABLE_MODELS } from '../services/ai/aiConfig';
import { GeminiProvider, OpenAIProvider, ProxyProvider, SimulatedProvider } from '../services/ai/aiProviderAdapter';
import { sceneContextStore, useSceneContextStore } from '../store/useSceneContextStore';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { AIProviderConfig, AIProviderType, BackgroundMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, backgroundMode } = useSpatialStore();
  const { analyzedObjects } = useSceneContextStore();
  const [activeTab, setActiveTab] = useState<'spatial' | 'ai'>('spatial');

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(aiConfigService.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    result: { ok: boolean; message: string } | null;
  }>({ testing: false, result: null });

  useEffect(() => {
    return aiConfigService.subscribe((config) => {
      setAiConfig(config);
    });
  }, []);

  if (!isOpen) return null;

  const bgModes: { id: BackgroundMode; label: string; desc: string }[] = [
    {
      id: 'camera',
      label: 'Live Augmented Reality',
      desc: 'Real physical surroundings with overlaid 3D spatial holograms.',
    },
    {
      id: 'dark',
      label: 'Dark Spatial Void',
      desc: 'Deep graphite spatial computing environment with ambient starfields.',
    },
    {
      id: 'minimal',
      label: 'Minimalist Debug',
      desc: 'High-contrast focused wireframe view for precision tracking inspection.',
    },
  ];

  const handleProviderChange = (provider: AIProviderType) => {
    const models = AVAILABLE_MODELS[provider] || [];
    const defaultModel = models[0]?.id || '';
    aiConfigService.updateConfig({
      provider,
      model: defaultModel,
    });
    setTestStatus({ testing: false, result: null });
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true, result: null });
    try {
      let providerInstance;
      if (aiConfig.provider === 'gemini') providerInstance = new GeminiProvider();
      else if (aiConfig.provider === 'openai') providerInstance = new OpenAIProvider();
      else if (aiConfig.provider === 'proxy') providerInstance = new ProxyProvider();
      else providerInstance = new SimulatedProvider();

      const res = await providerInstance.testConnection();
      setTestStatus({ testing: false, result: res });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        result: { ok: false, message: err.message || 'Connection test failed.' },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                System Preferences
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Reality.exe spatial computing & AI vision settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('spatial')}
            className={`py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'spatial'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={14} />
            <span>Spatial & Computer Vision</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ai'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain size={14} />
            <span>AI Multimodal Intelligence</span>
          </button>
        </div>

        {/* TAB 1: SPATIAL & COMPUTER VISION */}
        {activeTab === 'spatial' && (
          <div className="flex flex-col gap-5">
            {/* 1. Environment / Background Mode */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Eye size={14} />
                <span>Environment View Mode</span>
              </span>
              <div className="grid grid-cols-1 gap-2">
                {bgModes.map((m) => {
                  const active = backgroundMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => spatialStore.setBackgroundMode(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5 ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-400/50 text-white glow-cyan-sm'
                          : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm font-semibold font-sans flex items-center justify-between">
                        <span>{m.label}</span>
                        {active && <span className="text-[10px] font-mono text-cyan-300">ACTIVE</span>}
                      </span>
                      <span className="text-xs text-slate-400">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Computer Vision & Tracking Sensitivity */}
            <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap size={14} />
                <span>Tracking Sensitivity & Jitter</span>
              </span>

              {/* Landmark Smoothing Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Landmark Jitter Smoothing</span>
                  <span className="text-cyan-400">{settings.smoothingFactor.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={settings.smoothingFactor}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    spatialStore.updateSettings({ smoothingFactor: val });
                    mediaPipeService.setSmoothingFactor(val);
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>More Responsive</span>
                  <span>Smoother (Less Jitter)</span>
                </div>
              </div>

              {/* Pinch Sensitivity Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Pinch Grab Sensitivity</span>
                  <span className="text-cyan-400">{settings.pinchThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.45"
                  step="0.02"
                  value={settings.pinchThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    spatialStore.updateSettings({ pinchThreshold: val });
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Strict Pinch</span>
                  <span>Easier Pinch</span>
                </div>
              </div>
            </div>

            {/* 3. Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs font-mono">
              <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
                <span className="flex items-center gap-2 text-slate-300">
                  <Camera size={14} className="text-cyan-400" />
                  <span>Mirror Camera Stream</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.mirrorCamera}
                  onChange={(e) => spatialStore.updateSettings({ mirrorCamera: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
                <span className="flex items-center gap-2 text-slate-300">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>21 Landmark Debug HUD</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.showDebugLandmarks}
                  onChange={(e) =>
                    spatialStore.updateSettings({ showDebugLandmarks: e.target.checked })
                  }
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-all">
                <span className="flex items-center gap-2 text-slate-300">
                  {settings.soundEffects ? (
                    <Volume2 size={14} className="text-cyan-400" />
                  ) : (
                    <VolumeX size={14} className="text-slate-500" />
                  )}
                  <span>Haptic Audio Cues</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => spatialStore.updateSettings({ soundEffects: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: AI MULTIMODAL INTELLIGENCE */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-4">
            {/* AI Master Enable Toggle */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  AI Vision & Multimodal Features
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Controls Reality Scan, Ask Reality, and AI Object Creation
                </span>
              </div>
              <input
                type="checkbox"
                checked={aiConfig.enabled}
                onChange={(e) => aiConfigService.updateConfig({ enabled: e.target.checked })}
                className="accent-cyan-400 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* Provider Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">
                AI Provider Architecture
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'gemini' as AIProviderType,
                    label: 'Google Gemini',
                    sub: 'Recommended Multimodal',
                  },
                  {
                    id: 'simulated' as AIProviderType,
                    label: 'Local Simulator',
                    sub: '100% Offline (No Key)',
                  },
                  {
                    id: 'openai' as AIProviderType,
                    label: 'OpenAI Vision',
                    sub: 'GPT-4o Mini / 4o',
                  },
                  {
                    id: 'proxy' as AIProviderType,
                    label: 'Backend Proxy',
                    sub: 'Server-Side (/api/ai/*)',
                  },
                ].map((p) => {
                  const active = aiConfig.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5 ${
                        active
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-white glow-cyan-sm'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs font-semibold font-mono text-slate-100">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{p.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">Vision Model</label>
              <select
                value={aiConfig.model}
                onChange={(e) => aiConfigService.updateConfig({ model: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-slate-100 outline-none"
              >
                {(AVAILABLE_MODELS[aiConfig.provider] || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key (if Gemini or OpenAI) */}
            {(aiConfig.provider === 'gemini' || aiConfig.provider === 'openai') && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="uppercase text-slate-400 flex items-center gap-1.5">
                    <Key size={13} className="text-cyan-400" />
                    <span>{aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-slate-400 hover:text-cyan-300"
                  >
                    {showApiKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiConfig.apiKey || ''}
                  onChange={(e) => aiConfigService.updateConfig({ apiKey: e.target.value })}
                  placeholder={`Enter your ${aiConfig.provider === 'gemini' ? 'AI Studio Gemini' : 'OpenAI'} API key`}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400/50 text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none"
                />
                <span className="text-[10px] font-mono text-slate-500">
                  Key is saved in your local browser storage and never committed to source control.
                </span>
              </div>
            )}

            {/* Custom Endpoint (optional for OpenAI) */}
            {aiConfig.provider === 'openai' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Link size={13} className="text-cyan-400" />
                  <span>Custom Endpoint (Optional)</span>
                </label>
                <input
                  type="text"
                  value={aiConfig.customEndpoint || ''}
                  onChange={(e) => aiConfigService.updateConfig({ customEndpoint: e.target.value })}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none"
                />
              </div>
            )}

            {/* Test Connection Button & Result */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTestConnection}
                disabled={testStatus.testing}
                className="px-4 py-2.5 rounded-xl bg-black/50 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testStatus.testing ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              {testStatus.result && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl border ${
                    testStatus.result.ok
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testStatus.result.ok ? (
                    <CheckCircle2 size={14} className="shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="shrink-0" />
                  )}
                  <span className="truncate max-w-[260px]">{testStatus.result.message}</span>
                </div>
              )}
            </div>

            {/* Session Memory Context Controls */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  Session Spatial Memory
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  {analyzedObjects.length} physical object(s) remembered this session
                </span>
              </div>
              {analyzedObjects.length > 0 && (
                <button
                  onClick={() => sceneContextStore.clearContext()}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono border border-rose-500/30 transition-all"
                >
                  Clear Memory
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs tracking-wider uppercase transition-all glow-cyan-sm cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

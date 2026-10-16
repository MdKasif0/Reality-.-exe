import { Activity, Gauge, Hand, Shield, Sparkles, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { mediaPipeService } from '../core/mediaPipeService';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';
import { VisionState } from '../types';

export function GestureDiagnosticsHUD() {
  const { settings } = useSpatialStore();
  const [visionState, setVisionState] = useState<VisionState>(mediaPipeService.getState());

  useEffect(() => {
    return mediaPipeService.subscribe(setVisionState);
  }, []);

  if (!settings.showDiagnostics) return null;

  const hand = visionState.hands[0];
  const confidencePct = Math.round(visionState.gestureConfidence * 100);

  return (
    <div className="fixed top-20 right-80 z-40 pointer-events-auto select-none w-72 glass-panel rounded-2xl p-3.5 border border-cyan-400/40 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-150 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Activity size={14} className="animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[11px]">Gesture Diagnostics</span>
        </div>
        <button
          onClick={() => spatialStore.updateSettings({ showDiagnostics: false })}
          title="Close Diagnostics"
          className="text-slate-400 hover:text-white p-0.5"
        >
          <X size={13} />
        </button>
      </div>

      {/* Realtime Metrics Grid */}
      <div className="flex flex-col gap-2">
        {/* Active Gesture & Confidence */}
        <div className="p-2 rounded-xl bg-black/50 border border-white/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
            <span>Gesture Classification</span>
            <span className="text-cyan-400">{confidencePct}% Conf</span>
          </div>
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{visionState.activeGesture}</span>
          </span>
        </div>

        {/* State Machine Status */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-500 uppercase">State Machine</span>
            <span className="text-slate-200 font-semibold mt-0.5">
              {visionState.activeGesture === 'IDLE' ? 'NOT_DETECTED' : 'RECOGNIZED / HELD'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col">
            <span className="text-slate-500 uppercase">Inference Latency</span>
            <span className="text-cyan-300 font-semibold mt-0.5">
              {visionState.latencyMs} ms
            </span>
          </div>
        </div>

        {/* Hand Landmark Quality */}
        <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 text-[10px]">
          <div className="flex items-center justify-between text-slate-400 uppercase">
            <span>Landmark Smoothing (EMA)</span>
            <span className="text-cyan-400">{settings.smoothingFactor.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all"
              style={{ width: `${settings.smoothingFactor * 100}%` }}
            />
          </div>
        </div>

        {/* Handedness & Tracking Score */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Hand size={13} className="text-cyan-400" />
            <span>{hand ? `${hand.handedness} Hand` : 'No Hands Detected'}</span>
          </span>
          <span className="text-emerald-400 font-semibold">
            {hand ? `${Math.round(hand.score * 100)}% Score` : 'Searching'}
          </span>
        </div>
      </div>
    </div>
  );
}

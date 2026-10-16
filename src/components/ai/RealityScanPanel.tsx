import {
  Bookmark,
  Boxes,
  Check,
  Info,
  MessageSquare,
  Sparkles,
  Tag,
  Wand2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AIObjectFactory } from '../../services/ai/aiObjectFactory';
import { sceneContextStore } from '../../store/useSceneContextStore';
import { RealityScanResult } from '../../types';

interface RealityScanPanelProps {
  scanResult: RealityScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAskReality: (prefillQuestion?: string) => void;
}

export function RealityScanPanel({
  scanResult,
  isOpen,
  onClose,
  onOpenAskReality,
}: RealityScanPanelProps) {
  const [spawned, setSpawned] = useState(false);
  const [savedToContext, setSavedToContext] = useState(false);

  if (!isOpen || !scanResult) return null;

  const handleSpawnModel = () => {
    const spec = scanResult.suggested3DSpec || {
      type: 'cube',
      name: `Holo ${scanResult.objectName}`,
      description: scanResult.conciseSummary,
      scale: [1, 1, 1],
      color: '#00f0ff',
      emissive: '#042f2e',
      wireframe: false,
      animation: 'float',
    };

    const newObj = AIObjectFactory.spawnFromSpec(spec);
    setSpawned(true);

    // Save to scene memory context
    sceneContextStore.addFromScan(scanResult, newObj.id);
    setSavedToContext(true);
  };

  const handleSaveToMemory = () => {
    sceneContextStore.addFromScan(scanResult);
    setSavedToContext(true);
  };

  return (
    <div className="fixed inset-y-4 right-4 w-96 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="w-full h-full glass-panel-active rounded-3xl p-5 flex flex-col gap-4 border border-cyan-400/30 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Reality Scan
              </span>
              <h3 className="text-sm font-display font-bold text-white truncate max-w-[200px]">
                {scanResult.objectName}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scanned Image Preview & Category Badge */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-video flex items-center justify-center">
          {scanResult.thumbnailDataUrl ? (
            <img
              src={scanResult.thumbnailDataUrl}
              alt={scanResult.objectName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Boxes size={32} className="text-slate-600" />
          )}

          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
            <Tag size={11} />
            <span>{scanResult.category}</span>
          </div>
        </div>

        {/* Short Technical Description */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Info size={11} />
            <span>Analysis Summary</span>
          </span>
          <p className="text-slate-200 leading-relaxed font-sans">{scanResult.shortDescription}</p>
        </div>

        {/* Visible Attributes Chips */}
        {scanResult.visibleAttributes?.length > 0 && (
          <div className="flex flex-col gap-1.5 text-xs font-mono">
            <span className="text-[10px] uppercase text-slate-400">Visible Attributes</span>
            <div className="flex flex-wrap gap-1.5">
              {scanResult.visibleAttributes.map((attr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Material & Confidence Estimates */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase text-slate-400">Material</span>
            <span className="text-[11px] text-cyan-300 font-semibold truncate">
              {scanResult.materialEstimate || 'Uncertain'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-0.5">
            <span className="text-[9px] uppercase text-slate-400">Certainty</span>
            <span className="text-[11px] text-slate-300 truncate">
              {scanResult.confidenceNote || 'Verified'}
            </span>
          </div>
        </div>

        {/* Use Cases */}
        {scanResult.potentialUseCases?.length > 0 && (
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400">Potential Use Cases</span>
            <ul className="flex flex-col gap-1 text-[11px] text-slate-300 font-sans list-disc pl-4">
              {scanResult.potentialUseCases.map((use, i) => (
                <li key={i}>{use}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleSpawnModel}
            disabled={spawned}
            className={`w-full py-2.5 rounded-xl font-mono font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              spawned
                ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg glow-cyan'
            }`}
          >
            {spawned ? (
              <>
                <Check size={14} />
                <span>Virtual Model Created!</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>Spawn 3D Virtual Model</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onOpenAskReality(`Tell me more about this ${scanResult.objectName}.`);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl glass-panel hover:bg-white/10 text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
          >
            <MessageSquare size={14} className="text-cyan-400" />
            <span>Ask Follow-up Question</span>
          </button>

          {!savedToContext && (
            <button
              onClick={handleSaveToMemory}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bookmark size={13} />
              <span>Save to Session Memory</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

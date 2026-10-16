import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  FolderOpen,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { SceneSerializer, SceneSnapshotData } from '../spatial/sceneSerializer';
import { spatialStore, useSpatialStore } from '../store/useSpatialStore';

interface SceneSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SceneSnapshotModal({ isOpen, onClose }: SceneSnapshotModalProps) {
  const { objects } = useSpatialStore();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [sceneName, setSceneName] = useState('My Spatial Workspace');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    ok: boolean;
    message: string;
    parsed?: SceneSnapshotData;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    SceneSerializer.exportToFile(sceneName);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      validateJSON(content);
    };
    reader.readAsText(file);
  };

  const validateJSON = (raw: string) => {
    const result = SceneSerializer.validateAndParse(raw);
    if (result.valid && result.data) {
      setImportStatus({
        ok: true,
        message: `Valid scene file: "${result.data.name}" (${result.data.objects.length} objects). Ready to restore.`,
        parsed: result.data,
      });
    } else {
      setImportStatus({
        ok: false,
        message: result.error || 'Invalid scene file.',
      });
    }
  };

  const handleApplyImport = () => {
    if (!importStatus?.ok || !importText) return;
    const res = SceneSerializer.importScene(importText);
    if (res.success) {
      onClose();
    } else {
      setImportStatus({ ok: false, message: res.error || 'Failed to apply scene.' });
    }
  };

  const handleLoadSample = (type: 'solar' | 'cyber') => {
    if (type === 'solar') {
      spatialStore.setObjects([
        {
          id: `sample-sun-${Date.now()}`,
          name: 'Sol Star Core',
          type: 'sphere',
          position: [0, 0.4, 0],
          rotation: [0, 0, 0],
          scale: [1.6, 1.6, 1.6],
          color: '#fbbf24',
          emissive: '#b45309',
          animation: 'pulse',
        },
        {
          id: `sample-ring-${Date.now()}`,
          name: 'Planetary Halo',
          type: 'ring',
          position: [0, 0.4, 0],
          rotation: [1.2, 0.4, 0],
          scale: [2.5, 2.5, 2.5],
          color: '#00f0ff',
          emissive: '#0369a1',
          animation: 'spin',
        },
        {
          id: `sample-orb-${Date.now()}`,
          name: 'Orbital Satellite',
          type: 'octahedron',
          position: [2.8, 1.2, 0],
          rotation: [0, 0, 0],
          scale: [0.7, 0.7, 0.7],
          color: '#34d399',
          emissive: '#065f46',
          animation: 'orbit',
        },
      ]);
    } else {
      spatialStore.setObjects([
        {
          id: `sample-voxel-${Date.now()}`,
          name: 'Cyber Lattice Base',
          type: 'cube',
          position: [-1.8, 0.3, 0],
          rotation: [0.4, 0.6, 0],
          scale: [1.1, 1.1, 1.1],
          color: '#38bdf8',
          emissive: '#075985',
          wireframe: true,
          animation: 'spin',
        },
        {
          id: `sample-torus-${Date.now()}`,
          name: 'Quantum Ring Field',
          type: 'torus',
          position: [0, 0.6, 0],
          rotation: [0, 0, 0],
          scale: [1.3, 1.3, 1.3],
          color: '#00f0ff',
          emissive: '#042f2e',
          animation: 'float',
        },
        {
          id: `sample-column-${Date.now()}`,
          name: 'Matrix Data Core',
          type: 'cylinder',
          position: [1.8, 0.3, 0],
          rotation: [0, 0, 0],
          scale: [0.9, 1.4, 0.9],
          color: '#818cf8',
          emissive: '#3730a3',
          animation: 'pulse',
        },
      ]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <FileJson size={20} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                Scene Snapshots
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Export & Restore 3D spatial arrangements as validated JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 border border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={13} />
            <span>Export Snapshot</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={13} />
            <span>Restore / Import</span>
          </button>
        </div>

        {/* TAB 1: EXPORT */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-slate-300 flex flex-col gap-1 font-sans">
              <span className="font-mono text-cyan-300 font-semibold uppercase text-[11px] flex items-center gap-1">
                <Sparkles size={12} />
                <span>Client-Side Privacy Safe</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Snapshots encode only virtual object geometries, materials, coordinates, and labels. Camera images are never exported or stored.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="uppercase text-slate-400 text-[10px]">Snapshot Label</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-100 outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between text-slate-300">
              <span>Objects in workspace:</span>
              <span className="font-bold text-cyan-400">{objects.length} virtual units</span>
            </div>

            <button
              onClick={handleExport}
              className="mt-2 w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg glow-cyan flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              <span>Download Scene JSON</span>
            </button>
          </div>
        )}

        {/* TAB 2: IMPORT / RESTORE */}
        {activeTab === 'import' && (
          <div className="flex flex-col gap-3 text-xs font-mono">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FolderOpen size={15} className="text-cyan-400" />
              <span>Select .JSON Scene File</span>
            </button>

            {/* Paste or Textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 uppercase">Or Paste JSON Data:</label>
              <textarea
                rows={4}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  validateJSON(e.target.value);
                }}
                placeholder='{"version": "1.0.0", "objects": [...]}'
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-slate-300 outline-none resize-none font-mono"
              />
            </div>

            {/* Validation Feedback */}
            {importStatus && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                  importStatus.ok
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                {importStatus.ok ? (
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={handleApplyImport}
              disabled={!importStatus?.ok}
              className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-bold uppercase tracking-wider transition-all shadow-lg glow-cyan flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={14} />
              <span>Restore Scene into Workspace</span>
            </button>

            {/* Sample Templates */}
            <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase">Quick Presets:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLoadSample('solar')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-[11px] text-slate-300 transition-all text-left"
                >
                  Orbital Halo System
                </button>
                <button
                  onClick={() => handleLoadSample('cyber')}
                  className="p-2 rounded-xl bg-black/40 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-[11px] text-slate-300 transition-all text-left"
                >
                  Cyber Lattice Grid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

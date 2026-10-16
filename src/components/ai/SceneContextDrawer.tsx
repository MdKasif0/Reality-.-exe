import {
  Bookmark,
  Boxes,
  Check,
  Edit2,
  MessageSquare,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { sceneContextStore, useSceneContextStore } from '../../store/useSceneContextStore';
import { SessionSceneObject } from '../../types';

interface SceneContextDrawerProps {
  onOpenAskReality: (prefillQuestion?: string) => void;
}

export function SceneContextDrawer({ onOpenAskReality }: SceneContextDrawerProps) {
  const { drawerOpen, analyzedObjects, activeObjectContextId } = useSceneContextStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  if (!drawerOpen) return null;

  const handleStartRename = (obj: SessionSceneObject) => {
    setEditingId(obj.id);
    setTempLabel(obj.label);
  };

  const handleSaveRename = (id: string) => {
    sceneContextStore.renameObject(id, tempLabel);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-y-4 left-24 w-80 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-left-4 duration-200">
      <div className="w-full h-full glass-panel-active rounded-3xl p-5 flex flex-col justify-between border border-cyan-500/30 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Bookmark size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Session Memory
              </span>
              <h3 className="text-sm font-display font-bold text-white">
                Analyzed Physical World
              </h3>
            </div>
          </div>
          <button
            onClick={() => sceneContextStore.setDrawerOpen(false)}
            title="Close Drawer"
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Object Cards List */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 pr-1">
          {analyzedObjects.length === 0 ? (
            <div className="my-auto flex flex-col items-center text-center p-4 gap-2 text-slate-400">
              <Boxes size={28} className="text-slate-600 mb-1" />
              <span className="text-xs font-mono font-semibold text-slate-300">
                No Physical Objects Analyzed
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Point at physical objects using Reality Scan to store spatial insights in local session memory.
              </p>
            </div>
          ) : (
            analyzedObjects.map((obj) => (
              <div
                key={obj.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                  activeObjectContextId === obj.id
                    ? 'bg-cyan-950/30 border-cyan-400/50 glow-cyan-sm'
                    : 'bg-black/40 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Thumbnail & Title */}
                <div className="flex items-start gap-2.5">
                  {obj.thumbnail ? (
                    <img
                      src={obj.thumbnail}
                      alt={obj.label}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editingId === obj.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempLabel}
                          onChange={(e) => setTempLabel(e.target.value)}
                          className="w-full px-2 py-0.5 rounded bg-black border border-cyan-400 text-xs font-mono text-white outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(obj.id)}
                          className="p-1 rounded bg-cyan-400 text-black"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white truncate">
                          {obj.label}
                        </span>
                        <button
                          onClick={() => handleStartRename(obj)}
                          title="Rename Object"
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-cyan-400 uppercase block truncate">
                      {obj.category}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(obj.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-300 font-sans line-clamp-2">
                  {obj.description}
                </p>

                {/* Actions: Ask Follow-up & Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    onClick={() => {
                      onOpenAskReality(`Regarding ${obj.label}: `);
                      sceneContextStore.setDrawerOpen(false);
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 hover:underline"
                  >
                    <MessageSquare size={11} />
                    <span>Ask Follow-up</span>
                  </button>

                  <button
                    onClick={() => sceneContextStore.removeObject(obj.id)}
                    title="Remove from memory"
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {analyzedObjects.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <button
              onClick={() => sceneContextStore.clearContext()}
              className="w-full py-2 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-mono transition-colors"
            >
              Clear Session Memory ({analyzedObjects.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

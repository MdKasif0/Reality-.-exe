import {
  AlertCircle,
  Camera,
  Compass,
  Mic,
  MicOff,
  Send,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { cameraManager } from '../../core/cameraManager';
import { aiService, AIServiceState } from '../../services/ai/aiService';
import { useSpatialStore } from '../../store/useSpatialStore';

interface AskRealityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

export function AskRealityPanel({ isOpen, onClose, initialQuestion = '' }: AskRealityPanelProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [prevInitial, setPrevInitial] = useState(initialQuestion);
  const [aiState, setAiState] = useState<AIServiceState>(aiService.getState());
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { settings } = useSpatialStore();

  if (initialQuestion !== prevInitial) {
    setPrevInitial(initialQuestion);
    setQuestion(initialQuestion);
  }

  useEffect(() => {
    return aiService.subscribe(setAiState);
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiState.askHistory, aiState.isAsking]);

  // Speech-to-Text Push-to-Talk setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  if (!isOpen) return null;

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = question.trim();
    if (!query || aiState.isAsking) return;

    const video = cameraManager.getVideoElement();
    if (!video) {
      alert('Camera feed is required to analyze your physical environment.');
      return;
    }

    setQuestion('');
    try {
      await aiService.askEnvironment(video, query, settings.mirrorCamera);
    } catch (err) {
      console.error('Ask reality error:', err);
    }
  };

  const sampleQuestions = [
    'What objects are visible on my desk?',
    'What is the likely purpose of this item?',
    'Describe the lighting and atmosphere of this room.',
    'Suggest how to organize this workspace.',
  ];

  return (
    <div className="fixed inset-y-4 right-4 w-[420px] max-w-[calc(100vw-2rem)] z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="w-full h-full glass-panel rounded-3xl p-5 flex flex-col justify-between border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 glow-cyan-sm">
              <Compass size={17} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Ask Reality
              </span>
              <h3 className="text-sm font-display font-bold text-white">
                Environment Q&A
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Ask Reality"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3 pr-1 text-xs font-sans">
          {aiState.askHistory.length === 0 ? (
            <div className="my-auto flex flex-col items-center text-center p-4 gap-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/5">
                <Camera size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-200 font-display text-sm">
                  Inquire About Your World
                </span>
                <p className="text-[11px] text-slate-400 max-w-[260px] leading-relaxed">
                  Ask questions about objects, organization, or visible details in your physical surroundings.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="flex flex-col gap-1.5 w-full pt-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase text-left">
                  Suggested Questions:
                </span>
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(q);
                    }}
                    className="p-2 rounded-xl bg-black/40 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 text-left text-[11px] text-slate-300 transition-all truncate"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            aiState.askHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-slate-100'
                      : 'bg-black/50 border border-white/10 text-slate-200'
                  }`}
                >
                  {msg.attachedImage && (
                    <img
                      src={msg.attachedImage}
                      alt="Captured scene"
                      className="rounded-lg mb-2 max-h-32 object-cover border border-white/10"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[9px] font-mono text-slate-500 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {aiState.isAsking && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/50 border border-cyan-400/30 text-xs font-mono text-cyan-300 w-fit animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Analyzing camera snapshot...</span>
              <button
                onClick={() => aiService.cancelActiveRequest()}
                title="Cancel request"
                className="ml-2 text-rose-400 hover:text-rose-300 text-[10px] underline"
              >
                Cancel
              </button>
            </div>
          )}

          {aiState.lastError && (
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{aiState.lastError}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Form with Push-To-Talk Mic */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about visible objects..."
              disabled={aiState.isAsking}
              className="w-full pl-3 pr-20 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400/50 text-xs font-mono text-slate-100 placeholder:text-slate-500 outline-none transition-all"
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {/* Push to talk */}
              <button
                type="button"
                onClick={toggleMic}
                title={isListening ? 'Stop listening' : 'Push to talk (Speech input)'}
                className={`p-1.5 rounded-lg transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={!question.trim() || aiState.isAsking}
                title="Send inquiry"
                className="p-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black transition-all cursor-pointer"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Only captures a single frame on send.</span>
            {aiState.askHistory.length > 0 && (
              <button
                type="button"
                onClick={() => aiService.clearHistory()}
                className="text-slate-400 hover:text-rose-300 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

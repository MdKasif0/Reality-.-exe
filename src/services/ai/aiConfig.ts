import { AIProviderConfig, AIProviderType } from '../../types';

export interface ModelDescriptor {
  id: string;
  name: string;
  provider: AIProviderType;
  description: string;
  supportsVision: boolean;
}

export const AVAILABLE_MODELS: Record<AIProviderType, ModelDescriptor[]> = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash (Ultra-Fast Vision)',
      provider: 'gemini',
      description: 'Lowest latency multimodal model, optimal for spatial computing.',
      supportsVision: true,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      description: 'High-speed multimodal intelligence with structured outputs.',
      supportsVision: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro (Deep Reasoning)',
      provider: 'gemini',
      description: 'Deep multimodal reasoning for complex scene understanding.',
      supportsVision: true,
    },
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini Vision',
      provider: 'openai',
      description: 'Fast, lightweight multimodal vision model.',
      supportsVision: true,
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o Omnimodal',
      provider: 'openai',
      description: 'High-accuracy multimodal understanding.',
      supportsVision: true,
    },
  ],
  proxy: [
    {
      id: 'backend-default',
      name: 'Local Backend Proxy (Auto)',
      provider: 'proxy',
      description: 'Uses secure server-side environment variables (.env).',
      supportsVision: true,
    },
  ],
  simulated: [
    {
      id: 'simulated-vision',
      name: 'Local Heuristic Simulator (Offline)',
      provider: 'simulated',
      description: 'Instant local simulation without requiring external API keys.',
      supportsVision: true,
    },
  ],
};

const STORAGE_KEY = 'reality_ai_config';

class AIConfigService {
  private config: AIProviderConfig;
  private listeners: Set<(config: AIProviderConfig) => void> = new Set();

  constructor() {
    let saved: Partial<AIProviderConfig> = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw);
      }
    } catch {
      // Graceful fallback in non-browser environments
    }

    // Default configuration with fallback to environment variable
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const initialProvider: AIProviderType = saved.provider || (envKey ? 'gemini' : 'simulated');

    this.config = {
      provider: initialProvider,
      apiKey: saved.apiKey !== undefined ? saved.apiKey : envKey,
      model: saved.model || (initialProvider === 'gemini' ? 'gemini-2.5-flash' : 'simulated-vision'),
      customEndpoint: saved.customEndpoint || '',
      enabled: saved.enabled !== undefined ? saved.enabled : true,
      temperature: saved.temperature ?? 0.2,
    };
  }

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AIProviderConfig>) {
    this.config = { ...this.config, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not persist AI config:', e);
    }
    this.notify();
  }

  public subscribe(listener: (config: AIProviderConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getConfig();
    this.listeners.forEach((l) => l(current));
  }

  public hasValidKey(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.provider === 'simulated' || this.config.provider === 'proxy') return true;
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 5);
  }
}

export const aiConfigService = new AIConfigService();

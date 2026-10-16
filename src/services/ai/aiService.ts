import {
  AISpawnObjectSpec,
  AskRealityMessage,
  BoundingBox2D,
  RealityScanResult,
} from '../../types';
import { aiConfigService } from './aiConfig';
import {
  GeminiProvider,
  IVisionLanguageProvider,
  OpenAIProvider,
  ProxyProvider,
  SimulatedProvider,
} from './aiProviderAdapter';
import { ImageProcessor } from './imageProcessor';

export interface AIServiceState {
  isScanning: boolean;
  isAsking: boolean;
  isGeneratingSpec: boolean;
  activeOperation: 'scan' | 'ask' | 'spawn' | null;
  statusMessage: string;
  lastError: string | null;
  lastScanResult: RealityScanResult | null;
  askHistory: AskRealityMessage[];
}

class AIService {
  private activeController: AbortController | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private lastRequestTime: number = 0;
  private MIN_REQUEST_INTERVAL_MS: number = 1200; // Rate limit debouncing

  private providers: Record<string, IVisionLanguageProvider> = {
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
    proxy: new ProxyProvider(),
    simulated: new SimulatedProvider(),
  };

  private listeners: Set<(state: AIServiceState) => void> = new Set();

  private state: AIServiceState = {
    isScanning: false,
    isAsking: false,
    isGeneratingSpec: false,
    activeOperation: null,
    statusMessage: 'AI Engine Ready',
    lastError: null,
    lastScanResult: null,
    askHistory: [],
  };

  public getState(): AIServiceState {
    return { ...this.state };
  }

  public subscribe(listener: (state: AIServiceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getState();
    this.listeners.forEach((l) => l(current));
  }

  private getActiveProvider(): IVisionLanguageProvider {
    const config = aiConfigService.getConfig();
    if (!config.enabled) {
      return this.providers.simulated;
    }
    return this.providers[config.provider] || this.providers.simulated;
  }

  public cancelActiveRequest() {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
      this.state.isScanning = false;
      this.state.isAsking = false;
      this.state.isGeneratingSpec = false;
      this.state.activeOperation = null;
      this.state.statusMessage = 'Request cancelled by user.';
      this.notify();
    }
  }

  /**
   * Phase 2 & 3: Reality Scan execution
   */
  public async scanPhysicalObject(
    video: HTMLVideoElement,
    box?: BoundingBox2D,
    mirrorCamera: boolean = true
  ): Promise<RealityScanResult> {
    const now = Date.now();
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL_MS) {
      console.warn('[AIService] Rate limiting scan request.');
      if (this.state.lastScanResult) return this.state.lastScanResult;
    }
    this.lastRequestTime = now;

    // Abort existing in-flight request if any
    this.cancelActiveRequest();
    this.activeController = new AbortController();

    this.state.isScanning = true;
    this.state.activeOperation = 'scan';
    this.state.lastError = null;
    this.state.statusMessage = 'Capturing physical object region...';
    this.notify();

    try {
      // 1. Process and crop frame
      const processed = ImageProcessor.captureROI(video, box, mirrorCamera);
      if (!processed) {
        throw new Error('Unable to capture camera frame. Ensure webcam is streaming.');
      }

      this.state.statusMessage = 'Submitting to multimodal vision engine...';
      this.notify();

      // 2. Query provider
      const provider = this.getActiveProvider();
      const result = await provider.analyzeObject(
        processed.fullBase64,
        `Dominant color: ${processed.dominantColorHex}`,
        this.activeController.signal
      );

      // Attach client-side captured thumbnails and bounding box
      result.thumbnailDataUrl = processed.thumbnailDataUrl;
      result.boundingBox = box;

      this.state.isScanning = false;
      this.state.activeOperation = null;
      this.state.statusMessage = `Analysis complete: ${result.objectName}`;
      this.state.lastScanResult = result;
      this.notify();

      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.state.statusMessage = 'Analysis cancelled.';
      } else {
        console.error('[AIService] Scan failed:', err);
        this.state.lastError = err.message || 'Vision analysis failed.';
        this.state.statusMessage = 'Analysis error occurred.';
      }
      this.state.isScanning = false;
      this.state.activeOperation = null;
      this.notify();
      throw err;
    } finally {
      this.activeController = null;
    }
  }

  /**
   * Phase 4: Ask Your Environment
   */
  public async askEnvironment(
    video: HTMLVideoElement,
    question: string,
    mirrorCamera: boolean = true
  ): Promise<string> {
    this.cancelActiveRequest();
    this.activeController = new AbortController();

    this.state.isAsking = true;
    this.state.activeOperation = 'ask';
    this.state.lastError = null;
    this.state.statusMessage = 'Analyzing physical space for inquiry...';

    const userMessage: AskRealityMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: Date.now(),
    };
    this.state.askHistory = [...this.state.askHistory, userMessage];
    this.notify();

    try {
      const processed = ImageProcessor.captureFullFrame(video, mirrorCamera);
      if (!processed) {
        throw new Error('Could not capture frame from webcam.');
      }

      const provider = this.getActiveProvider();
      const answer = await provider.askReality(
        processed.fullBase64,
        question,
        this.state.askHistory,
        this.activeController.signal
      );

      const assistantMessage: AskRealityMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: answer,
        timestamp: Date.now(),
        attachedImage: processed.thumbnailDataUrl,
      };

      this.state.isAsking = false;
      this.state.activeOperation = null;
      this.state.statusMessage = 'Inquiry answered.';
      this.state.askHistory = [...this.state.askHistory, assistantMessage];
      this.notify();

      return answer;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.state.lastError = err.message || 'Failed to process inquiry.';
        this.state.statusMessage = 'Inquiry failed.';
      }
      this.state.isAsking = false;
      this.state.activeOperation = null;
      this.notify();
      throw err;
    } finally {
      this.activeController = null;
    }
  }

  /**
   * Phase 5: Generate validated 3D object from prompt
   */
  public async generateSpecFromPrompt(
    prompt: string,
    context?: string
  ): Promise<AISpawnObjectSpec> {
    this.state.isGeneratingSpec = true;
    this.state.activeOperation = 'spawn';
    this.state.statusMessage = `Synthesizing 3D spec for "${prompt}"...`;
    this.notify();

    try {
      const provider = this.getActiveProvider();
      const spec = await provider.generateObjectSpec(prompt, context);
      this.state.isGeneratingSpec = false;
      this.state.activeOperation = null;
      this.state.statusMessage = `Generated 3D spec: ${spec.name}`;
      this.notify();
      return spec;
    } catch (e: any) {
      this.state.isGeneratingSpec = false;
      this.state.activeOperation = null;
      this.state.lastError = e.message || 'Failed to synthesize 3D object.';
      this.notify();
      throw e;
    }
  }

  public clearHistory() {
    this.state.askHistory = [];
    this.state.lastScanResult = null;
    this.state.lastError = null;
    this.notify();
  }
}

export const aiService = new AIService();

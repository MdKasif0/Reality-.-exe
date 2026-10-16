import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandData, Handedness, VisionState } from '../types';
import { LandmarkFilter } from '../utils/mathUtils';

export class MediaPipeService {
  private handLandmarker: HandLandmarker | null = null;
  private isProcessing: boolean = false;
  private lastVideoTime: number = -1;
  private filters: [LandmarkFilter, LandmarkFilter] = [
    new LandmarkFilter(0.65),
    new LandmarkFilter(0.65),
  ];
  private listeners: Set<(state: VisionState) => void> = new Set();

  private state: VisionState = {
    status: 'uninitialized',
    progress: 0,
    statusMessage: 'Vision engine in standby',
    hands: [],
    activeGesture: 'IDLE',
    gestureConfidence: 0,
    fps: 0,
    debugMode: false,
    paused: false,
    latencyMs: 0,
  };

  private frameCount: number = 0;
  private lastFpsCalcTime: number = performance.now();

  public getState(): VisionState {
    return { ...this.state };
  }

  public subscribe(listener: (state: VisionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public setPaused(paused: boolean) {
    this.state.paused = paused;
    this.notify();
  }

  public setDebugMode(debugMode: boolean) {
    this.state.debugMode = debugMode;
    this.notify();
  }

  public setSmoothingFactor(alpha: number) {
    this.filters[0].setAlpha(alpha);
    this.filters[1].setAlpha(alpha);
  }

  /**
   * Initializes HandLandmarker with robust local wasm & model assets,
   * falling back to Google/jsdelivr CDNs if local loading encounters any issues.
   */
  public async initialize(): Promise<void> {
    if (this.handLandmarker) {
      this.state.status = 'ready';
      this.notify();
      return;
    }

    this.state.status = 'loading';
    this.state.progress = 10;
    this.state.statusMessage = 'Initializing WebAssembly vision binaries...';
    this.notify();

    let vision: any = null;

    // 1. Try local wasm first
    try {
      console.log('[MediaPipe] Loading local WASM from /mediapipe/wasm...');
      vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      this.state.progress = 40;
      this.state.statusMessage = 'WASM loaded. Loading neural network model...';
      this.notify();
    } catch (localWasmErr) {
      console.warn('[MediaPipe] Local WASM failed, falling back to CDN:', localWasmErr);
      try {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.state.progress = 40;
        this.state.statusMessage = 'CDN WASM loaded. Loading neural network model...';
        this.notify();
      } catch (cdnErr) {
        console.error('[MediaPipe] CDN WASM fallback failed:', cdnErr);
        const errorMsg = 'Failed to load MediaPipe WASM runtime files. Please verify network access.';
        this.state.status = 'error';
        this.state.statusMessage = errorMsg;
        this.notify();
        throw new Error(errorMsg);
      }
    }

    // 2. Try local model asset, fallback to Google CDN
    const modelCandidates = [
      '/mediapipe/models/hand_landmarker.task',
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    ];

    let landmarker: HandLandmarker | null = null;
    let lastModelErr: any = null;

    for (const modelPath of modelCandidates) {
      try {
        console.log(`[MediaPipe] Attempting model load from: ${modelPath}`);
        this.state.statusMessage = `Compiling model from ${modelPath.startsWith('/') ? 'local assets' : 'cloud mirror'}...`;
        this.notify();

        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        if (landmarker) {
          console.log('[MediaPipe] HandLandmarker initialized successfully with GPU delegate!');
          break;
        }
      } catch (err: any) {
        lastModelErr = err;
        console.warn(`[MediaPipe] Failed with ${modelPath}, attempting next candidate...`, err);
        // Retry with CPU delegate if WebGL GPU compilation failed
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (landmarker) {
            console.log('[MediaPipe] HandLandmarker initialized successfully with CPU delegate!');
            break;
          }
        } catch (cpuErr) {
          lastModelErr = cpuErr;
        }
      }
    }

    if (!landmarker) {
      const errorMsg = `Failed to initialize Hand Landmarker model: ${lastModelErr?.message || 'Unknown error'}`;
      this.state.status = 'error';
      this.state.statusMessage = errorMsg;
      this.notify();
      throw new Error(errorMsg);
    }

    this.handLandmarker = landmarker;
    this.state.status = 'ready';
    this.state.progress = 100;
    this.state.statusMessage = 'Hand tracking engine operational';
    this.notify();
  }

  /**
   * Process a single video frame with concurrency lock and time check
   */
  public processVideoFrame(video: HTMLVideoElement, timestampMs: number): HandData[] {
    if (
      !this.handLandmarker ||
      this.isProcessing ||
      this.state.paused ||
      this.state.status !== 'ready'
    ) {
      return this.state.hands;
    }

    // Ensure video has actual dimensions and enough data
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      return this.state.hands;
    }

    // MediaPipe requires strictly strictly increasing timestamps
    if (timestampMs <= this.lastVideoTime) {
      timestampMs = this.lastVideoTime + 1;
    }
    this.lastVideoTime = timestampMs;

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      const results: HandLandmarkerResult = this.handLandmarker.detectForVideo(video, timestampMs);
      const hands: HandData[] = [];

      if (results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const rawLandmarks = results.landmarks[i];
          const handednessCategory = results.handedness?.[i]?.[0];
          // MediaPipe mirrored classification:
          const handedness: Handedness =
            handednessCategory?.categoryName === 'Left' ? 'Left' : 'Right';
          const score = handednessCategory?.score ?? 0.85;

          const filter = this.filters[i % 2];
          const smoothedLandmarks = filter.filter(rawLandmarks);

          hands.push({
            handedness,
            score,
            landmarks: rawLandmarks,
            smoothedLandmarks,
            worldLandmarks: results.worldLandmarks?.[i],
          });
        }
      } else {
        // Reset filters when tracking is lost
        this.filters[0].reset();
        this.filters[1].reset();
      }

      const elapsed = performance.now() - startTime;

      // Update FPS counter
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsCalcTime >= 1000) {
        this.state.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
        this.frameCount = 0;
        this.lastFpsCalcTime = now;
      }

      this.state.hands = hands;
      this.state.latencyMs = Math.round(elapsed);
      this.notify();

      return hands;
    } catch (err) {
      console.warn('[MediaPipe] Frame inference warning:', err);
      return this.state.hands;
    } finally {
      this.isProcessing = false;
    }
  }

  public resetFilters() {
    this.filters[0].reset();
    this.filters[1].reset();
  }

  public close() {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (err) {
        console.warn('Error closing HandLandmarker:', err);
      }
      this.handLandmarker = null;
    }
    this.state.status = 'uninitialized';
    this.state.hands = [];
    this.notify();
  }
}

export const mediaPipeService = new MediaPipeService();

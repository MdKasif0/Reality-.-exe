export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface RecorderState {
  status: RecordingStatus;
  durationSeconds: number;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  error: string | null;
}

type StateListener = (state: RecorderState) => void;

class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerId: number | null = null;
  private startTime: number = 0;
  private listeners: Set<StateListener> = new Set();

  private state: RecorderState = {
    status: 'idle',
    durationSeconds: 0,
    recordedBlob: null,
    recordedUrl: null,
    error: null,
  };

  public getState(): RecorderState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      'captureStream' in HTMLCanvasElement.prototype &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * Start recording the virtual 3D canvas
   */
  public startRecording(canvasElement?: HTMLCanvasElement): boolean {
    if (!this.isSupported()) {
      this.state.status = 'error';
      this.state.error = 'Canvas recording is not supported in this browser environment.';
      this.notify();
      return false;
    }

    // Locate 3D canvas if none provided
    const targetCanvas =
      canvasElement || (document.querySelector('canvas[data-engine="three.js"]') as HTMLCanvasElement) ||
      document.querySelector('canvas');

    if (!targetCanvas) {
      this.state.status = 'error';
      this.state.error = 'No active 3D canvas found to record.';
      this.notify();
      return false;
    }

    try {
      // 1. Capture stream at 30 FPS
      const stream = (targetCanvas as any).captureStream(30) as MediaStream;

      // 2. Select compatible mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let chosenMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          chosenMime = mime;
          break;
        }
      }

      this.recordedChunks = [];
      this.mediaRecorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 4_000_000 })
        : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        this.state.status = 'stopped';
        this.state.recordedBlob = blob;
        this.state.recordedUrl = url;
        this.notify();
      };

      this.mediaRecorder.start(200); // 200ms timeslices

      this.startTime = Date.now();
      this.state.status = 'recording';
      this.state.durationSeconds = 0;
      this.state.recordedBlob = null;
      this.state.recordedUrl = null;
      this.state.error = null;
      this.notify();

      // Duration counter
      if (this.timerId) window.clearInterval(this.timerId);
      this.timerId = window.setInterval(() => {
        this.state.durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        this.notify();
      }, 1000);

      return true;
    } catch (err: any) {
      console.error('[CanvasRecorder] Start recording failed:', err);
      this.state.status = 'error';
      this.state.error = err.message || 'Failed to start canvas recording.';
      this.notify();
      return false;
    }
  }

  /**
   * Stop recording
   */
  public stopRecording() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.mediaRecorder && this.state.status === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('MediaRecorder stop error:', e);
      }
    }
  }

  /**
   * Trigger download of the recorded clip
   */
  public downloadRecording(filename: string = `reality-exe-capture-${Date.now()}.webm`) {
    if (!this.state.recordedUrl) return;
    const a = document.createElement('a');
    a.href = this.state.recordedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public reset() {
    if (this.state.recordedUrl) {
      URL.revokeObjectURL(this.state.recordedUrl);
    }
    this.recordedChunks = [];
    this.state = {
      status: 'idle',
      durationSeconds: 0,
      recordedBlob: null,
      recordedUrl: null,
      error: null,
    };
    this.notify();
  }
}

export const canvasRecorder = new CanvasRecorder();

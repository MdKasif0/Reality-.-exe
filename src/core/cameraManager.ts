import { CameraState } from '../types';

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private listeners: Set<(state: CameraState) => void> = new Set();

  private state: CameraState = {
    status: 'idle',
    stream: null,
    deviceId: null,
    resolution: { width: 1280, height: 720 },
    error: null,
    isMirrored: true,
  };

  public getState(): CameraState {
    return { ...this.state };
  }

  public subscribe(listener: (state: CameraState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public attachVideoElement(element: HTMLVideoElement | null) {
    this.videoElement = element;
    if (element && this.stream) {
      element.srcObject = this.stream;
      element.play().catch((err) => {
        console.warn('Auto-play prevented or video play error:', err);
      });
    }
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public setMirrored(isMirrored: boolean) {
    this.state.isMirrored = isMirrored;
    this.notify();
  }

  /**
   * Request webcam stream with robust fallback resolutions and error categorization
   */
  public async requestCamera(): Promise<MediaStream> {
    if (this.stream && this.stream.active) {
      return this.stream;
    }

    this.state.status = 'requesting';
    this.state.error = null;
    this.notify();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Camera API is not supported in this browser. Please use Chrome, Edge, or a modern browser.';
      this.state.status = 'error';
      this.state.error = errorMsg;
      this.notify();
      throw new Error(errorMsg);
    }

    // Try optimal 720p 30/60fps first, fall back to lower constraints if needed
    const constraintTiers: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let lastError: any = null;

    for (const constraints of constraintTiers) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.stream = stream;

        // Get actual track settings
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          this.state.resolution = {
            width: settings.width || 1280,
            height: settings.height || 720,
          };
          this.state.deviceId = settings.deviceId || null;

          // Listen for sudden camera disconnects / track ended
          videoTrack.onended = () => {
            console.warn('[CameraManager] Camera track ended unexpectedly.');
            this.stopCamera();
          };
        }

        if (this.videoElement) {
          this.videoElement.srcObject = stream;
          await this.videoElement.play().catch((e) => console.warn('Video play delayed:', e));
        }

        this.state.status = 'ready';
        this.state.stream = stream;
        this.state.error = null;
        this.notify();

        return stream;
      } catch (err: any) {
        lastError = err;
        console.warn('[CameraManager] Constraint tier failed, trying next tier...', err.name);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          // User explicitly denied permission - don't keep trying tiers
          break;
        }
      }
    }

    // Map error to human-readable explanation
    let errorMsg = 'Failed to access camera.';
    if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
      errorMsg = 'Camera permission was denied. Please allow camera access in your browser settings to use gesture control.';
    } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
      errorMsg = 'No video camera detected on your device. Please connect a webcam.';
    } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
      errorMsg = 'Camera is already in use by another application or tab. Please close other camera apps and retry.';
    } else if (lastError?.name === 'OverconstrainedError') {
      errorMsg = 'Requested video resolution is not supported by your camera.';
    } else if (lastError?.message) {
      errorMsg = lastError.message;
    }

    this.state.status = 'error';
    this.state.error = errorMsg;
    this.notify();
    throw new Error(errorMsg);
  }

  /**
   * Complete teardown of camera tracks and resources
   */
  public stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.state.status = 'stopped';
    this.state.stream = null;
    this.notify();
  }

  public async restartCamera(): Promise<MediaStream> {
    this.stopCamera();
    return this.requestCamera();
  }
}

export const cameraManager = new CameraManager();

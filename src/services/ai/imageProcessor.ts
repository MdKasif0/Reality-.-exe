import { BoundingBox2D } from '../../types';

export interface ProcessedImageResult {
  fullBase64: string; // JPEG base64 without data URI prefix
  mimeType: 'image/jpeg';
  thumbnailDataUrl: string; // Compact thumbnail for HUD/memory cards
  dominantColorHex: string;
  brightness: number; // 0..1
  dimensions: { width: number; height: number };
}

export class ImageProcessor {
  /**
   * Captures a region-of-interest from a video element, compresses it,
   * and prepares base64 payload and thumbnail.
   */
  public static captureROI(
    video: HTMLVideoElement,
    box?: BoundingBox2D,
    mirrorCamera: boolean = true
  ): ProcessedImageResult | null {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      return null;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Default to center 60% crop if no box provided
    const cropBox: BoundingBox2D = box || {
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
    };

    // Calculate source pixel coordinates
    // If mirrored, the x coordinate in normalized screen space maps to (1 - (x + width)) in video space
    let srcX = cropBox.x * videoWidth;
    if (mirrorCamera) {
      srcX = (1 - (cropBox.x + cropBox.width)) * videoWidth;
    }
    const srcY = cropBox.y * videoHeight;
    const srcW = cropBox.width * videoWidth;
    const srcH = cropBox.height * videoHeight;

    // Clamp coordinates
    const clampedX = Math.max(0, Math.min(videoWidth - 10, srcX));
    const clampedY = Math.max(0, Math.min(videoHeight - 10, srcY));
    const clampedW = Math.max(20, Math.min(videoWidth - clampedX, srcW));
    const clampedH = Math.max(20, Math.min(videoHeight - clampedY, srcH));

    // Downscale target to max 1024px to optimize latency & token payload
    const maxDimension = 1024;
    let targetW = clampedW;
    let targetH = clampedH;

    if (targetW > maxDimension || targetH > maxDimension) {
      if (targetW > targetH) {
        targetH = Math.round((targetH / targetW) * maxDimension);
        targetW = maxDimension;
      } else {
        targetW = Math.round((targetW / targetH) * maxDimension);
        targetH = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // Draw cropped region from video (unmirrored natural view)
    ctx.drawImage(
      video,
      clampedX,
      clampedY,
      clampedW,
      clampedH,
      0,
      0,
      targetW,
      targetH
    );

    // Analyze color and brightness
    let dominantColorHex = '#38bdf8';
    let brightness = 0.5;
    try {
      const sample = ctx.getImageData(0, 0, Math.min(50, targetW), Math.min(50, targetH));
      let rSum = 0, gSum = 0, bSum = 0;
      const count = sample.data.length / 4;
      for (let i = 0; i < sample.data.length; i += 4) {
        rSum += sample.data[i];
        gSum += sample.data[i + 1];
        bSum += sample.data[i + 2];
      }
      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      dominantColorHex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
      brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114) / 255;
    } catch (e) {
      console.warn('Could not sample image data:', e);
    }

    // Export compressed JPEG base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const fullBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    // Create compact thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = Math.round((160 / targetW) * targetH);
    const thumbCtx = thumbCanvas.getContext('2d');
    let thumbnailDataUrl = dataUrl;
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
    }

    return {
      fullBase64,
      mimeType: 'image/jpeg',
      thumbnailDataUrl,
      dominantColorHex,
      brightness,
      dimensions: { width: targetW, height: targetH },
    };
  }

  /**
   * Captures entire frame from video without cropping
   */
  public static captureFullFrame(
    video: HTMLVideoElement,
    mirrorCamera: boolean = true
  ): ProcessedImageResult | null {
    return this.captureROI(
      video,
      { x: 0, y: 0, width: 1, height: 1 },
      mirrorCamera
    );
  }
}

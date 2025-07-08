export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

export class CameraManager {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async initialize(videoElement: HTMLVideoElement, config: CameraConfig): Promise<void> {
    this.video = videoElement;
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: config.width },
          height: { ideal: config.height },
          facingMode: { ideal: config.facingMode },
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      await new Promise<void>((resolve, reject) => {
        this.video!.onloadedmetadata = () => {
          this.video!.play()
            .then(() => resolve())
            .catch(reject);
        };
      });
    } catch (error) {
      console.error('Camera initialization error:', error);
      throw new Error('Failed to access camera');
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.video) return;

    const currentFacingMode = this.getCurrentFacingMode();
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    await this.stop();
    await this.initialize(this.video, {
      width: 1200,
      height: 1600,
      facingMode: newFacingMode,
    });
  }

  private getCurrentFacingMode(): 'user' | 'environment' {
    if (!this.stream) return 'environment';
    
    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    return settings.facingMode as 'user' | 'environment' || 'environment';
  }

  capturePhoto(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.video || !this.canvas) {
        reject(new Error('Camera not initialized'));
        return;
      }

      const context = this.canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to match video dimensions
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(this.video, 0, 0);

      // Convert canvas to blob
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture photo'));
        }
      }, 'image/jpeg', 0.9);
    });
  }

  async stop(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  isActive(): boolean {
    return this.stream !== null;
  }
}

import { useState, useRef, useCallback, useEffect } from 'react';

export interface CameraState {
  isStreaming: boolean;
  error: string | null;
  hasPermission: boolean;
  facingMode: 'environment' | 'user';
  availableCameras: MediaDeviceInfo[];
}

export interface CapturedFrame {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    isStreaming: false,
    error: null,
    hasPermission: false,
    facingMode: 'environment',
    availableCameras: [],
  });

  // Query available video devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameraState((prev) => ({ ...prev, availableCameras: videoDevices }));
    } catch (err) {
      console.warn('Error enumerating camera devices:', err);
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setCameraState((prev) => ({ ...prev, error: null }));

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser or secure context.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraState((prev) => ({
        ...prev,
        isStreaming: true,
        hasPermission: true,
        facingMode: facing,
        error: null,
      }));

      await enumerateDevices();
    } catch (err: any) {
      console.error('Camera access failed:', err);
      let errMsg = 'Could not start camera stream.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission denied. Please grant camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No video camera detected on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Camera is already in use by another application or locked.';
      } else if (err.message) {
        errMsg = err.message;
      }

      setCameraState((prev) => ({
        ...prev,
        isStreaming: false,
        hasPermission: false,
        error: errMsg,
      }));
    }
  }, [enumerateDevices]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  // Toggle between front and rear cameras
  const toggleCamera = useCallback(async () => {
    const nextFacing = cameraState.facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(nextFacing);
  }, [cameraState.facingMode, startCamera]);

  // Capture frame as JPEG Blob and Data URL
  const captureFrame = useCallback((quality = 0.85): Promise<CapturedFrame | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !streamRef.current || video.readyState < 2) {
        resolve(null);
        return;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            blob,
            dataUrl,
            width,
            height,
            timestamp: Date.now(),
          });
        },
        'image/jpeg',
        quality
      );
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    cameraState,
    startCamera,
    stopCamera,
    toggleCamera,
    captureFrame,
  };
};

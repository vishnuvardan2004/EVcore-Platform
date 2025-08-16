import { useState, useRef, useCallback } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { facingMode = 'environment', width = 640, height = 480 } = options;

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height }
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      
      return stream;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions.');
      return null;
    }
  }, [facingMode, width, height]);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      setError(null);
      
      if (!streamRef.current) {
        const stream = await requestPermission();
        if (!stream) {
          setIsCapturing(false);
          return null;
        }
      }
      
      return streamRef.current;
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Failed to access camera');
      setIsCapturing(false);
      return null;
    }
  }, [requestPermission]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !streamRef.current) {
      setError('Camera not ready');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to create canvas context');
        return null;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      setPhoto(photoData);
      setError(null);
      
      return photoData;
    } catch (err) {
      console.error('Failed to capture photo:', err);
      setError('Failed to capture photo');
      return null;
    }
  }, [width, height]);

  const takePhoto = useCallback(async () => {
    const stream = await startCamera();
    if (stream && videoRef.current) {
      // Wait for video to be ready
      return new Promise<string | null>((resolve) => {
        const video = videoRef.current!;
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          video.play();
          // Give a short delay for the camera to stabilize
          setTimeout(() => {
            const photoData = capturePhoto();
            stopCamera();
            resolve(photoData);
          }, 500);
        };
      });
    }
    return null;
  }, [startCamera, capturePhoto, stopCamera]);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  const createVideoElement = useCallback(() => {
    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.style.display = 'none';
    videoRef.current = video;
    document.body.appendChild(video);
    
    return () => {
      if (videoRef.current) {
        document.body.removeChild(videoRef.current);
        videoRef.current = null;
      }
    };
  }, []);

  return {
    photo,
    isCapturing,
    hasPermission,
    error,
    takePhoto,
    startCamera,
    stopCamera,
    capturePhoto,
    clearPhoto,
    requestPermission,
    createVideoElement
  };
}

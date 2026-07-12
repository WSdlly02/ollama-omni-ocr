import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, CameraOff, RefreshCcw, FlipHorizontal, Check, Trash2, Expand } from 'lucide-react';

interface CameraCaptureProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'captured' | 'error';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onFileChange, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [flash, setFlash] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [zoom, setZoom] = useState<1 | 2 | 3 | 5 | 10>(1);
  const ZOOM_LEVELS = [1, 2, 3, 5, 10] as const;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    stopStream();
    setCameraState('requesting');
    setErrorMsg('');
    setIsVideoReady(false);
    setZoom(1);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      // Do NOT touch videoRef here — the video element isn't mounted yet.
      // setCameraState('active') triggers a re-render which mounts the video,
      // and the useEffect below will connect the stream once it's in the DOM.
      setCameraState('active');
    } catch (err: any) {
      stopStream();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraState('error');
        setErrorMsg('No camera device found on this device.');
      } else {
        setCameraState('error');
        setErrorMsg(`Camera error: ${err.message}`);
      }
    }
  }, [stopStream]);

  // Connect stream to video element once it's mounted (after state transitions to 'active')
  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error('Video play failed:', err);
      });
    }
  }, [cameraState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!isVideoReady || w === 0 || h === 0) {
      stopStream();
      setErrorMsg('The camera did not produce a usable frame. Please try again.');
      setCameraState('error');
      return;
    }
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for front camera selfie
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Apply CSS zoom as a centre-crop on the captured frame
    if (zoom > 1) {
      const cropW = w / zoom;
      const cropH = h / zoom;
      const cropX = (w - cropW) / 2;
      const cropY = (h - cropH) / 2;
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, w, h);
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorMsg('The captured frame could not be converted to an image.');
        setCameraState('error');
        return;
      }
      const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      onFileChange(file);
      stopStream();
      setCameraState('captured');
      setPreviewFullscreen(true); // open fullscreen preview immediately after capture
    }, 'image/jpeg', 0.95);
  }, [facingMode, zoom, onFileChange, stopStream, isVideoReady]);

  const handleRetake = useCallback(() => {
    setCapturedUrl(null);
    onFileChange(null);
    startCamera(facingMode);
  }, [facingMode, startCamera, onFileChange]);

  const handleFlip = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (cameraState === 'active') {
      startCamera(next);
    }
  }, [facingMode, cameraState, startCamera]);

  const handleClear = useCallback(() => {
    setCapturedUrl(null);
    onFileChange(null);
    setCameraState('idle');
  }, [onFileChange]);

  // ── Idle state ──────────────────────────────────────────────────
  if (cameraState === 'idle') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm">
          <Camera className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center px-6">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Take a Photo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Use your device camera to capture text or images.</p>
        </div>
        <button
          onClick={() => startCamera(facingMode)}
          disabled={disabled}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          <Camera size={18} />
          Open Camera
        </button>
      </div>
    );
  }

  // ── Requesting / Loading ─────────────────────────────────────────
  if (cameraState === 'requesting') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full relative">
          <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Requesting camera access…</p>
      </div>
    );
  }

  // ── Permission denied / Error ────────────────────────────────────
  if (cameraState === 'denied' || cameraState === 'error') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <CameraOff className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">
            {cameraState === 'denied' ? 'Permission Denied' : 'Camera Unavailable'}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 max-w-sm">{errorMsg}</p>
        </div>
        <button
          onClick={() => setCameraState('idle')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCcw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ── Captured: inline thumbnail ───────────────────────────────────
  if (cameraState === 'captured' && capturedUrl && !previewFullscreen) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
        <img
          src={capturedUrl}
          alt="Captured"
          className="w-full object-contain max-h-[420px] block"
        />
        {/* Expand to fullscreen */}
        <button
          onClick={() => setPreviewFullscreen(true)}
          title="View fullscreen"
          className="absolute top-3 left-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all"
        >
          <Expand size={16} />
        </button>
        {/* Trash — clears the photo */}
        <button
          onClick={handleClear}
          disabled={disabled}
          title="Remove photo"
          className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  // ── Captured: fullscreen portal ──────────────────────────────────
  if (cameraState === 'captured' && capturedUrl && previewFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none">
        {/* Photo — object-contain so the full image is always visible */}
        <img
          src={capturedUrl}
          alt="Captured"
          className="flex-1 w-full min-h-0 object-contain"
        />

        {/* Bottom bar: Retake (left) + Done (right) */}
        <div
          className="shrink-0 flex items-center justify-between px-10 bg-black"
          style={{ paddingTop: 20, paddingBottom: `calc(20px + env(safe-area-inset-bottom, 0px))` }}
        >
          <button
            onClick={handleRetake}
            disabled={disabled}
            className="flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full text-sm font-medium transition-all"
          >
            <RefreshCcw size={16} />
            Retake
          </button>
          <button
            onClick={() => setPreviewFullscreen(false)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-full text-sm font-semibold transition-all"
          >
            <Check size={16} />
            Done
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // ── Active camera viewfinder (fullscreen portal) ──────────────────
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none">
      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-[flash_0.2s_ease-out]" />
      )}

      {/* Video — fills all available space above controls, CSS zoom via scale */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease',
          }}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={() => setIsVideoReady(true)}
        />
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Zoom selector */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-2 bg-black">
        {ZOOM_LEVELS.map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z as 1 | 2 | 3 | 5 | 10)}
            className={`w-10 h-10 rounded-full text-xs font-bold transition-all active:scale-90 ${
              zoom === z
                ? 'bg-amber-400 text-black shadow-lg'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            {z}×
          </button>
        ))}
      </div>

      {/* Controls bar — shrink-0 prevents it from being squeezed */}
      <div
        className="shrink-0 flex items-center justify-around px-8 bg-black"
        style={{ paddingTop: 20, paddingBottom: `calc(20px + env(safe-area-inset-bottom, 0px))` }}
      >
        {/* Cancel */}
        <button
          onClick={() => { stopStream(); setCameraState('idle'); onFileChange(null); }}
          disabled={disabled}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
          title="Close camera"
        >
          <CameraOff size={20} />
        </button>

        {/* Shutter */}
        <button
          onClick={handleCapture}
          disabled={disabled || !isVideoReady}
          className="w-18 h-18 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-90 transition-all shadow-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-wait"
          style={{ width: 72, height: 72 }}
          title="Take photo"
        >
          <div className="rounded-full bg-white" style={{ width: 52, height: 52 }} />
        </button>

        {/* Flip camera */}
        <button
          onClick={handleFlip}
          disabled={disabled}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all"
          title="Flip camera"
        >
          <FlipHorizontal size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default CameraCapture;

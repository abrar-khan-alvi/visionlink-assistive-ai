
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onFrame: (base64: string) => void;
  isScanning: boolean;
  scanInterval?: number;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isScanning, scanInterval = 3000 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    }
    setupCamera();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isScanning && hasPermission) {
      interval = window.setInterval(() => {
        captureFrame();
      }, scanInterval);
    }
    return () => clearInterval(interval);
  }, [isScanning, hasPermission, scanInterval]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      onFrame(base64);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900 text-white p-8 text-center">
        <p className="text-2xl font-bold">Camera access denied. Please enable camera permissions to use VisionLink.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Visual Scanning Effect */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-1 bg-yellow-400/50 w-full animate-[bounce_2s_infinite]" />
          <div className="absolute inset-0 border-4 border-yellow-400/20 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default CameraView;

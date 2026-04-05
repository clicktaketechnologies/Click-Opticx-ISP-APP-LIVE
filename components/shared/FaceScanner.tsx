import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Scan, X } from 'lucide-react';

interface FaceScannerProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const FaceScanner: React.FC<FaceScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    // Start Camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied", err);
        setHasPermission(false);
      }
    };
    startCamera();

    return () => {
      // Cleanup stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const triggerScan = () => {
    setIsScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        captureAndFinish();
      }
    }, 100);
  };

  const captureAndFinish = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add artificial watermarks / scanning overlay lines on the final image for premium feel
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(canvas.width/2 - 150, canvas.height/2 - 200, 300, 400);

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setIsScanning(false);
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col group animate-in fade-in zoom-in-95 duration-500">
      
      {/* Top Bar Navigation */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse border border-red-300"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Live Feed</span>
        </div>
        <button onClick={onCancel} className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10">
          <X size={16} />
        </button>
      </div>

      {hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 z-10">
           <Camera size={48} className="text-slate-700 mb-4" />
           <p className="text-white font-bold mb-1">Camera Access Required</p>
           <p className="text-slate-400 text-xs font-semibold">Please allow camera permissions in your browser settings to verify your identity.</p>
        </div>
      )}

      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none"
      />

      {/* Scanning HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8 z-20 mix-blend-screen">
          {/* Facial Framing Box */}
          <div className="w-[280px] h-[360px] relative">
              <svg width="100%" height="100%" viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                 {/* Top Left */}
                 <path d="M40 0H20C8.9543 0 0 8.95431 0 20V40" stroke={isScanning ? "#3B82F6" : "#22C55E"} strokeWidth="4" strokeLinecap="round" className="transition-colors duration-500" />
                 {/* Top Right */}
                 <path d="M240 0H260C271.046 0 280 8.95431 280 20V40" stroke={isScanning ? "#3B82F6" : "#22C55E"} strokeWidth="4" strokeLinecap="round" className="transition-colors duration-500" />
                 {/* Bottom Left */}
                 <path d="M0 320V340C0 351.046 8.9543 360 20 360H40" stroke={isScanning ? "#3B82F6" : "#22C55E"} strokeWidth="4" strokeLinecap="round" className="transition-colors duration-500" />
                 {/* Bottom Right */}
                 <path d="M280 320V340C280 351.046 271.046 360 260 360H240" stroke={isScanning ? "#3B82F6" : "#22C55E"} strokeWidth="4" strokeLinecap="round" className="transition-colors duration-500" />
              </svg>
              
              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-scan-laser top-0"></div>
              )}
          </div>
      </div>

      <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 pointer-events-none">
         {/* Instruction / Progress Bar */}
         <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 w-full max-w-sm mx-auto shadow-2xl pointer-events-auto transition-transform duration-500 translate-y-0 group-hover:-translate-y-2">
            {!isScanning ? (
              <div className="space-y-4">
                 <div className="text-center">
                    <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Position Your Face</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-700/50 pt-2 mx-4">Ensure adequate lighting and look directly into the camera.</p>
                 </div>
                 <button 
                  onClick={triggerScan}
                  disabled={!hasPermission}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 text-black border border-green-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                 >
                   Initiate Biometric Scan
                 </button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                       <RefreshCw size={14} className="animate-spin" />
                       Analyzing Matrix...
                    </div>
                    <span className="text-blue-400 font-bold text-xs">{scanProgress}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all ease-linear"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                 </div>
              </div>
            )}
         </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Global CSS for scanning animation specifically targeted here */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FaceScanner;

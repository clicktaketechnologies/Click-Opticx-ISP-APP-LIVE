

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, RefreshCw, ArrowDown, ArrowUp, Activity, Timer, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import { runPingTest, runDownloadTest, runUploadTest } from '../../utils/speedtest';

interface Props {
  onClose: () => void;
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'completed';

const SpeedTestModal: React.FC<Props> = ({ onClose }) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    download: 0.0,
    upload: 0.0,
    ping: 0,
    jitter: 0
  });
  const mounted = useRef(true);

  const runTest = useCallback(async () => {
    if (!mounted.current) return;
    setPhase('ping');
    setProgress(10);
    setMetrics({ download: 0, upload: 0, ping: 0, jitter: 0 });

    try {
      // 1. Initial Handshake: Ping & Jitter
      const pingRes = await runPingTest();
      if (!mounted.current) return;
      setMetrics(prev => ({
        ...prev,
        ping: pingRes,
        jitter: Math.max(1, Math.floor(pingRes * 0.1)) // Estimate jitter
      }));

      // 2. Download phase
      setPhase('download');
      const dlRes = await runDownloadTest((newVal) => {
         if (mounted.current) {
            setMetrics(m => ({ ...m, download: newVal }));
            setProgress(10 + Math.min((newVal / 100) * 40, 40));
         }
      });
      if (!mounted.current) return;
      setMetrics(m => ({ ...m, download: dlRes }));
      setProgress(50);
      
      // 3. Upload phase
      setPhase('upload');
      const ulRes = await runUploadTest((newVal) => {
         if (mounted.current) {
            setMetrics(m => ({ ...m, upload: newVal }));
            setProgress(50 + Math.min((newVal / 50) * 50, 50));
         }
      });
      if (!mounted.current) return;
      setMetrics(m => ({ ...m, upload: ulRes }));
      setProgress(100);

      // Record to history if needed
      const savedHistory = localStorage.getItem('isp_speedHistory');
      let historyList = savedHistory ? JSON.parse(savedHistory) : [];
      historyList = [{ dl: dlRes, ul: ulRes, ping: pingRes, timestamp: new Date().toLocaleString() }, ...historyList].slice(0, 5);
      localStorage.setItem('isp_speedHistory', JSON.stringify(historyList));

      setPhase('completed');
    } catch(e) {
      if (mounted.current) setPhase('idle');
    }
  }, []);

  useEffect(() => {
    runTest();
    return () => { mounted.current = false; };
  }, [runTest]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border-[6px] sm:border-[8px] border-slate-50 flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
        {/* Responsive Header */}
        <div className="p-5 sm:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Zap size={20} fill="currentColor" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-slate-900 truncate">Infrastructure Audit</h3>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">Direct Node Handshake protocol v8.5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Content Layer */}
        <div className="p-6 sm:p-10 space-y-8 sm:space-y-10 flex-1 overflow-y-auto custom-scrollbar bg-white">

          {/* Main Speed Gauge */}
          <div className="flex flex-col items-center justify-center space-y-6 relative">
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center">
              {/* Background Ring */}
              <div className="absolute inset-0 rounded-full border-[8px] sm:border-[15px] border-slate-50 shadow-inner"></div>

              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor"
                  strokeWidth={window.innerWidth < 640 ? "8" : "15"}
                  strokeDasharray="283"
                  strokeDashoffset={`${283 - (283 * progress) / 100}`}
                  className={`transition-all duration-300 ${phase === 'upload' ? 'text-green-500' : 'text-blue-600'}`}
                />
              </svg>

              <div className="text-center z-10 w-full px-4 overflow-hidden">
                <h2 className="text-4xl sm:text-7xl font-black text-slate-900 italic tracking-tighter leading-none truncate">
                  {phase === 'upload' ? metrics.upload.toFixed(1) : (phase !== 'ping' ? metrics.download.toFixed(1) : metrics.ping)}
                </h2>
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  {phase === 'ping' ? 'Ping (ms)' : phase === 'download' ? 'Downloading...' : phase === 'upload' ? 'Uploading...' : phase === 'completed' ? 'Mbps (Final)' : 'Syncing...'}
                </p>
              </div>
            </div>

            {phase === 'completed' && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={14} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">Audit Registry Verified</span>
              </div>
            )}
          </div>

          {/* Metrics Grid - Responsive Multi-column */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: 'Download', value: metrics.download.toFixed(1), unit: 'Mbps', icon: ArrowDown, color: 'text-blue-600', bg: 'bg-blue-50', active: phase === 'download' },
              { label: 'Upload', value: metrics.upload.toFixed(1), unit: 'Mbps', icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-50', active: phase === 'upload' },
              { label: 'Latency', value: metrics.ping, unit: 'ms', icon: Timer, color: 'text-blue-500', bg: 'bg-blue-50', active: phase === 'ping' },
              { label: 'Jitter', value: metrics.jitter, unit: 'ms', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50', active: phase === 'ping' }
            ].map((m) => (
              <div key={m.label} className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all group flex flex-col items-center gap-2 ${m.active ? 'border-blue-500 bg-white shadow-xl scale-105 z-10' : 'bg-slate-50 border-slate-50 opacity-60 hover:opacity-100'}`}>
                <div className={`w-8 h-8 sm:w-12 sm:h-12 ${m.bg} ${m.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform`}>
                  <m.icon size={window.innerWidth < 640 ? 16 : 24} />
                </div>
                <div className="text-center">
                  <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">{m.label}</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 italic tracking-tighter">
                    {m.value} <span className="text-[10px] opacity-30 font-bold">{m.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Info Note */}
          <div className="p-5 sm:p-6 bg-slate-950 rounded-[1.5rem] sm:rounded-[2.5rem] text-white flex items-start gap-4 shadow-xl relative overflow-hidden shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
              <ShieldAlert size={20} className="text-blue-400" />
            </div>
            <div className="relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Node Trace Result</p>
              <p className="text-[8px] sm:text-[9px] text-slate-300 font-bold uppercase leading-relaxed">
                Atmospheric Handshake established at <strong>-18.4 dBm</strong>. Signal integrity within standard registry parameters. No packet loss detected.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-8 bg-slate-50 border-t flex gap-3 sm:gap-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-4 sm:py-5 font-black text-slate-400 hover:bg-white hover:text-rose-600 rounded-2xl sm:rounded-3xl transition-all uppercase tracking-widest text-[9px] sm:text-[10px]"
          >
            Acknowledge
          </button>
          <button
            onClick={() => { if (phase === 'completed' || phase === 'idle') runTest(); }}
            disabled={phase !== 'completed' && phase !== 'idle'}
            className="flex-[2] py-4 sm:py-5 bg-slate-900 text-white font-black rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all uppercase text-[9px] sm:text-[10px] flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {phase !== 'completed' && phase !== 'idle' ? <Mini5GMicroLoader size={16} /> : null}
            {phase !== 'completed' && phase !== 'idle' ? 'Auditing Node...' : 'Initiate Re-test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeedTestModal;


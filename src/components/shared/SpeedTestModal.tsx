import React, { useState, useEffect, useCallback } from 'react';
import { X, Zap, ArrowDown, ArrowUp, Activity, RotateCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SpeedTestEngine, SpeedTestResult } from '../../utils/speedtest';
import { db } from '../../../db';

interface SpeedTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    backendUrl: string;
}

const SpeedTestModal: React.FC<SpeedTestModalProps> = ({ isOpen, onClose, backendUrl }) => {
    const [result, setResult] = useState<SpeedTestResult>({
        downloadMbps: 0,
        uploadMbps: 0,
        latencyMs: 0,
        jitterMs: 0,
        status: 'idle'
    });
    const [progress, setProgress] = useState(0);
    const [engine] = useState(() => new SpeedTestEngine(backendUrl));

    const runTest = useCallback(async () => {
        try {
            setResult(prev => ({ ...prev, status: 'ping' }));
            setProgress(0);

            // Phase 1: Latency
            const { latency, jitter } = await engine.measureLatency((_, p) => setProgress(p));
            setResult(prev => ({ ...prev, latencyMs: latency, jitterMs: jitter, status: 'download' }));
            setProgress(0);

            // Phase 2: Download
            const dl = await engine.measureDownload((_, p, speed) => {
                setProgress(p);
                if (speed) setResult(prev => ({ ...prev, downloadMbps: speed }));
            });
            setResult(prev => ({ ...prev, downloadMbps: dl, status: 'upload' }));
            setProgress(0);

            // Phase 3: Upload
            const ul = await engine.measureUpload((_, p, speed) => {
                setProgress(p);
                if (speed) setResult(prev => ({ ...prev, uploadMbps: speed }));
            });
            
            const finalResult: SpeedTestResult = {
                downloadMbps: dl,
                uploadMbps: ul,
                latencyMs: latency,
                jitterMs: jitter,
                status: 'complete'
            };
            
            setResult(finalResult);
            setProgress(100);

            // Log result to Audit Trail
            await db.logAudit('speed_test', 'INFO', JSON.stringify({
                ...finalResult,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }));

        } catch (error: any) {
            setResult(prev => ({ ...prev, status: 'error', error: error.message }));
        }
    }, [engine]);

    useEffect(() => {
        if (isOpen) {
            runTest();
        }
        return () => engine.abort();
    }, [isOpen, runTest, engine]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 w-full"></div>
                
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-500 shadow-xl">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Premium Node Diagnostic</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Live Handshake: {backendUrl}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Monitor */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                    {result.status === 'ping' ? 'Syncing Latency Matrix...' :
                                     result.status === 'download' ? 'Sampling Downlink Bandwidth...' :
                                     result.status === 'upload' ? 'Validating Uplink Saturation...' :
                                     result.status === 'complete' ? 'Protocol Analysis Complete' : 'Awaiting Ignition'}
                                </span>
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white italic">{progress}%</span>
                        </div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out shadow-lg shadow-blue-500/20"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Metric Display Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <MetricCard 
                            label="Downlink" 
                            value={result.downloadMbps.toFixed(1)} 
                            unit="Mbps" 
                            icon={ArrowDown} 
                            active={result.status === 'download'} 
                            color="text-blue-500"
                        />
                        <MetricCard 
                            label="Uplink" 
                            value={result.uploadMbps.toFixed(1)} 
                            unit="Mbps" 
                            icon={ArrowUp} 
                            active={result.status === 'upload'} 
                            color="text-emerald-500"
                        />
                        <MetricCard 
                            label="Latency" 
                            value={result.latencyMs.toString()} 
                            unit="ms" 
                            icon={Activity} 
                            active={result.status === 'ping'} 
                            color="text-amber-500"
                        />
                        <MetricCard 
                            label="Jitter" 
                            value={result.jitterMs.toString()} 
                            unit="ms" 
                            icon={RotateCw} 
                            active={result.status === 'ping'} 
                            color="text-indigo-500"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-4">
                        {result.status === 'complete' ? (
                            <button 
                                onClick={runTest}
                                className="flex-1 py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] italic flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                            >
                                <RotateCw size={18} /> Relaunch Protocol
                            </button>
                        ) : result.status === 'error' ? (
                            <div className="w-full flex flex-col gap-4">
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle size={20} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{result.error}</p>
                                </div>
                                <button onClick={runTest} className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest italic flex items-center justify-center gap-3">
                                    <RotateCw size={18} /> Retry Engine
                                </button>
                            </div>
                        ) : (
                            <div className="w-full py-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-[2rem] flex items-center justify-center gap-3">
                                <Activity size={18} className="text-blue-500 animate-spin" />
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">Node Analysis in Progress</span>
                            </div>
                        )}
                    </div>
                    
                    {result.status === 'complete' && (
                        <div className="flex items-center justify-center gap-2 text-emerald-500 animate-in slide-in-from-bottom-2">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Node Verified • Telemetry Cached</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon: Icon, active, color }: any) => (
    <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center text-center group ${active ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 animate-pulse' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700'}`}>
        <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm mb-4 transition-transform group-hover:scale-110 ${color}`}>
            <Icon size={20} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{value}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase italic">{unit}</span>
        </div>
    </div>
);

export default SpeedTestModal;

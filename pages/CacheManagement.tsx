import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState } from '../types';
import { db } from '../db';
import {
    RotateCw, Trash2, ShieldAlert, Cpu,
    HardDrive, Monitor, Zap, CheckCircle2,
    XCircle, Loader2, AlertTriangle, ShieldCheck,
    DatabaseZap
} from 'lucide-react';

const CacheManagement: React.FC<{ state: AppState }> = ({ state }) => {
    const [isClearingWorkers, setIsClearingWorkers] = useState(false);
    const [isClearingStorage, setIsClearingStorage] = useState(false);
    const [healthStatus, setHealthStatus] = useState<'IDLE' | 'CHECKING' | 'HEALTHY'>('IDLE');

    const handleClearServiceWorkers = async () => {
        setIsClearingWorkers(true);
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
                db.logNotification('all', 'success', 'Cache Purged', 'All environment service workers have been decommissioned.');
            } else {
                db.logNotification('all', 'error', 'Purge Failed', 'Service Worker API not available in this node.');
            }
        } catch (err) {
            db.logNotification('all', 'error', 'Purge Error', 'Handshake failure during worker decommissioning.');
        } finally {
            setTimeout(() => setIsClearingWorkers(false), 800);
        }
    };

    const handleClearStorage = () => {
        setIsClearingStorage(true);
        try {
            localStorage.clear();
            sessionStorage.clear();
            db.logNotification('all', 'success', 'Registry Reset', 'Local storage and session nodes have been wiped.');
        } catch (err) {
            db.logNotification('all', 'error', 'Reset Error', 'Failed to clear local registry nodes.');
        } finally {
            setTimeout(() => setIsClearingStorage(false), 800);
        }
    };

    const handleHardRefresh = () => {
        db.logNotification('all', 'info', 'System Reboot', 'Initializing hard location refresh sequence...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const checkSystemHealth = () => {
        setHealthStatus('CHECKING');
        setTimeout(() => {
            setHealthStatus('HEALTHY');
            db.logNotification('all', 'success', 'Health Verified', 'System cache integrity verified. Production layer is responsive.');
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 leading-none italic uppercase">
                        <Cpu className="text-blue-600" size={32} />
                        Cache Control Plane
                    </h2>
                    <p className="text-slate-500 font-medium max-w-2xl mt-1 uppercase text-[10px] tracking-widest">
                        System Level Maintenance Node • <strong>v8.6.0 Stable</strong>
                    </p>
                </div>

                <button
                    onClick={checkSystemHealth}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                >
                    {healthStatus === 'CHECKING' ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18} className="text-green-400" />}
                    System Health Pulse
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Memory Registry Purge</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-md">
                                    Flush all locally stored application data and tokens. This will reset the UI state and log out the current session.
                                </p>
                            </div>
                            <button
                                onClick={handleClearStorage}
                                disabled={isClearingStorage}
                                className="px-8 py-5 bg-rose-50 text-rose-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-3 border border-rose-100 shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {isClearingStorage ? <Mini5GMicroLoader size={18} /> : <Trash2 size={18} />}
                                Clear Local Cache
                            </button>
                        </div>

                        <div className="h-px bg-slate-50 w-full" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Worker Decommissioning</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-md">
                                    Unregister high-level service workers that might be pinning old code assets to the browser.
                                </p>
                            </div>
                            <button
                                onClick={handleClearServiceWorkers}
                                disabled={isClearingWorkers}
                                className="px-8 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {isClearingWorkers ? <Mini5GMicroLoader size={18} /> : <RotateCw size={18} />}
                                Reset Service Workers
                            </button>
                        </div>

                        <div className="h-px bg-slate-50 w-full" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Hard System Reboot</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-md">
                                    Perform a location-level reload while bypassing the regular browser cache layer.
                                </p>
                            </div>
                            <button
                                onClick={handleHardRefresh}
                                className="px-8 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-200 active:scale-95"
                            >
                                <Zap size={18} fill="currentColor" />
                                Force Hard Refresh
                            </button>
                        </div>

                        <Monitor className="absolute -right-16 -bottom-16 opacity-[0.02] scale-[3] pointer-events-none text-slate-900" size={300} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl h-full border border-white/5 flex flex-col justify-between">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-900/40">
                                    <AlertTriangle size={20} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest">Administrator Protocol</h4>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase opacity-80 italic">
                                These tools are designed to force-sync nodes that have fallen out of phase with the live production registry.
                            </p>
                            <div className="space-y-3 pt-4">
                                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <CheckCircle2 className="text-green-500" size={16} />
                                    <span className="text-[9px] font-black uppercase">Live Node Version: v8.6.0</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <Zap className="text-amber-500" size={16} />
                                    <span className="text-[9px] font-black uppercase">Registry Refresh: Required</span>
                                </div>
                            </div>
                        </div>
                        <ShieldAlert className="absolute -right-8 -bottom-8 opacity-5" size={180} />
                    </div>
                </div>
            </div>

            <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
                <div className="flex items-start gap-6 flex-1">
                    <ShieldAlert className="text-amber-600 mt-1 shrink-0" size={32} />
                    <div className="space-y-2 text-left">
                        <p className="text-[12px] font-black text-amber-900 uppercase tracking-widest italic leading-none">Global Infrastructure Wipe Authorized</p>
                        <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase opacity-80">
                            SETTING A GLOBAL WIPE TIMESTAMP WILL FORCE ALL CONNECTED CLIENT DEVICES (SUBSCRIBERS & STAFF) TO CLEAR THEIR LOCAL CACHE AND RE-SYNC WITH THE MASTER REGISTRY ON THEIR NEXT HANDSHAKE. USE ONLY FOR CRITICAL PLATFORM UPDATES.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (confirm('AUTHORIZE GLOBAL WIPE: This will force a platform-wide state refresh for ALL users. Proceed?')) {
                            db.triggerGlobalWipe();
                        }
                    }}
                    className="px-10 py-5 bg-amber-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 active:scale-95 whitespace-nowrap flex items-center gap-3"
                >
                    <DatabaseZap size={18} />
                    Execute Global Wipe
                </button>
            </div>
        </div>
    );
};

export default CacheManagement;


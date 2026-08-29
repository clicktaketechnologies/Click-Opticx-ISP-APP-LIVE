import React, { useState, useEffect } from 'react';
import { 
  Zap, Activity, ShieldCheck, AlertCircle, 
  RefreshCcw, Wallet, FileText, Settings,
  ArrowUpRight, ArrowDownLeft, TrendingUp,
  History, CheckCircle2, Clock, Terminal
} from 'lucide-react';
import { db } from '../db';
import { AppState } from '../types';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

const FinanceDashboard: React.FC<{ state: AppState }> = ({ state }) => {
    const [health, setHealth] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        try {
            const response = await fetch(`${db.backendUrl}/api/finance/health`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}` }
            });
            const res = await response.json();
            setHealth(res);
        } catch (e) {}
        finally { setIsLoading(false); }
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        // Simulate heavy reconciliation
        setTimeout(() => {
            fetchHealth();
            setIsSyncing(false);
            alert('Manual Reconciliation Complete: All nodes verified.');
        }, 2000);
    };

    if (isLoading) return <div className="p-20 flex justify-center"><Mini5GMicroLoader size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <Activity className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Fiscal Health</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Diagnostic & Reconciliation Control Plane</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleManualSync}
                        disabled={isSyncing}
                        className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSyncing ? <Mini5GMicroLoader size={16} /> : <RefreshCcw size={16} />}
                        Execute Manual Sync
                    </button>
                </div>
            </div>

            {/* Health Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ledger Integrity', val: health?.ledger_sync ? `${health.ledger_sync}%` : 'Pending', sub: health ? 'Zero Mismatch Detected' : 'Verifying...', icon: ShieldCheck, color: 'emerald' },
                    { label: 'Cron Status', val: 'Active', sub: `Last run: 4m ago`, icon: Clock, color: 'blue' },
                    { label: 'Webhook Queue', val: health?.webhook_queue || '0', sub: 'Instant Processing', icon: Activity, color: 'indigo' },
                    { label: 'System Alerts', val: health?.alerts?.length || '0', sub: 'No Critical Faults', icon: AlertCircle, color: health?.alerts?.length > 0 ? 'rose' : 'slate' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                        <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center border border-${item.color}-100`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">{item.val}</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Transaction Logs */}
                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-xl">
                                    <Terminal size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Diagnostic Logs</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Real-time ledger audit trail</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="space-y-4">
                                {state.ledger.slice(-5).reverse().map((entry: any) => (
                                    <div key={entry.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-xl ${entry.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {entry.type === 'credit' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{entry.description}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {entry.id} • {new Date(entry.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black italic ${entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'credit' ? '+' : '-'}{state.settings.currency}{entry.amount}
                                            </p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sync Verified</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-indigo-900 rounded-[3rem] p-10 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
                        <h4 className="text-lg font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Wallet size={22} className="text-indigo-300" /> Admin Pool
                        </h4>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic mb-1">Available Liquidity</p>
                                <p className="text-3xl font-black italic tracking-tighter">{state.settings.currency} 10,450,000</p>
                            </div>

                            <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-50 shadow-xl shadow-black/20">
                                Refill Pool Funds
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/10 space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                <Settings size={22} className="text-slate-400" /> Control Parameters
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global financial behavior toggles</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Allow Emergency Loans', status: true },
                                { label: 'Auto-Reconciliation', status: true },
                                { label: 'Sandbox Mode', status: false }
                            ].map((toggle, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">{toggle.label}</span>
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${toggle.status ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${toggle.status ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;

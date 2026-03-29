import React, { useState, useMemo } from 'react';
import { 
    Zap, Calendar, ShieldAlert, History, CheckCircle2, 
    X, AlertTriangle, Info, ArrowRight, Database, Receipt,
    ShieldCheck, Trash2, Clock, User, Settings
} from 'lucide-react';
import { AppState, FlashLog, UserStatus, PaymentStatus } from '../types';
import { db } from '../db';
import ModuleGuide from '../components/shared/ModuleGuide';

const SystemFlash: React.FC<{ state: AppState }> = ({ state }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
    const [resetUsage, setResetUsage] = useState(false);
    const [removeInvoices, setRemoveInvoices] = useState(false);
    const [reason, setReason] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmText, setFlashConfirmText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const flashStatus = useMemo(() => {
        return state.flashLogs.find(f => f.month === selectedMonth);
    }, [state.flashLogs, selectedMonth]);

    const handleFlash = async () => {
        if (confirmText !== 'CONFIRM FLASH') {
            alert('Please type CONFIRM FLASH exactly as shown.');
            return;
        }

        setIsProcessing(true);
        try {
            const adminId = state.currentUser?.email || 'system';
            const res = await db.flashSystem(selectedMonth, { resetUsage, removeInvoices, reason }, adminId);
            if (res.success) {
                alert(`✓ System Flashed successfully for ${selectedMonth}. ${res.count} users reset.`);
                setIsConfirmModalOpen(false);
                setFlashConfirmText('');
                setReason('');
            }
        } catch (error) {
            console.error('Flash failure:', error);
            alert('System reset failed. check logs.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <ModuleGuide
                moduleName="System Flash (System Reset Mode)"
                description="High-friction bulk reset for monthly billing cycles and user statuses."
                items={[
                    { title: "FLASH Meaning", description: "Resets all users to N/A package status and Inactive state for the selected month." },
                    { title: "Invoice Policy", description: "Optional removal of pending/unpaid invoices to prevent double billing or errors." },
                    { title: "Safety Protocol", description: "This action is logged and requires manual confirmation. It cannot be easily undone." }
                ]}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                        <Zap className="text-red-600 fill-red-600/20" size={32} />
                        System Flash Terminal
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Monthly Deployment & Operational Reset Console</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                <Settings className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Flash Configuration</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Billing Month</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input 
                                            type="month" 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-red-500/10 transition-all uppercase tracking-widest"
                                        />
                                    </div>
                                    {flashStatus && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 animate-pulse">
                                            <AlertTriangle size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Warning: Month already flashed on {new Date(flashStatus.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reason (Internal Log)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Monthly Cycle Cleanup, Deployment Error Fix..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:font-medium placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                    onClick={() => setResetUsage(!resetUsage)}
                                    className={`p-8 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${resetUsage ? 'bg-red-50 border-red-500/20' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${resetUsage ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 uppercase tracking-tight mb-1">Reset Usage Stats</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Wipe Daily/Monthly usage counters to 0</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setRemoveInvoices(!removeInvoices)}
                                    className={`p-8 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${removeInvoices ? 'bg-red-50 border-red-500/20' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${removeInvoices ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Receipt size={24} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 uppercase tracking-tight mb-1">Clean Invoices</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remove pending/unpaid invoices for target month</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mt-12 p-8 bg-rose-50 border border-rose-100 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-rose-800 uppercase tracking-tight">System Exposure: HIGH</p>
                                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">This action will impact {state.users.length} user nodes globally.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="w-full md:w-auto px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                            >
                                <Zap size={18} className="fill-white" />
                                Initiate System Flash
                            </button>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR - RECENT LOGS */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl p-8 relative overflow-hidden h-full flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[80px] -mr-16 -mt-16" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                <History className="text-red-400" size={20} />
                                Deployment Logs
                            </h3>
                            <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/5">
                                {state.flashLogs.length} Records
                            </span>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {state.flashLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40">
                                    <Clock size={32} className="text-slate-500" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Flash Logs Recorded</p>
                                </div>
                            ) : (
                                state.flashLogs.slice().reverse().map((log, idx) => (
                                    <div key={log.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="px-2.5 py-1 bg-red-500/20 text-red-300 rounded-lg text-[8px] font-black uppercase tracking-widest group-hover:bg-red-500 group-hover:text-white transition-all">
                                                FLASH_{log.month}
                                            </div>
                                            <span className="text-[8px] text-white font-black uppercase tracking-widest opacity-30">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed mb-3">{log.reason || 'Operational Reset performed.'}</p>
                                        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                            <User size={10} className="text-slate-500" />
                                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{log.performedBy}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION MODAL */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                                <ShieldAlert size={48} className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-3">Extreme Caution Protocol</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                                    Initiating System Flash for <span className="text-slate-900">{selectedMonth}</span>. All subscriber nodes will be reset to N/A / Inactive.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Type "CONFIRM FLASH" to authorize deployment</label>
                                <input 
                                    type="text" 
                                    value={confirmText}
                                    onChange={(e) => setFlashConfirmText(e.target.value)}
                                    placeholder="CONFIRM FLASH"
                                    className="w-full px-8 py-5 bg-rose-50 border-2 border-rose-100 rounded-3xl text-sm font-black outline-none focus:border-rose-300 transition-all text-center uppercase tracking-[0.3em] placeholder:tracking-normal placeholder:font-bold"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => { setIsConfirmModalOpen(false); setFlashConfirmText(''); }}
                                    className="flex-1 px-8 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Abort Operation
                                </button>
                                <button 
                                    onClick={handleFlash}
                                    disabled={confirmText !== 'CONFIRM FLASH' || isProcessing}
                                    className="flex-1 px-8 py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Clock className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                    Commit Flash
                                </button>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic flex items-center justify-center gap-2">
                                <Clock size={12} /> Execution Timestamp: {new Date().toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemFlash;


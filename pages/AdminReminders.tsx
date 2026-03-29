import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, AdminReminder, ReminderStatus, ReminderIssueType, PaymentStatus, UserStatus } from '../types';
import { db } from '../db';
import {
    Bell, AlertTriangle, CheckCircle, Clock,
    ChevronRight, Filter, Search, ShieldAlert,
    Archive, Trash2, Ban, Hammer, DollarSign,
    Package, LayoutDashboard, MoreVertical,
    X, RefreshCw, Layers, ExternalLink
} from 'lucide-react';

interface Props {
    state: AppState;
    onNavigate: (page: string, params?: any) => void;
}

const AdminReminders: React.FC<Props> = ({ state, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Auto-scan on load
    useEffect(() => {
        db.generateAdminReminders();
    }, []);

    const reminders = useMemo(() => {
        return (state.adminReminders || []).filter(r => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = r.userName.toLowerCase().includes(term) || r.userId.toLowerCase().includes(term) || r.area.toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [state.adminReminders, searchTerm, statusFilter]);

    const activeReminders = useMemo(() => reminders.filter(r => r.status !== ReminderStatus.RESOLVED), [reminders]);

    const stats = useMemo(() => {
        const total = reminders.length;
        const pending = reminders.filter(r => r.status === ReminderStatus.NEW).length;
        const resolved = reminders.filter(r => r.status === ReminderStatus.RESOLVED).length;
        return { total, pending, resolved };
    }, [reminders]);

    const handleToggleSelectAll = () => {
        if (selectedIds.size === activeReminders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(activeReminders.map(r => r.id)));
        }
    };

    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBulkAction = async (action: 'Resolve' | 'Ignore') => {
        if (selectedIds.size === 0) return;
        const status = action === 'Resolve' ? ReminderStatus.RESOLVED : ReminderStatus.IGNORED;
        let reason = '';
        if (action === 'Ignore') {
            reason = prompt('Reason for ignoring these requirements?') || '';
            if (!reason) return;
        }

        setIsProcessing('bulk');
        await db.bulkResolveReminders(Array.from(selectedIds), status, reason);
        setSelectedIds(new Set());
        setIsProcessing(null);
    };

    const getIssueStyle = (type: ReminderIssueType) => {
        switch (type) {
            case ReminderIssueType.UNPAID_BILL: return 'text-rose-500 bg-rose-50 border-rose-100';
            case ReminderIssueType.PLAN_NOT_ACTIVATED: return 'text-amber-500 bg-amber-50 border-amber-100';
            case ReminderIssueType.PAYMENT_MISSING: return 'text-orange-500 bg-orange-50 border-orange-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const handleQuickFix = async (reminder: AdminReminder) => {
        setIsProcessing(reminder.id);
        switch (reminder.issueType) {
            case ReminderIssueType.PLAN_NOT_ACTIVATED:
                onNavigate('user-management', { userId: reminder.userId, action: 'activate' });
                break;
            case ReminderIssueType.UNPAID_BILL:
            case ReminderIssueType.PAYMENT_MISSING:
                onNavigate('invoice-management', { userId: reminder.userId });
                break;
        }
        setIsProcessing(null);
    };

    const handleResolve = async (id: string, status: ReminderStatus) => {
        let reason = '';
        if (status === ReminderStatus.IGNORED) {
            reason = prompt('Reason for ignoring this requirement?') || '';
            if (!reason) return;
        }
        setIsProcessing(id);
        await db.resolveReminder(id, status, reason);
        setIsProcessing(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
                        <Bell className="text-rose-600" size={32} />
                        Fiscal Leak Watch
                    </h2>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Billing Engine Add-on • Admin Reminders v2.4</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1.5 px-4 py-2 border-r border-slate-100">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase text-slate-400">Scan Active</span>
                    </div>
                    <button
                        onClick={() => db.generateAdminReminders()}
                        className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center gap-2 text-blue-600"
                    >
                        <RefreshCw size={14} /> Force Re-Scan
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Alerts', value: stats.total, icon: ShieldAlert, color: 'text-slate-600', bg: 'bg-slate-100' },
                    { label: 'Pending Response', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
                    { label: 'Resolved Hub', value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className={`${s.bg} p-4 rounded-2xl`}>
                            <s.icon className={s.color} size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 italic">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        placeholder="Filter by Subscriber Name, ID or Regional Area..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-6 py-4 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(ReminderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="sticky top-4 z-[100] bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 border border-white/10 mx-2">
                    <div className="flex items-center gap-4 ml-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center font-black">
                            {selectedIds.size}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Alerts Selected</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">Ready for terminal batch execution</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkAction('Resolve')}
                            disabled={isProcessing === 'bulk'}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            {isProcessing === 'bulk' ? <Mini5GMicroLoader size={14} /> : <CheckCircle size={14} />}
                            Resolve Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction('Ignore')}
                            disabled={isProcessing === 'bulk'}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Ban size={14} /> Ignore Cluster
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-3 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Reminders Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="pl-8 py-6 w-12">
                                    <div
                                        onClick={handleToggleSelectAll}
                                        className={`w-5 h-5 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center ${selectedIds.size === activeReminders.length && activeReminders.length > 0 ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                                    >
                                        {selectedIds.size === activeReminders.length && activeReminders.length > 0 && <CheckCircle className="text-white" size={12} />}
                                    </div>
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Signature</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Latency</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fiscal Risk</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Terminal Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reminders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-32 text-center text-slate-300 flex flex-col items-center">
                                        <div className="p-6 bg-slate-50 rounded-full mb-4">
                                            <CheckCircle size={60} className="text-slate-100" />
                                        </div>
                                        <p className="font-black uppercase tracking-widest text-xs">Registry Clean. No internal alerts triggered.</p>
                                    </td>
                                </tr>
                            ) : (
                                reminders.map(r => (
                                    <tr key={r.id} className={`group hover:bg-slate-50 transition-all ${r.status === ReminderStatus.RESOLVED ? 'opacity-50 grayscale' : ''} ${selectedIds.has(r.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="pl-8 py-6">
                                            {r.status !== ReminderStatus.RESOLVED && (
                                                <div
                                                    onClick={() => handleToggleSelect(r.id)}
                                                    className={`w-5 h-5 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center ${selectedIds.has(r.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}
                                                >
                                                    {selectedIds.has(r.id) && <CheckCircle className="text-white" size={12} />}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="font-black text-slate-900 uppercase italic tracking-tight">{r.userName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{r.userId}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-[9px] text-slate-400 font-black uppercase italic">{r.area}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getIssueStyle(r.issueType)}`}>
                                                <AlertTriangle size={12} />
                                                {r.issueType}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black italic text-slate-800">{r.daysPending}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Days Missed</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-black text-rose-600 italic tracking-tighter">Rs. {r.billAmount.toLocaleString()}</p>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pending Settlement</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {r.status !== ReminderStatus.RESOLVED && (
                                                    <>
                                                        <button
                                                            onClick={() => handleQuickFix(r)}
                                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                                                        >
                                                            Quick Fix
                                                        </button>
                                                        <div className="relative group/menu">
                                                            <button className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-xl shadow-sm transition-all group-hover/menu:bg-slate-50">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 hidden group-hover/menu:block z-[50] animate-in slide-in-from-top-2">
                                                                <button onClick={() => handleResolve(r.id, ReminderStatus.RESOLVED)} className="w-full text-left p-3 hover:bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                    <CheckCircle size={14} /> Resolve Issue
                                                                </button>
                                                                <button onClick={() => handleResolve(r.id, ReminderStatus.IN_PROGRESS)} className="w-full text-left p-3 hover:bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                    <Clock size={14} /> Mark Progress
                                                                </button>
                                                                <button onClick={() => handleResolve(r.id, ReminderStatus.IGNORED)} className="w-full text-left p-3 hover:bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                    <Ban size={14} /> Ignore Node
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                {r.status === ReminderStatus.RESOLVED && (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CheckCircle size={16} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest italic">Resolved by {r.resolvedBy}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reminder Audit Log Footer */}
            <div className="p-8 bg-blue-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">Internal Protocol Integrity</h4>
                            <p className="text-blue-300 text-[10px] font-medium uppercase tracking-widest mt-1 opacity-80">Every alert is tracked in the regional ledger audit trails.</p>
                        </div>
                    </div>
                    <button className="px-10 py-4 bg-white text-blue-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 shadow-xl shadow-black/10 transition-all flex items-center gap-2">
                        Access Audit Logs <ExternalLink size={16} />
                    </button>
                </div>
                <Layers className="absolute -right-8 -bottom-8 opacity-5 scale-150 rotate-12" size={200} />
            </div>
        </div>
    );
};

export default AdminReminders;


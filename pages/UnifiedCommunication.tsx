import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Bell, History, Settings, Zap, 
  ShieldCheck, AlertCircle, CheckCircle2, 
  Clock, Filter, Search, MoreVertical, 
  Trash2, Copy, ExternalLink, RefreshCcw, Smartphone
} from 'lucide-react';
import { db } from '../db';
import { AppState } from '../types';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

interface CommLog {
    id: string;
    type: 'email' | 'push' | 'sms';
    recipient: string;
    status: 'Sent' | 'Failed' | 'Pending';
    error?: string;
    sent_at: string;
}

const UnifiedCommunication: React.FC<{ state: AppState }> = ({ state }) => {
    const [activeTab, setActiveTab] = useState<'send' | 'logs' | 'config' | 'push'>('send');
    const [logs, setLogs] = useState<CommLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Notification toggles state
    const [notifToggles, setNotifToggles] = useState({ auto_alerts: true, billing_reminders: true, mkt_updates: false });

    // Push broadcast form
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [pushTarget, setPushTarget] = useState<'all' | 'specific'>('all');
    const [pushRecipient, setPushRecipient] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    
    // Form States
    const [commType, setCommType] = useState<'email' | 'push'>('email');
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/communication/logs`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}` }
            });
            const res = await response.json();
            if (res.success) setLogs(res.logs);
        } catch (e) {}
        finally { setIsLoading(false); }
    };

    const handleSend = async () => {
        setIsSending(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/communication/send`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
                },
                body: JSON.stringify({
                    type: commType,
                    recipient,
                    subject,
                    body
                })
            });
            const res = await response.json();
            if (res.success) {
                alert('Communication dispatched successfully.');
                setRecipient('');
                setSubject('');
                setBody('');
            } else {
                alert(`Dispatch Failed: ${res.message}`);
            }
        } catch (e: any) {
            alert(`Network Error: ${e.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                            <Zap className="text-white fill-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Comms Plane</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Unified Messaging & Notifications v3.0</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm">
                        <RefreshCcw size={20} />
                    </button>
                    <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 flex items-center gap-3">
                        <ShieldCheck size={16} /> Secure Protocol
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm w-fit">
                {[
                    { id: 'send', label: 'Dispatch', icon: Send },
                    { id: 'push', label: 'Web Push', icon: Bell },
                    { id: 'logs', label: 'Audit Logs', icon: History },
                    { id: 'config', label: 'Infrastructure', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-slate-950 text-white shadow-xl shadow-slate-900/10 scale-105' 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-8">
                    {activeTab === 'send' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 shadow-inner">
                                        <Send size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Quick Dispatch</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Single target message routing</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Type</label>
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                            <button 
                                                onClick={() => setCommType('email')}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${commType === 'email' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                                            >
                                                Email Node
                                            </button>
                                            <button 
                                                onClick={() => setCommType('push')}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${commType === 'push' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                                            >
                                                Web Push
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Node</label>
                                        <input 
                                            type="text" 
                                            placeholder="email@node.com or user-id"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-xs"
                                            value={recipient}
                                            onChange={e => setRecipient(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Header</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter transmission subject..."
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-xs"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                                    <textarea 
                                        rows={8}
                                        placeholder="Compose your message here..."
                                        className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm resize-none"
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        onClick={handleSend}
                                        disabled={isSending || !recipient || !body}
                                        className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {isSending ? <Mini5GMicroLoader size={20} /> : <Send size={20} />}
                                        Execute Transmission
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-950 text-white rounded-3xl flex items-center justify-center shadow-xl">
                                        <History size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Transmission Registry</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Real-time delivery audit trail</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search logs..."
                                            className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <button className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                                        <Filter size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Recipient</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/30 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${log.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                            {log.type === 'email' ? <Mail size={16} /> : <Bell size={16} />}
                                                        </div>
                                                        <span className="text-[11px] font-black uppercase italic text-slate-900">{log.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[11px] font-bold text-slate-600">{log.recipient}</td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                        log.status === 'Sent' ? 'bg-green-50 text-green-600 border border-green-100' : 
                                                        log.status === 'Failed' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        <div className={`w-1 h-1 rounded-full ${log.status === 'Sent' ? 'bg-green-600' : log.status === 'Failed' ? 'bg-red-600' : 'bg-amber-600'}`}></div>
                                                        {log.status}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-medium text-slate-400">
                                                    {new Date(log.sent_at).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {logs.length === 0 && !isLoading && (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                            <History className="text-slate-200" size={32} />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No communication activity recorded.</p>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="py-24 flex items-center justify-center">
                                        <Mini5GMicroLoader size={40} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'config' && (
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm animate-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Infrastructure Setup & Testing</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validate external provider bindings</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 group hover:bg-white transition-all">
                                    <div className="flex justify-between items-center">
                                       <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                           <Mail size={24} />
                                       </div>
                                       <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-lg">Operational</span>
                                    </div>
                                    <div>
                                       <h4 className="font-black uppercase tracking-tight text-slate-900">Email Gateway</h4>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">SMTP Node (Port 587)</p>
                                    </div>
                                    <button 
                                       onClick={async () => {
                                           setIsLoading(true);
                                           try {
                                              const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comm/test-email`, {
                                                 headers: { Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}`}
                                              });
                                              const data = await res.json();
                                              alert(data.success ? 'SMTP Handshake Successful!' : `Error: ${data.message}`);
                                          } catch (e: any) { alert(e.message); }
                                          finally { setIsLoading(false); }
                                       }}
                                       className="w-full py-4 bg-slate-200 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                    >
                                        Ping Email Gateway
                                    </button>
                                </div>

                                <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-6 group hover:bg-white transition-all">
                                    <div className="flex justify-between items-center">
                                       <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                           <Smartphone size={24} />
                                       </div>
                                       <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-lg">Operational</span>
                                    </div>
                                    <div>
                                       <h4 className="font-black uppercase tracking-tight text-slate-900">SMS Gateway</h4>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Twilio / Local API</p>
                                    </div>
                                    <button 
                                       onClick={async () => {
                                           setIsLoading(true);
                                           try {
                                              const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comm/test-sms`, {
                                                 headers: { Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}`}
                                              });
                                              const data = await res.json();
                                              alert(data.success ? 'SMS Handshake Successful!' : `Error: ${data.message}`);
                                          } catch (e: any) { alert(e.message); }
                                          finally { setIsLoading(false); }
                                       }}
                                       className="w-full py-4 bg-slate-200 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                    >
                                        Ping SMS Gateway
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'push' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Push Header */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Push Protocol Active</span>
                                        </div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Web Push Broadcast</h3>
                                        <p className="text-[11px] text-white/60 font-bold uppercase tracking-widest">VAPID-Secured • FCM / APNS Routing</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-white/10 border border-white/20 rounded-2xl text-center">
                                            <p className="text-2xl font-black">{state.users.filter(u => u.fcmToken).length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">Subscribed</p>
                                        </div>
                                        <div className="p-5 bg-white/10 border border-white/20 rounded-2xl text-center">
                                            <p className="text-2xl font-black">{state.users.length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">Total Users</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Broadcast Form */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-10 space-y-8">
                                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center border border-indigo-100">
                                        <Bell size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Compose Broadcast</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Push to all subscribers or a specific device</p>
                                    </div>
                                </div>

                                {/* Target Selector */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Broadcast Target</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl w-fit">
                                        {(['all', 'specific'] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setPushTarget(t)}
                                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${pushTarget === t ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
                                            >
                                                {t === 'all' ? '🌐 All Subscribers' : '🎯 Specific User'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {pushTarget === 'specific' && (
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Target User / Token</label>
                                        <input
                                            type="text"
                                            placeholder="user@domain.com or push-token"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs"
                                            value={pushRecipient}
                                            onChange={e => setPushRecipient(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Your Invoice is Ready"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs"
                                        value={pushTitle}
                                        onChange={e => setPushTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Body</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Compose your push notification message..."
                                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-medium text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm resize-none"
                                        value={pushBody}
                                        onChange={e => setPushBody(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        disabled={isBroadcasting || !pushTitle || !pushBody}
                                        onClick={async () => {
                                            setIsBroadcasting(true);
                                            try {
                                                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/communication/send`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
                                                    },
                                                    body: JSON.stringify({ type: 'push', recipient: pushTarget === 'all' ? 'all' : pushRecipient, subject: pushTitle, body: pushBody })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    db.logNotification('all', 'success', 'Push Broadcast Sent', `"${pushTitle}" dispatched to ${pushTarget === 'all' ? 'all subscribers' : pushRecipient}`);
                                                    setPushTitle(''); setPushBody(''); setPushRecipient('');
                                                    alert('Push notification broadcast dispatched successfully.');
                                                } else { alert(`Broadcast failed: ${data.message}`); }
                                            } catch (e: any) { alert(`Network error: ${e.message}`); }
                                            finally { setIsBroadcasting(false); }
                                        }}
                                        className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {isBroadcasting ? <span className="animate-spin">⚡</span> : <Bell size={20} />}
                                        {isBroadcasting ? 'Broadcasting...' : 'Fire Push Broadcast'}
                                    </button>
                                </div>
                            </div>

                            {/* Subscriber List Preview */}
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-10 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Smartphone size={14} className="text-indigo-500" /> Subscribed Device Nodes
                                </h4>
                                <div className="space-y-3">
                                    {state.users.filter(u => u.fcmToken).slice(0, 5).length > 0 ? (
                                        state.users.filter(u => u.fcmToken).slice(0, 5).map(u => (
                                            <div key={u.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xs font-black">{u.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900 uppercase">{u.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{u.connectionId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[8px] font-black text-green-600 uppercase">Subscribed</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-16 text-center opacity-40">
                                            <Bell className="mx-auto text-slate-300 mb-4" size={40} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No subscribed push devices found.</p>
                                            <p className="text-[9px] text-slate-400 uppercase mt-1">Users must opt-in via the subscriber portal.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Cards */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                        <h4 className="text-lg font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <ShieldCheck size={22} className="text-blue-400" /> Protocol Health
                        </h4>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">SMTP Handshake</p>
                                    <p className="text-xl font-black italic">NOMINAL</p>
                                </div>
                                <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center border border-green-500/20">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>

                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">API Latency</p>
                                    <p className="text-xl font-black italic text-blue-400">42ms</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Clock size={20} />
                                </div>
                            </div>

                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Failure Rate</p>
                                    <p className="text-xl font-black italic text-rose-400">0.02%</p>
                                </div>
                                <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic">
                            Infrastructure Audit Report
                        </button>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/10 space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                <Bell size={22} className="text-blue-600" /> Notification Pulse
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global system notification toggles</p>
                        </div>

                        <div className="space-y-4">
                            {([
                                { id: 'auto_alerts' as const, label: 'Auto Error Alerts', color: 'rose' },
                                { id: 'billing_reminders' as const, label: 'Billing Broadcasts', color: 'blue' },
                                { id: 'mkt_updates' as const, label: 'Marketing Streams', color: 'indigo' }
                            ]).map(toggle => {
                                const isOn = notifToggles[toggle.id];
                                return (
                                    <div key={toggle.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl group hover:border-slate-300 transition-all">
                                        <span className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest">{toggle.label}</span>
                                        <button
                                            onClick={() => setNotifToggles(prev => ({ ...prev, [toggle.id]: !prev[toggle.id] }))}
                                            className={`w-12 h-6 rounded-full relative p-1 transition-all duration-300 ${isOn ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-3">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Zap size={14} className="fill-blue-600" />
                                <span className="text-[10px] font-black uppercase italic tracking-widest">Neural Tip</span>
                            </div>
                            <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase">
                                PROXIMITY-BASED NOTIFICATIONS INCREASE USER ENGAGEMENT BY UP TO 42% COMPARED TO STANDARD GLOBAL BROADCASTS.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedCommunication;

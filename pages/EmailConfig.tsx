import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, CommunicationSettings, EmailGatewayMode, SenderIdentity } from '../types';
import { db } from '../db';
import {
    Mail, Settings, ShieldCheck, Server, Send, Plus, Trash2,
    CheckCircle, AlertCircle, Loader2, Globe, Lock, Info,
    Zap, Heart, Activity, Sliders, Save, RefreshCw
} from 'lucide-react';

interface Props {
    state: AppState;
}

const EmailConfig: React.FC<Props> = ({ state }) => {
    const [config, setConfig] = useState<CommunicationSettings>(state.settings.commConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'gateway' | 'sender' | 'advanced'>('gateway');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await db.updateSettings({ commConfig: config });
            db.logNotification('all', 'success', 'Infrastructure Update', 'Global communication protocols synchronized.');
        } catch (err) {
            alert('Handshake Failed: Connection to registry node timed out.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) {
            alert('Target node identifier required for test dispatch.');
            return;
        }
        setIsTesting(true);
        try {
            const res = await db.sendTestEmail(config.smtpConfig, { recipient: testEmail });
            if (res.success) {
                alert('Test Protocol Dispatched: Verify receipt at target node.');
            } else {
                alert(`Dispatch Error: ${res.error || 'Gateway node rejected the handshake.'}`);
            }
        } catch (err: any) {
            alert(`Network Error: ${err.message || 'Connection to backend node failed.'}`);
        } finally {
            setIsTesting(false);
        }
    };

    const addSenderIdentity = () => {
        const newIdentity: SenderIdentity = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Network Authority',
            email: 'noreply@yourdomain.com',
            isVerified: false,
            isDefault: config.senderIdentities.length === 0,
            createdAt: new Date().toISOString()
        };
        setConfig({ ...config, senderIdentities: [...config.senderIdentities, newIdentity] });
    };

    const removeSenderIdentity = (id: string) => {
        setConfig({
            ...config,
            senderIdentities: config.senderIdentities.filter(s => s.id !== id)
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
                        <Mail className="text-indigo-600" size={32} />
                        Comm-Hub Configuration
                    </h2>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Authority Control • SMTP & API Protocols v2.1</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                    {isSaving ? <Mini5GMicroLoader size={16} /> : <Save size={16} />}
                    Synchronize Configuration
                </button>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
                <button
                    onClick={() => setActiveTab('gateway')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'gateway' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <Server size={14} /> Gateway Setup
                </button>
                <button
                    onClick={() => setActiveTab('sender')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'sender' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <ShieldCheck size={14} /> Sender ID
                </button>
                <button
                    onClick={() => setActiveTab('advanced')}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'advanced' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    <Sliders size={14} /> Protocol Rules
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'gateway' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Gateway Handshake</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select your primary transmission protocol</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway Mode</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs"
                                            value={config.emailMode}
                                            onChange={e => setConfig({ ...config, emailMode: e.target.value as EmailGatewayMode })}
                                        >
                                            <option value="CUSTOM_SMTP">Standard SMTP Protocol</option>
                                            <option value="PROVIDER_API">Cloud Provider API</option>
                                            <option value="HYBRID">Hybrid Redundancy</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Node</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs"
                                            value={config.emailProvider}
                                            onChange={e => setConfig({ ...config, emailProvider: e.target.value as any })}
                                        >
                                            <option value="SMTP">Self-Hosted SMTP</option>
                                            <option value="SendGrid">Cloud: SendGrid</option>
                                            <option value="AWS_SES">Cloud: AWS SES</option>
                                            <option value="Gmail">G-Workspace Handshake</option>
                                            <option value="Mailgun">Cloud: Mailgun</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-8 border border-white/5 shadow-2xl relative overflow-hidden">
                                    <Globe className="absolute -right-12 -bottom-12 opacity-5" size={200} />
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <Server size={20} className="text-indigo-400" />
                                        <h4 className="text-sm font-black italic uppercase tracking-tighter">Connection Parameters</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-white/50">Host / IP Node</label>
                                            <input
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-white outline-none focus:border-indigo-500 transition-all text-xs"
                                                placeholder="smtp.example.com"
                                                value={config.smtpConfig.host}
                                                onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig, host: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-white/50">Port Mapping</label>
                                            <input
                                                type="number"
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-white outline-none focus:border-indigo-500 transition-all text-xs"
                                                placeholder="587"
                                                value={config.smtpConfig.port}
                                                onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig, port: parseInt(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-white/50">Encryption</label>
                                            <select
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-white outline-none focus:border-indigo-500 transition-all text-xs appearance-none"
                                                value={config.smtpConfig.encryption}
                                                onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig, encryption: e.target.value as any } })}
                                            >
                                                <option value="TLS" className="bg-slate-900">TLS (Modern)</option>
                                                <option value="SSL" className="bg-slate-900">SSL (Legacy)</option>
                                                <option value="None" className="bg-slate-900">None (Insecure)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-white/50">Credential ID</label>
                                            <input
                                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-white outline-none focus:border-indigo-500 transition-all text-xs"
                                                placeholder="postmaster@domain.com"
                                                value={config.smtpConfig.username}
                                                onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig, username: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic text-white/50">Secret Token</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-white outline-none focus:border-indigo-500 transition-all text-xs"
                                                    placeholder="••••••••••••"
                                                    value={config.smtpConfig.password || ''}
                                                    onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig, password: e.target.value } })}
                                                />
                                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sender' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Identity Management</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Validated sender signatures</p>
                                    </div>
                                </div>
                                <button
                                    onClick={addSenderIdentity}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Add Identity
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="space-y-4">
                                    {config.senderIdentities.map(identity => (
                                        <div key={identity.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${identity.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {identity.isVerified ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
                                                        {identity.name}
                                                        {identity.isDefault && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[7px] font-black uppercase rounded-full">Primary</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{identity.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!identity.isDefault && (
                                                    <button
                                                        onClick={() => {
                                                            const next = config.senderIdentities.map(s => ({ ...s, isDefault: s.id === identity.id }));
                                                            setConfig({ ...config, senderIdentities: next });
                                                        }}
                                                        className="bg-white p-3 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                                        title="Set as Registry Primary"
                                                    >
                                                        <Zap size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeSenderIdentity(identity.id)}
                                                    className="bg-white p-3 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {config.senderIdentities.length === 0 && (
                                        <div className="py-20 text-center flex flex-col items-center justify-center border-4 border-dashed border-slate-50 rounded-[2.5rem]">
                                            <Mail size={64} className="text-slate-100 mb-6" />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No authorized identities identified.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border">
                                        <Sliders size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Rule Engine</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Transmission throttling and warmup</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                            Throttling Policy
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Emails Per Hour</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-xs text-right focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                                    value={config.rateLimits.emailsPerHour}
                                                    onChange={e => setConfig({ ...config, rateLimits: { ...config.rateLimits, emailsPerHour: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Daily Burst Limit</span>
                                                <input
                                                    type="number"
                                                    className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-xs text-right focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                                    value={config.rateLimits.emailsPerDay}
                                                    onChange={e => setConfig({ ...config, rateLimits: { ...config.rateLimits, emailsPerDay: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                            IP Warmup Protocol
                                        </h4>
                                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-emerald-700 uppercase">Process Active</span>
                                                <button
                                                    onClick={() => setConfig({ ...config, warmup: { ...config.warmup, enabled: !config.warmup.enabled } })}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${config.warmup.enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.warmup.enabled ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-emerald-600/80 font-bold leading-relaxed uppercase">
                                                WARMUP ENGAGED: THE SYSTEM WILL GRADUALLY INCREASE TRANSMISSION VOLUMES TO PRESERVE REPUTATION NODE SCORES.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white border border-white/5 shadow-2xl relative overflow-hidden">
                        <Activity className="absolute -right-8 -top-8 opacity-5" size={120} />
                        <h4 className="text-sm font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <Heart size={18} className="text-rose-500" /> Infrastructure Health
                        </h4>

                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Protocol Status</p>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] font-black uppercase">{config.health.status}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Registry Latency</p>
                                <p className="text-xl font-black italic tracking-tighter">{config.health.latency}ms</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Negative Feedback</p>
                                <p className="text-xl font-black italic tracking-tighter text-rose-400">{config.health.bounceRate}%</p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">Last Integrity Check: {new Date(config.health.lastCheck).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <h4 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-3 text-slate-900">
                            <Send size={18} className="text-indigo-600" /> Dispatch Test
                        </h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Email Node</label>
                                <input
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs"
                                    placeholder="admin@domain.com"
                                    value={testEmail}
                                    onChange={e => setTestEmail(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSendTest}
                                disabled={isTesting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isTesting ? <Mini5GMicroLoader size={16} /> : <RefreshCw size={16} />}
                                Execute Handshake
                            </button>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[8px] text-blue-700 font-bold leading-relaxed uppercase tracking-tight">
                                    Dispatches a certified security handshake to verify node connectivity and credential validity.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailConfig;

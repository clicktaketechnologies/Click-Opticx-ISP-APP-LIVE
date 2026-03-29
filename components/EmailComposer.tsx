import { Mini5GMicroLoader } from './Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, EmailTemplate } from '../types';
import { db } from '../db';
import {
    X, Send, Mail, Type, FileText,
    Sparkles, Paperclip, AlertCircle, RefreshCw,
    CheckCircle, ChevronDown, Lock
} from 'lucide-react';

interface Props {
    user: ISPUser;
    state: AppState;
    onClose: () => void;
    onSent?: () => void;
    initialTemplateId?: string;
    initialAttachments?: {
        bill?: boolean;
        invoice?: boolean;
        notice?: boolean;
    };
}

const EmailComposer: React.FC<Props> = ({
    user, state, onClose, onSent,
    initialTemplateId, initialAttachments
}) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || '');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [attachments, setAttachments] = useState({
        bill: initialAttachments?.bill || false,
        invoice: initialAttachments?.invoice || false,
        notice: initialAttachments?.notice || false
    });

    const templates = state.emailTemplates;

    // Auto-fill template when selected
    useEffect(() => {
        if (selectedTemplateId) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                let content = template.content;
                // Inject variables
                content = content.replace(/\{\{user.name\}\}/g, user.name);
                content = content.replace(/\{\{user.balance\}\}/g, `${state.settings.currency} ${user.balance.toLocaleString()}`);
                content = content.replace(/\{\{user.expiryDate\}\}/g, user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A');
                content = content.replace(/\{\{user.connectionId\}\}/g, user.connectionId);

                setSubject(template.name);
                setMessage(content);
            }
        }
    }, [selectedTemplateId, user, templates, state.settings.currency]);

    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            setError('Protocol Error: Subject and content body required for dispatch.');
            return;
        }

        setIsSending(true);
        setError(null);

        const attachmentList = Object.entries(attachments)
            .filter(([_, active]) => active)
            .map(([type]) => type);

        try {
            const res = await db.sendDirectEmail({
                userId: user.id,
                subject,
                body: message,
                attachments: attachmentList,
                templateId: selectedTemplateId
            });

            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSent?.();
                    onClose();
                }, 1500);
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError('Terminal Error: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3rem] p-12 text-center space-y-6 max-w-sm animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto border border-green-100 shadow-inner">
                        <CheckCircle size={48} className="animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter">- Payment Due Verified</h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                        Message nodes successfully synchronized with recipient's endpoint.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 border-[8px] border-slate-50 overflow-hidden flex flex-col relative">
                <header className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Mail size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">Communication Service</h3>
                            <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Direct Node Handshake v3.0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={24} /></button>
                </header>

                <div className="p-8 space-y-6">
                    {/* Recipient Node */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Target Recipient</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-400 outline-none cursor-not-allowed"
                                    value={user.email || 'NO_EMAIL_CONFIGURED'}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Blueprint Selection</label>
                            <div className="relative">
                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                <select
                                    className="w-full pl-12 pr-10 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                >
                                    <option value="">Manual Composition</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Subject & Message */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">- Payment Due Subject</label>
                            <div className="relative">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-blue-600 transition-all placeholder:text-slate-200"
                                    placeholder="Enter transmission header..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Message Payload</label>
                            <div className="relative bg-slate-900 rounded-[2rem] p-6 shadow-inner border-4 border-slate-800">
                                <textarea
                                    className="w-full h-48 bg-transparent text-green-400 font-mono text-xs resize-none outline-none custom-scrollbar placeholder:text-green-900/50"
                                    placeholder="Decrypting protocol... Write message content here."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <div className="absolute right-6 bottom-6 opacity-20 pointer-events-none">
                                    <FileText size={40} className="text-green-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Asset Encryption (Attachments)</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { key: 'bill', label: 'Billing Statement', icon: FileText },
                                { key: 'invoice', label: 'Fiscal Invoice', icon: Paperclip },
                                { key: 'notice', label: 'Legal Notice', icon: AlertCircle }
                            ].map(asset => (
                                <button
                                    key={asset.key}
                                    onClick={() => setAttachments(prev => ({ ...prev, [asset.key]: !prev[asset.key as keyof typeof prev] }))}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all font-black text-[9px] uppercase tracking-widest ${attachments[asset.key as keyof typeof attachments] ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <asset.icon size={14} />
                                    {asset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                <footer className="p-8 bg-slate-50 border-t flex gap-4 shrink-0 mt-auto">
                    <button onClick={onClose} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort Transmission</button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !user.email}
                        className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSending ? <Mini5GMicroLoader size={18} /> : <Send size={18} />}
                        {user.email ? 'Authorize - Payment Due' : 'Email Node Missing'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EmailComposer;


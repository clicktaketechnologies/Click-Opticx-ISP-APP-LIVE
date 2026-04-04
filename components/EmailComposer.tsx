import { Mini5GMicroLoader } from './Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, EmailTemplate } from '../types';
import { db } from '../db';
import {
    X, Send, Mail, Type, FileText,
    Sparkles, Paperclip, AlertCircle, RefreshCw,
    CheckCircle, ChevronDown, Lock
} from 'lucide-react';
import Modal from './shared/Modal';

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

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={success ? "Transmission Complete" : "Communication Service"}
            type={success ? "success" : "info"}
            icon={success ? <CheckCircle size={24} className="text-white" /> : <Mail size={24} className="text-white" />}
            maxWidth="max-w-2xl"
            footer={
                !success ? (
                    <div className="flex gap-4 w-full">
                        <button onClick={onClose} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort Transmission</button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || !user.email}
                            className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSending ? <Mini5GMicroLoader size={18} /> : <Send size={18} />}
                            {user.email ? 'Authorize - Payment Due' : 'Email Node Missing'}
                        </button>
                    </div>
                ) : null
            }
        >
            {success ? (
                <div className="py-20 text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto border border-green-100 shadow-inner">
                        <CheckCircle size={48} className="animate-bounce" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter">- Payment Due Verified</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                            Message nodes successfully synchronized with recipient's endpoint.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
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
            )}
        </Modal>
    );
};

export default EmailComposer;

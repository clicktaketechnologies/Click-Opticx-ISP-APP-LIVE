import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowRight, Share, PlusSquare } from 'lucide-react';

export const PWAPrompt: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Detect iOS
        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(ios);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return; // If already in app, do not show prompt

        // We removed the 3-day cooldown to ensure it always asks on the web link until dismissed strictly in that session.

        // Capture Android/Desktop prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Show iOS guide immediately if not installed
        if (ios && !isStandalone) {
            setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
        localStorage.setItem('pwa_prompt_last_shown', Date.now().toString());
    };

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true'); // Only dismiss for current session
    };

    if (!isVisible || sessionStorage.getItem('pwa_prompt_dismissed') === 'true') return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[9999] animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 relative overflow-hidden group">
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-6">
                    {/* App Icon Mockup */}
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <Smartphone size={32} />
                    </div>

                    <div className="flex-1 pr-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Install App</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-relaxed">
                            {isIOS 
                                ? 'Get faster access & optimized experience on your device.'
                                : 'Install our official app for a better network experience.'}
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    {isIOS ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                                    <Share size={16} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-600">1. Tap the Share button</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                                    <PlusSquare size={16} />
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-600">2. Select "Add to Home Screen"</p>
                            </div>
                            <button 
                                onClick={handleClose}
                                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
                            >
                                Continue In Web Version
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button 
                                onClick={handleInstall}
                                className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Download size={18} />
                                Install App
                            </button>
                            <button 
                                onClick={handleClose}
                                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                Continue In Web Version
                            </button>
                        </div>
                    )}
                </div>

                {/* Decoration */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50/50 rounded-full blur-3xl" />
            </div>
        </div>
    );
};


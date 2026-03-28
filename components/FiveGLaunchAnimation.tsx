import React, { useEffect, useState } from 'react';
import { Zap, Activity, WifiHigh, Globe, CheckCircle } from 'lucide-react';
import { AppState } from '../types';

export const FiveGLaunchAnimation: React.FC<{
    state: AppState,
    onComplete: () => void
}> = ({ state, onComplete }) => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        if (!state.settings.appearance.show5GLaunchAnimation || sessionStorage.getItem('5g_intro_played') === 'true') {
            onComplete();
            return;
        }

        const timer1 = setTimeout(() => setStage(1), 800);
        const timer2 = setTimeout(() => setStage(2), 1600);
        const timer3 = setTimeout(() => setStage(3), 2600);
        const timer4 = setTimeout(() => {
            sessionStorage.setItem('5g_intro_played', 'true');
            onComplete();
        }, 3400);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [state.settings.appearance.show5GLaunchAnimation, onComplete]);

    if (!state.settings.appearance.show5GLaunchAnimation || sessionStorage.getItem('5g_intro_played') === 'true') {
        return null;
    }

    return (
        <div className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white transition-opacity duration-700 ${stage === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)]"></div>

            {/* Main Hologram Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Spinning Rings */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                    <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[spin_5s_linear_infinite]"></div>
                    <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-fuchsia-500 animate-[spin_3s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-8 rounded-full border-b-2 border-l-2 border-emerald-400 animate-[spin_2s_linear_infinite]"></div>

                    <div className={`transition-all duration-500 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                        <WifiHigh size={80} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-4 text-center">
                    <h1 className="text-6xl font-black italic tracking-tighter uppercase whitespace-nowrap bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent transform">
                        5G ULTRA-NODE
                    </h1>

                    <div className="h-8 flex items-center justify-center">
                        {stage === 0 && (
                            <div className="flex items-center gap-3 text-fuchsia-400 animate-pulse">
                                <Activity size={18} />
                                <span className="text-sm font-black tracking-[0.3em] uppercase">Establishing Uplink</span>
                            </div>
                        )}
                        {stage === 1 && (
                            <div className="flex items-center gap-3 text-indigo-400 animate-pulse">
                                <Globe size={18} />
                                <span className="text-sm font-black tracking-[0.3em] uppercase">Syncing Regional Towers</span>
                            </div>
                        )}
                        {stage >= 2 && (
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle size={18} />
                                <span className="text-sm font-black tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">Connection Verified</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scanning Laser */}
                <div className="absolute top-0 left-[-50%] w-[200%] h-1 bg-fuchsia-500/50 blur-[2px] animate-[ping_2s_ease-in-out_infinite] mix-blend-screen shadow-[0_0_20px_rgba(217,70,239,0.8)]"></div>
            </div>

            {/* Tech Details overlay */}
            <div className="absolute bottom-8 left-8 text-[10px] font-mono text-fuchsia-400/50 uppercase leading-relaxed hidden md:block">
                Initializing Core Sector... OK<br />
                Loading Macro Cells... OK<br />
                Optimizing Quantum Bandwidth... OK
            </div>
        </div>
    );
};

import React from 'react';
import { SignalHigh } from 'lucide-react';

export const Mini5GMicroLoader: React.FC<{ size?: number, className?: string }> = ({ size = 20, className = '' }) => {
    return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full border border-indigo-500/40 animate-[spin_2s_linear_infinite]" />
            <div className="absolute inset-[15%] rounded-full border-t-2 border-r-2 border-fuchsia-500 animate-[spin_1.5s_linear_infinite_reverse]" />
            <div className="absolute inset-[30%] rounded-full border-b-2 border-l-2 border-emerald-400 animate-[spin_1s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
                <SignalHigh size={size * 0.4} className="text-fuchsia-400 animate-pulse drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
            </div>
        </div>
    );
};

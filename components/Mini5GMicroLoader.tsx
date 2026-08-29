import React from 'react';
import { Wifi, Loader2, Gauge } from 'lucide-react';
import { db } from '../db';

interface LoaderProps {
    size?: number;
    className?: string;
    style?: '5G' | 'Pulse' | 'Orbit';
}

export const Mini5GMicroLoader: React.FC<LoaderProps> = ({ size = 20, className = '', style: propStyle }) => {
    const settings = db.getState().settings;
    const activeStyle = propStyle || settings?.appearance?.loadingStyle || '5G';

    const renderStyle = () => {
        switch (activeStyle) {
            case 'Pulse':
                return (
                    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                        <div className="absolute inset-0 rounded-full bg-fuchsia-500/20 animate-ping" />
                        <div className="absolute inset-[20%] rounded-full bg-fuchsia-400 animate-pulse" />
                        <Wifi size={size * 0.6} className="text-white relative z-10" />
                    </div>
                );
            case 'Orbit':
                return (
                    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                        <div className="absolute inset-0 border-2 border-dashed border-blue-400/30 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-fuchsia-500 rounded-full blur-[1px] animate-[bounce_1s_ease-in-out_infinite]" />
                        <Loader2 size={size * 0.8} className="text-blue-400 animate-spin" />
                        <Wifi size={size * 0.4} className="absolute text-fuchsia-400" />
                    </div>
                );
            case '5G':
            default:
                return (
                    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
                        {/* Core Spinner Rings */}
                        <div className="absolute inset-0 rounded-full border-[1.5px] border-blue-500/40 animate-[spin_2.5s_linear_infinite]" />
                        <div className="absolute inset-[12%] rounded-full border-t-[2px] border-r-[2px] border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.4)] animate-[spin_1.8s_linear_infinite_reverse]" />
                        <div className="absolute inset-[25%] rounded-full border-b-[2px] border-l-[2px] border-green-400 animate-[spin_1.2s_linear_infinite]" />
                        
                        {/* 5G Symbol & Core Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Wifi size={size * 0.45} className="text-fuchsia-400 animate-pulse drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]" />
                        </div>
                        
                        {/* Label (only for larger sizes) */}
                        {size > 30 && (
                            <span className="absolute -bottom-1 right-0 text-[8px] font-black text-green-400 drop-shadow-sm select-none">5G</span>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className={`inline-flex items-center justify-center ${className}`}>
            {renderStyle()}
        </div>
    );
};


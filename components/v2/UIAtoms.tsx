import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * V2Badge - Premium Status Chip
 */
export const V2Badge: React.FC<{ 
    label: string, 
    color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'slate' | 'indigo',
    variant?: 'solid' | 'ghost' | 'outline',
    icon?: LucideIcon
}> = ({ label, color = 'slate', variant = 'ghost', icon: Icon }) => {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all ${colors[color]}`}>
            {Icon && <Icon size={12} />}
            {label}
        </span>
    );
};

/**
 * V2Button - Modern Action Trigger
 */
export const V2Button: React.FC<{
    label: string,
    onClick?: () => void,
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
    icon?: LucideIcon,
    loading?: boolean,
    className?: string
}> = ({ label, onClick, variant = 'primary', icon: Icon, loading, className = '' }) => {
    const styles = {
        primary: 'bg-slate-950 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/10',
        secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
        danger: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    };

    return (
        <button 
            onClick={onClick}
            disabled={loading}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${styles[variant]} ${className}`}
        >
            {Icon && !loading && <Icon size={16} />}
            {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {label}
        </button>
    );
};

/**
 * V2Card - Glassmorphism Container
 */
export const V2Card: React.FC<{
    children: React.ReactNode,
    className?: string,
    title?: string,
    subtitle?: string,
    headerAction?: React.ReactNode
}> = ({ children, className = '', title, subtitle, headerAction }) => {
    return (
        <div className={`bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden ${className}`}>
            {(title || headerAction) && (
                <div className="flex justify-between items-start mb-8">
                    <div>
                        {title && <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight italic">{title}</h3>}
                        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
                    </div>
                    {headerAction}
                </div>
            )}
            {children}
        </div>
    );
};

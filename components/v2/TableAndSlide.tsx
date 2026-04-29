import React from 'react';
import { X, ChevronRight } from 'lucide-react';

/**
 * V2SlideOver - Detail Panel
 */
export const V2SlideOver: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    title: string,
    subtitle?: string,
    children: React.ReactNode,
    footer?: React.ReactNode
}> = ({ isOpen, onClose, title, subtitle, children, footer }) => {
    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />
            
            {/* Panel */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[101] transform transition-transform duration-500 ease-out flex flex-col ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {/* Header */}
                <div className="h-24 px-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{title}</h3>
                        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

/**
 * V2SmartTable - High-density Data Matrix
 */
export const V2SmartTable: React.FC<{
    headers: string[],
    children: React.ReactNode
}> = ({ headers, children }) => {
    return (
        <div className="w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const V2TableRow: React.FC<{
    children: React.ReactNode,
    onClick?: () => void
}> = ({ children, onClick }) => (
    <tr 
        onClick={onClick}
        className={`group transition-colors ${onClick ? 'cursor-pointer hover:bg-slate-50/80' : ''}`}
    >
        {children}
    </tr>
);

export const V2TableCell: React.FC<{
    children: React.ReactNode,
    className?: string
}> = ({ children, className = '' }) => (
    <td className={`px-10 py-6 ${className}`}>
        {children}
    </td>
);

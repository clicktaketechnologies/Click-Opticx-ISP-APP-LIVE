import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle, Info } from 'lucide-react';

interface GuideItem {
    title: string;
    description: string;
}

interface ModuleGuideProps {
    moduleName: string;
    description: string;
    items: GuideItem[];
}

const ModuleGuide: React.FC<ModuleGuideProps> = ({ moduleName, description, items }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500 mb-8 shrink-0 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 sm:p-8 text-left group transition-all"
            >
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center border border-indigo-400/20 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all shrink-0">
                        <HelpCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-widest flex items-center gap-3">
                            How to use {moduleName}
                            {!isOpen && <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] text-white/70 tracking-[0.2em] animate-pulse whitespace-nowrap hidden sm:inline-block">Click to Expand</span>}
                        </h3>
                        <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest mt-1 hidden sm:block">{description}</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all shrink-0">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>

            {isOpen && (
                <div className="px-6 sm:px-8 pb-8 animate-in slide-in-from-top-4 custom-scrollbar">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <CheckCircle size={18} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2">{item.title}</h4>
                                        <p className="text-indigo-100/60 text-[11px] leading-snug">{item.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <Info size={16} className="text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                            System operates on standardized logic. Green indicators mean Success/Active. Red implies Deletion/Suspension.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleGuide;

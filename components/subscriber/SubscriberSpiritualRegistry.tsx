
import React from 'react';
import { BookOpen, Clock, Compass, Fingerprint, ChevronRight } from 'lucide-react';

interface Props {
  onAction: (tab: string) => void;
}

const SubscriberSpiritualRegistry: React.FC<Props> = ({ onAction }) => {
  const faithTools = [
    { 
      id: 'namaz', 
      label: 'Prayer Times', 
      icon: Clock, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      desc: 'Local Schedule' 
    },
    { 
      id: 'quran', 
      label: 'Noble Quran', 
      icon: BookOpen, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      desc: 'Holy Text' 
    },
    { 
      id: 'qibla', 
      label: 'Qibla Finder', 
      icon: Compass, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      desc: 'GPS Direction' 
    },
    { 
      id: 'tasbih', 
      label: 'Digital Tasbih', 
      icon: Fingerprint, 
      color: 'text-slate-700', 
      bg: 'bg-slate-100', 
      desc: 'Prayer Counter' 
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-4 flex justify-between items-end">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Islamic Tools</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Faith Resources</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 px-4">
        {faithTools.map((tool) => (
          <button 
            key={tool.id}
            onClick={() => onAction(tool.id)}
            className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 active:scale-95 group text-left flex items-start gap-4"
          >
            <div className={`w-12 h-12 ${tool.bg} ${tool.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform shrink-0`}>
              <tool.icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                {tool.label}
              </h4>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{tool.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubscriberSpiritualRegistry;

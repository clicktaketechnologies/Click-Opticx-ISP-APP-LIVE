
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
  onClick: () => void;
}

const SubscriberDailyToolCard: React.FC<Props> = ({ title, icon: Icon, color, bgColor, description, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex-none w-40 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 active:scale-95 group text-left flex flex-col gap-4"
    >
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{title}</h4>
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{description}</p>
      </div>
    </button>
  );
};

export default SubscriberDailyToolCard;


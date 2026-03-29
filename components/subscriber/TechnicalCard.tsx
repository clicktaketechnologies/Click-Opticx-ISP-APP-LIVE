import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TechnicalCardProps {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string | number;
  badgeColor?: string;
  sublabel?: string;
}

const TechnicalCard: React.FC<TechnicalCardProps> = ({ 
  title, 
  icon: Icon, 
  onClick, 
  badge, 
  badgeColor = "bg-blue-600",
  sublabel
}) => {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all active:scale-95 group overflow-hidden"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors mb-3">
        <Icon size={24} strokeWidth={2} />
      </div>
      
      <div className="text-center">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 leading-none mb-1">
          {title}
        </h4>
        {sublabel && (
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate">
            {sublabel}
          </p>
        )}
      </div>

      {badge !== undefined && (
        <div className={`absolute top-3 right-3 px-1.5 py-0.5 ${badgeColor} text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm`}>
          {badge}
        </div>
      )}
    </button>
  );
};

export default TechnicalCard;

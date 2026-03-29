
import React from 'react';
import { Zap, Gauge, Megaphone, History, Gift } from 'lucide-react';
import SubscriberDailyToolCard from './SubscriberDailyToolCard';

interface Props {
  onAction: (tab: string) => void;
}

const SubscriberDailyTools: React.FC<Props> = ({ onAction }) => {
  const tools = [
    { 
      title: "Speed Test", 
      icon: Gauge, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50", 
      description: "Link Audit",
      route: "network" 
    },
    { 
      title: "News", 
      icon: Megaphone, 
      color: "text-amber-600", 
      bgColor: "bg-amber-50", 
      description: "Broadcasts",
      route: "news" 
    },
    { 
      title: "History", 
      icon: History, 
      color: "text-green-600", 
      bgColor: "bg-green-50", 
      description: "Fiscal Log",
      route: "billing" 
    },
    { 
      title: "Invite Friend", 
      icon: Gift, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50", 
      description: "Earn Credits",
      route: "referral" 
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-4 flex justify-between items-end">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Daily Tools</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Quick access to useful features</p>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4 snap-x">
        {tools.map((tool) => (
          <SubscriberDailyToolCard
            key={tool.title}
            title={tool.title}
            icon={tool.icon}
            color={tool.color}
            bgColor={tool.bgColor}
            description={tool.description}
            onClick={() => onAction(tool.route)}
          />
        ))}
      </div>
    </div>
  );
};

export default SubscriberDailyTools;


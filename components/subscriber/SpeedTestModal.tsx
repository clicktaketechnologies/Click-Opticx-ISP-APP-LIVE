
import React from 'react';
import { X } from 'lucide-react';
import PremiumSpeedTest from '../shared/PremiumSpeedTest';

interface Props {
  onClose: () => void;
}

const SpeedTestModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 text-white">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-500 overflow-hidden rounded-[3rem] shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-[110] backdrop-blur-xl border border-white/10 transition-all active:scale-90"
        >
          <X size={20} />
        </button>
        
        <div className="max-h-[90vh] overflow-y-auto no-scrollbar">
           <PremiumSpeedTest className="!bg-slate-900/90 border-white/5" />
        </div>
      </div>
    </div>
  );
};

export default SpeedTestModal;

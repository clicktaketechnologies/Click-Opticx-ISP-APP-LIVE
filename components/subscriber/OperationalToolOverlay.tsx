
import React from 'react';
import { 
  X, Zap, Gauge, Headphones, RefreshCw, 
  ShieldAlert, Globe, Activity, Smartphone, Wifi 
} from 'lucide-react';
import Modal from '../shared/Modal';

interface Props {
  onClose: () => void;
  onAction: (tab: string) => void;
}

const OperationalToolOverlay: React.FC<Props> = ({ onClose, onAction }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Operational Core"
      type="info"
      icon={<Zap size={24} className="text-blue-500" fill="currentColor" />}
      maxWidth="max-w-xl"
      footer={
        <div className="bg-slate-900 w-full p-8 rounded-[2.5rem] text-white flex items-center justify-between relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Network POP Node</p>
              <h4 className="text-xl font-black italic text-blue-400">KHI-NORTH-Z2</h4>
           </div>
           <Wifi className="text-white/10 absolute -right-4 -bottom-4" size={120} />
           <div className="relative z-10 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase">
              Synced
           </div>
        </div>
      }
    >
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { onAction('network'); onClose(); }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-green-500 transition-all text-left group"
            >
               <Gauge size={28} className="text-green-500 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Diagnostic Scan</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Full Link Handshake</p>
            </button>
            <button 
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-500 transition-all text-left group"
              onClick={() => { alert("Router Restart Signal - Payment Dueed to Node MAC..."); onClose(); }}
            >
               <RefreshCw size={28} className="text-blue-500 mb-4 group-hover:rotate-180 transition-transform duration-700" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Node Reset</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Cold Boot Protocol</p>
            </button>
            <button 
              onClick={() => { onAction('support'); onClose(); }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-500 transition-all text-left group"
            >
               <Headphones size={28} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Registry Help</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Human - Payment Due</p>
            </button>
            <button 
              className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all text-left group"
              onClick={() => { onAction('wallet'); onClose(); }}
            >
               <ShieldAlert size={28} className="text-rose-600 mb-4 group-hover:text-white group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Emergency Credit</h4>
               <p className="text-[8px] font-black mt-2 uppercase opacity-60">Handshake Override</p>
            </button>
         </div>
      </div>
    </Modal>
  );
};

export default OperationalToolOverlay;



import React, { useMemo } from 'react';
import { ISPUser, AppState, ConnectionStatus } from '../../types';
import { 
  Network, Flame, Wifi, ShieldCheck, Clock, Zap, 
  Layers, HardDrive, Cpu, Package, Info, Activity,
  Smartphone, CreditCard, ChevronRight, CheckCircle, ShieldAlert, Globe
} from 'lucide-react';

const SubscriberConnection: React.FC<{ user: ISPUser, state: AppState }> = ({ user, state }) => {
  const currentPkg = useMemo(() => state.packages.find(p => p.id === user.packageId), [state.packages, user.packageId]);

  const getStatusUI = (status: ConnectionStatus = ConnectionStatus.PENDING) => {
    switch(status) {
      case ConnectionStatus.ACTIVE: return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle };
      case ConnectionStatus.INSTALLED: return { label: 'Installed', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: ShieldCheck };
      default: return { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock };
    }
  };

  const statusUI = getStatusUI(user.connectionStatus);

  const breakdown = useMemo(() => {
    if (user.connectionType === 'Fiber' && user.fiberInfo) {
      const f = user.fiberInfo;
      return [
        { label: 'Network Device', value: f.deviceName, price: f.devicePrice },
        { label: 'Optical Power', value: f.opticalPowerRange, price: f.opticalPowerPrice },
        { label: 'Fiber Cable', value: `${f.cableCore} Core x ${f.cableMeters}m`, price: f.cableCore * f.cableMeters * f.cableBasePrice },
        { label: 'Splitter Unit', value: f.splitterType, price: f.splitterPrice },
        { label: 'Cabling Accessories', value: `PVC x${f.duckPattiQty}`, price: f.duckPattiQty * f.duckPattiPrice },
        { label: 'Patch Cable', value: `Cord x${f.patchCordQty}`, price: f.patchCordQty * f.patchCordPrice },
        { label: 'Service Plan', value: currentPkg?.name || 'TBD', price: currentPkg?.price || 0 }
      ];
    } else if (user.connectionType === 'Wireless' && user.wirelessInfo) {
      const w = user.wirelessInfo;
      return [
        { label: 'CAT6 Cabling', value: `${w.cat6Meters} Meters`, price: w.cat6Meters * w.cat6PricePerMeter },
        { label: 'Hardware Clips', value: `${w.clipsQty} Units`, price: w.clipsQty * w.clipPrice },
        { label: 'Brackets', value: `${w.ravalBoldPairs} Pairs`, price: w.ravalBoldPairs * w.ravalBoldPrice },
        { label: 'Pole Setup', value: w.pollHeight, price: w.pollPrice },
        { label: 'Wifi Quality', value: w.signalStrength, price: w.signalStrengthPrice },
        { label: 'Wireless Antenna', value: w.receiverModel, price: w.receiverPrice },
        { label: 'Local Router', value: w.onuModel, price: w.onuPrice },
        { label: 'Tower Access', value: w.towerAPDevice, price: w.towerAPPrice },
        { label: 'Service Plan', value: currentPkg?.name || 'TBD', price: currentPkg?.price || 0 }
      ];
    }
    return [];
  }, [user, currentPkg]);

  const grandTotal = useMemo(() => breakdown.reduce((acc, item) => acc + item.price, 0), [breakdown]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Hero Connection Status */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Connection Details</p>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                     {user.connectionType === 'Fiber' ? <Flame className="text-blue-400" /> : <Wifi className="text-emerald-400" />}
                     {user.connectionType} Account
                  </h2>
               </div>
               <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 ${statusUI.bg} ${statusUI.color} backdrop-blur-md`}>
                  <statusUI.icon size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{statusUI.label}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Customer ID</p>
                  <p className="text-lg font-black text-white uppercase italic tracking-tighter">{user.connectionId}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Type</p>
                  <p className="text-lg font-black text-indigo-400 uppercase italic tracking-tighter">{user.connectionType === 'Fiber' ? 'FTTH / Fiber' : 'PTP / Wireless'}</p>
               </div>
            </div>
         </div>
         <Activity className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={200} />
      </div>

      {/* Equipment Breakdown */}
      <div className="space-y-5">
         <div className="flex justify-between items-end px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Installation Overview</h3>
            <span className="text-[8px] font-black text-slate-400 uppercase">Itemized Costs</span>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="divide-y divide-slate-50">
               {breakdown.length === 0 ? (
                 <div className="p-20 text-center flex flex-col items-center">
                    <ShieldAlert size={48} className="text-slate-100 mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Awaiting hardware mapping...</p>
                 </div>
               ) : (
                 breakdown.map((item, i) => (
                   <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-sm border border-slate-100`}>
                            {item.label.includes('Cable') || item.label.includes('CAT6') ? <HardDrive size={22}/> : <Cpu size={22}/>}
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.value}</h4>
                         </div>
                      </div>
                      <p className="text-sm font-black text-slate-900 italic tracking-tighter">Rs. {item.price.toLocaleString()}</p>
                   </div>
                 ))
               )}
            </div>
            
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">Total Value</p>
                  <h4 className="text-3xl font-black text-emerald-400 italic tracking-tighter">Rs. {grandTotal.toLocaleString()}</h4>
               </div>
               <div className="relative z-10">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                     <ShieldCheck size={14} className="text-emerald-400" />
                     <span className="text-[9px] font-black uppercase tracking-widest">System Verified</span>
                  </div>
               </div>
               <Globe className="absolute -right-10 -bottom-10 opacity-5 scale-150" size={160} />
            </div>
         </div>
      </div>

      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-5 shadow-sm mx-1">
         <Info className="text-blue-500 mt-1 shrink-0" size={24} />
         <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed">
            All costs included in setup. Infrastructure is healthy ✅. Full audit logs available.
         </p>
      </div>

      <button className="w-full py-6 bg-white border-2 border-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm">
         <Activity size={18} /> View Network Details
      </button>
    </div>
  );
};

export default SubscriberConnection;

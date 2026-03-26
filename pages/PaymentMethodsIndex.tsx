
import React, { useState, useMemo } from 'react';
import { AppState, PaymentGateway, LedgerType } from '../types';
import { db } from '../db';
import { 
  CreditCard, Globe, Smartphone, Banknote, ShieldCheck, 
  ChevronRight, Activity, Zap, ShieldAlert, CheckCircle, 
  Settings2, Power, Layers, ArrowRight, Landmark, Map, X,
  History, Clock, ArrowRightLeft, UserCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onNavigate: (page: string) => void;
}

const PaymentMethodsIndex: React.FC<Props> = ({ state, onNavigate }) => {
  const gateways = state.settings.paymentGateways || [];
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('All');

  const gatewayLedger = useMemo(() => {
    const gatewayNames = gateways.map(g => g.name);
    return state.ledger.filter(l => 
      l.method && (gatewayNames.includes(l.method) || l.method.includes('Gateway'))
    ).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.ledger, gateways]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'All') return gatewayLedger;
    return gatewayLedger.filter(l => l.method === logFilter);
  }, [gatewayLedger, logFilter]);

  const handleToggle = async (id: string, current: boolean) => {
    await db.updateGatewayConfig(id, { enabled: !current });
    db.logNotification('all', 'info', 'Registry Protocol', `Gateway ${id} state transformed.`);
  };

  const getGatewayIcon = (id: string) => {
    switch(id) {
      case 'stripe': return <Globe size={24} />;
      case 'paypal': return <CreditCard size={24} />;
      case 'jazzcash': case 'easypaisa': return <Smartphone size={24} />;
      case 'cash': return <Banknote size={24} />;
      case 'bank': return <Landmark size={24} />;
      case 'home': return <Map size={24} />;
      case 'payfast': return <Zap size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  const getGatewayColor = (id: string) => {
    switch(id) {
      case 'stripe': return 'bg-blue-600';
      case 'jazzcash': return 'bg-rose-600';
      case 'easypaisa': return 'bg-emerald-600';
      case 'cash': return 'bg-slate-900';
      case 'paypal': return 'bg-indigo-700';
      case 'bank': return 'bg-blue-800';
      case 'home': return 'bg-purple-600';
      case 'payfast': return 'bg-amber-500';
      default: return 'bg-indigo-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <CreditCard className="text-indigo-600" size={32} />
            Fiscal Gateways
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Global Protocol Management • Tiered Architecture</p>
        </div>
        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-black uppercase text-slate-700">Listeners Active: {gateways.filter(g => g.enabled).length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {gateways.length === 0 ? (
           <div className="col-span-full py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
              <ShieldAlert size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase">Registry node empty. Reprovisioning required.</p>
           </div>
         ) : (
           gateways.sort((a,b) => a.priority - b.priority).map(gateway => (
             <div key={gateway.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${gateway.enabled ? 'border-indigo-100 shadow-indigo-50 shadow-lg' : 'border-slate-50 grayscale opacity-70'}`}>
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${getGatewayColor(gateway.id)}`}>
                      {getGatewayIcon(gateway.id)}
                   </div>
                   <button 
                    onClick={() => handleToggle(gateway.id, gateway.enabled)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${gateway.enabled ? 'bg-emerald-50' : 'bg-slate-300'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${gateway.enabled ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{gateway.name}</h3>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{gateway.type} protocol</p>
                </div>

                <div className="space-y-3 mb-8 relative z-10">
                   <div className="flex flex-wrap gap-1.5">
                      {gateway.allowedFor.map(usage => (
                        <span key={usage} className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded text-[7px] font-black uppercase tracking-widest">{usage}</span>
                      ))}
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${gateway.sandbox ? 'bg-amber-400' : 'bg-indigo-400'} animate-pulse`}></div>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{gateway.sandbox ? 'Test-Node active' : 'Production Link'}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase">Rank: {gateway.priority}</span>
                   </div>
                </div>

                <button 
                  onClick={() => onNavigate(`gateway-${gateway.id}`)}
                  className="mt-auto w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 shadow-xl"
                >
                   <Settings2 size={14}/> Configure Node <ChevronRight size={14}/>
                </button>

                <ShieldCheck className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000" size={180} />
             </div>
           ))
         )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl border border-white/5">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
               <ShieldAlert size={28} />
               <h3 className="text-xl font-black uppercase tracking-tight italic leading-none">Password Updated Audit</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
              Modular payment logic prevents cross-protocol failure. Enabling a node allows subscribers to choose it as a fiscal entry point for service activations and wallet credit.
            </p>
         </div>
         <Activity className="absolute -right-16 -bottom-16 opacity-5 scale-150 pointer-events-none" size={300} />
         <button 
          onClick={() => setShowLogs(true)}
          className="relative z-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
         >
            <Layers size={16}/> Protocol Logs <ArrowRight size={14}/>
         </button>
      </div>

      {showLogs && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl h-[80vh] shadow-2xl animate-in zoom-in duration-300 overflow-hidden flex flex-col">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <History size={28}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black italic uppercase text-slate-900">Fiscal Protocol Logs</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gateway Registry Audit trail</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <select 
                      className="px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                      value={logFilter}
                      onChange={e => setLogFilter(e.target.value)}
                    >
                       <option value="All">All Gateways</option>
                       {gateways.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                    <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                       <X size={24}/>
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30 custom-scrollbar">
                 {filteredLogs.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <ShieldAlert size={64} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">No gateway logs found in current registry pulse.</p>
                   </div>
                 ) : (
                   filteredLogs.map(log => (
                     <div key={log.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-xl hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${log.type === LedgerType.DEBIT ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <ArrowRightLeft size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.description}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">{log.method}</span>
                                 <span className="text-[10px] text-slate-300">•</span>
                                 <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1"><Clock size={10}/> {new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-xl font-black italic tracking-tighter ${log.type === LedgerType.DEBIT ? 'text-red-600' : 'text-emerald-600'}`}>
                              {log.type === LedgerType.DEBIT ? '-' : '+'} Rs. {log.amount.toLocaleString()}
                           </p>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registry ID: {log.id.split('_').pop()}</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>

              <div className="p-6 bg-slate-950 border-t border-white/5 flex items-center justify-between text-white">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <span className="text-[9px] font-black uppercase text-slate-400">Ledger Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                       <span className="text-[9px] font-black uppercase text-slate-400">AES-256 Encrypted</span>
                    </div>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">ClickOpticx Fiscal v8.5</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsIndex;

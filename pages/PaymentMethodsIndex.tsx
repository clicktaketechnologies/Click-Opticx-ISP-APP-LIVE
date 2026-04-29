
import React, { useState, useMemo } from 'react';
import { AppState, PaymentGateway, LedgerType } from '../types';
import { db } from '../db';
import { 
  CreditCard, Globe, Smartphone, Banknote, ShieldCheck, 
  ChevronRight, Activity, Zap, ShieldAlert, CheckCircle, 
  Settings2, Power, Layers, ArrowRight, Landmark, Map, X,
  History, Clock, ArrowRightLeft, UserCircle
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

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
      case 'easypaisa': return 'bg-green-600';
      case 'cash': return 'bg-slate-900';
      case 'paypal': return 'bg-blue-700';
      case 'bank': return 'bg-blue-800';
      case 'home': return 'bg-purple-600';
      case 'payfast': return 'bg-amber-500';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <CreditCard className="text-blue-600" size={32} />
            Fiscal Gateways
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Global Protocol Management • Tiered Architecture</p>
        </div>
        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
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
             <div key={gateway.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${gateway.enabled ? 'border-blue-100 shadow-blue-50 shadow-lg' : 'border-slate-50 grayscale opacity-70'}`}>
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${getGatewayColor(gateway.id)}`}>
                      {getGatewayIcon(gateway.id)}
                   </div>
                   <button 
                    onClick={() => handleToggle(gateway.id, gateway.enabled)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${gateway.enabled ? 'bg-green-50' : 'bg-slate-300'}`}
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
                         <div className={`w-1.5 h-1.5 rounded-full ${gateway.sandbox ? 'bg-amber-400' : 'bg-blue-400'} animate-pulse`}></div>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{gateway.sandbox ? 'Test-Node active' : 'Production Link'}</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase">Rank: {gateway.priority}</span>
                   </div>
                </div>

                <button 
                  onClick={() => onNavigate(`gateway-${gateway.id}`)}
                  className="mt-auto w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 shadow-xl"
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
            <div className="flex items-center gap-3 text-blue-400">
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

      <Modal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        title="Fiscal Protocol Logs"
        type="form"
        icon={<History size={20} className="text-blue-400" />}
        maxWidth="max-w-4xl"
        scrollable
        headerRightContent={
          <select
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none text-white"
            value={logFilter}
            onChange={e => setLogFilter(e.target.value)}
          >
            <option value="All">All Gateways</option>
            {gateways.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
        }
      >
        <div className="space-y-3" style={{ minHeight: '400px' }}>
          {filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
              <ShieldAlert size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">No gateway logs found.</p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-blue-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    log.type === LedgerType.DEBIT ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-green-900/30 border-green-800 text-green-400'
                  }`}>
                    <ArrowRightLeft size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-blue-400 font-black uppercase bg-blue-900/30 px-1.5 py-0.5 rounded">{log.method}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1"><Clock size={9}/> {new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black italic ${log.type === LedgerType.DEBIT ? 'text-red-400' : 'text-green-400'}`}>
                    {log.type === LedgerType.DEBIT ? '-' : '+'} Rs. {(log.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PaymentMethodsIndex;


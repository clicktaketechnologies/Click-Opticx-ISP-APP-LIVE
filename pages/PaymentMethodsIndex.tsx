import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Globe, Smartphone, Banknote, ShieldCheck, 
  ChevronRight, Activity, Zap, ShieldAlert, CheckCircle, 
  Settings2, Power, Layers, ArrowRight, Landmark, Map, X,
  History, Clock, ArrowRightLeft, UserCircle, AlertTriangle,
  Server, Eye, EyeOff, Save, RotateCw, Play, Wallet
} from 'lucide-react';
import { AppState, PaymentGateway, Role } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

interface Props {
  state: AppState;
  onNavigate: (page: string) => void;
}

const PaymentMethodsIndex: React.FC<Props> = ({ state, onNavigate }) => {
  if (!state || !state.settings) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Mini5GMicroLoader size={48} />
      </div>
    );
  }
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const gateways = useMemo(() => state.settings.paymentGateways || [], [state.settings.paymentGateways]);
  const canEdit = [Role.SUPER_ADMIN, Role.FINANCE_ADMIN].includes(state.currentUser?.role as Role);

  const handleToggle = async (id: string, updates: Partial<PaymentGateway>) => {
    if (!canEdit) return;
    await db.updateGatewayConfig(id, updates);
  };

  const handleSaveConfig = async () => {
    if (!selectedGateway || !canEdit) return;
    setIsSaving(true);
    try {
        await db.updateGatewayConfig(selectedGateway.id, selectedGateway);
        setIsConfigOpen(false);
    } catch (e) {
        alert('Save failed.');
    } finally {
        setIsSaving(false);
    }
  };

  const getGatewayIcon = (id: string) => {
    const gid = id.toLowerCase();
    if (gid.includes('stripe')) return <Globe size={24} />;
    if (gid.includes('jazzcash') || gid.includes('easypaisa')) return <Smartphone size={24} />;
    if (gid.includes('cash')) return <Banknote size={24} />;
    if (gid.includes('bank')) return <Landmark size={24} />;
    if (gid.includes('home')) return <Map size={24} />;
    if (gid.includes('payfast') || gid.includes('zap')) return <Zap size={24} />;
    if (gid.includes('sumup')) return <Layers size={24} />;
    if (gid.includes('wallet')) return <Wallet size={24} />;
    return <CreditCard size={24} />;
  };

  const getGatewayColor = (id: string) => {
    const gid = id.toLowerCase();
    if (gid.includes('stripe')) return 'bg-blue-600';
    if (gid.includes('jazzcash')) return 'bg-rose-600';
    if (gid.includes('easypaisa')) return 'bg-green-600';
    if (gid.includes('cash')) return 'bg-slate-900';
    if (gid.includes('payfast')) return 'bg-amber-500';
    if (gid.includes('sumup')) return 'bg-cyan-600';
    if (gid.includes('wallet')) return 'bg-indigo-600';
    if (gid.includes('bank')) return 'bg-blue-800';
    return 'bg-blue-600';
  };

  if (loading) {
    return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Mini5GMicroLoader size={48} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Synchronizing Fiscal Nodes...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <CreditCard className="text-blue-600" size={32} />
            Fiscal Gateways
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Global Protocol Management • Config-Driven Routing</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => onNavigate('admin-live-monitoring')}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
            >
                <Activity size={14} className="text-blue-500" /> Live Pulse
            </button>
            <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase text-white">Active Listeners: {gateways.filter(g => g.enabled).length}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gateways.map(gateway => (
              <div key={gateway.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${gateway.enabled ? 'border-blue-100 shadow-blue-50 shadow-lg' : 'border-slate-50 grayscale opacity-70'}`}>
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${getGatewayColor(gateway.id)}`}>
                      {getGatewayIcon(gateway.id)}
                   </div>
                   <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleToggle(gateway.id, { sandbox: !gateway.sandbox })}
                            className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all ${gateway.sandbox ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}
                        >
                            {gateway.sandbox ? 'Sandbox' : 'Live'}
                        </button>
                        <button 
                            onClick={() => handleToggle(gateway.id, { enabled: !gateway.enabled })}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${gateway.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${gateway.enabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                   </div>
                </div>

                <div className="space-y-1 mb-4 relative z-10">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{gateway.name}</h3>
                   <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${gateway.enabled ? 'bg-green-500' : 'bg-rose-500'}`}></div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{gateway.enabled ? 'Enabled' : 'Disabled'}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Priority</p>
                        <p className="text-sm font-black text-slate-900 italic">
                            Order: {gateway.priority}
                        </p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Type</p>
                        <p className="text-sm font-black text-slate-900 italic uppercase">
                            {gateway.type}
                        </p>
                    </div>
                </div>

                <button 
                  onClick={() => { setSelectedGateway({ ...gateway }); setIsConfigOpen(true); }}
                  className="mt-auto w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 shadow-xl"
                >
                   <Settings2 size={14}/> Configure Node <ChevronRight size={14}/>
                </button>

                <ShieldCheck className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000" size={180} />
              </div>
          ))}
      </div>

      {/* Production Health Banner */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl border border-white/5">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
               <ShieldAlert size={28} />
               <h3 className="text-xl font-black uppercase tracking-tight italic leading-none">Fiscal Registry Node Monitor</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
              Modular payment logic prevents cross-protocol failure. Enabling a node allows subscribers to choose it as a fiscal entry point. Config-driven architecture ensures real-time routing updates.
            </p>
         </div>
         <div className="relative z-10 flex gap-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Health Tier</p>
                <div className="flex items-center justify-center gap-2">
                    <Server size={14} className="text-blue-500" />
                    <p className="text-2xl font-black text-green-400">ULTRA</p>
                </div>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Nodes</p>
                <div className="flex items-center justify-center gap-2">
                    <Activity size={14} className="text-green-500 animate-pulse" />
                    <p className="text-2xl font-black text-blue-400">{gateways.filter(g => g.enabled).length}</p>
                </div>
            </div>
         </div>
         <Globe className="absolute -right-16 -bottom-16 opacity-5 scale-150 pointer-events-none" size={300} />
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={isConfigOpen && !!selectedGateway}
        onClose={() => setIsConfigOpen(false)}
        title={selectedGateway ? `${selectedGateway.name} Integration` : 'Configuration'}
        type="form"
        icon={selectedGateway ? getGatewayIcon(selectedGateway.id) : undefined}
        maxWidth="max-w-2xl"
        scrollable
        isLoading={isSaving}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setIsConfigOpen(false)} disabled={isSaving} className="flex-1 py-3 font-black text-slate-400 hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest text-[10px] disabled:opacity-30">Abort Updates</button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              {isSaving ? <Mini5GMicroLoader size={16} /> : <ShieldCheck size={16} />}
              Push Configuration
            </button>
          </div>
        }
      >
        {selectedGateway && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black uppercase text-white tracking-tight">Node Topology</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Priority & Routing Weights</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Priority</label>
                        <input 
                            type="number"
                            className="w-16 p-2 bg-slate-700 border-none rounded-xl text-center font-black text-white"
                            value={selectedGateway.priority}
                            onChange={e => setSelectedGateway({ ...selectedGateway, priority: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Connection Credentials</h4>
                    <button
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-400"
                    >
                        {showSecrets ? <EyeOff size={12}/> : <Eye size={12}/>} {showSecrets ? 'Mask Tokens' : 'Reveal Secrets'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(selectedGateway.config).map(key => (
                      <div key={key} className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                          type={!showSecrets && (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('password')) ? 'password' : 'text'}
                          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs outline-none focus:border-blue-500 text-white"
                          value={selectedGateway.config[key]}
                          onChange={e => {
                            const newConfig = { ...selectedGateway.config };
                            newConfig[key] = e.target.value;
                            setSelectedGateway({ ...selectedGateway, config: newConfig });
                          }}
                        />
                      </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Webhook & Callback Topology</h4>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Endpoint URL</label>
                        <div className="flex gap-2">
                            <input 
                                readOnly
                                className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-slate-400 cursor-not-allowed"
                                value={selectedGateway.webhook_url || `${db.getBackendUrl()}/api/payments/webhooks/${selectedGateway.id}`}
                            />
                            <button className="px-4 bg-slate-800 text-blue-400 rounded-xl hover:bg-slate-700 transition-all"><Layers size={14}/></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-3">
              <button className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                <Play size={12}/> Test Connectivity
              </button>
              <button className="flex-1 py-3 bg-slate-800/50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2">
                <Server size={12}/> View Logs
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentMethodsIndex;

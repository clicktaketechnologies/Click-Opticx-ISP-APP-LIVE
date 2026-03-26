import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, ConnectionStatus, Role, TechnicalConfig } from '../types';
import { db } from '../db';
import { 
  Network, Search, UserCircle, ChevronRight, HardDrive, 
  Cpu, Save, RefreshCw, Layers, ShieldCheck, Globe, 
  Wifi, Flame, Info, CheckCircle, Smartphone,
  Plus, Trash2, Settings2, Database, Zap, ListPlus, Box,
  ArrowRight, DollarSign, BarChart3, Activity, PieChart,
  Server, ShieldAlert, TrendingUp, CheckSquare, Square, 
  ArrowLeftRight, Filter, Hash, Tag, AlertCircle, X
} from 'lucide-react';

const ConnectionSetupAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeView, setActiveView] = useState<'provisioning' | 'catalog' | 'audit'>('provisioning');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Fiber' | 'Wireless'>('All');
  const [macSearch, setMacSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Catalog Management States
  const [techConfig, setTechConfig] = useState<TechnicalConfig>(state.settings.techConfig);
  
  const selectedUser = useMemo(() => state.users.find(u => u.id === selectedUserId), [state.users, selectedUserId]);
  const activeUsers = useMemo(() => state.users.filter(u => !u.deleted), [state.users]);

  const filteredUsers = useMemo(() => {
    return activeUsers.filter(u => {
      const term = searchTerm.toLowerCase().trim();
      const matchesMain = u.name.toLowerCase().includes(term) || 
                         u.connectionId.toLowerCase().includes(term);
      
      const matchesType = typeFilter === 'All' || u.connectionType === typeFilter;
      
      const macTerm = macSearch.toLowerCase().trim();
      const matchesMac = !macTerm || (u.macIp && u.macIp.toLowerCase().includes(macTerm));
      
      const modTerm = modelSearch.toLowerCase().trim();
      const model = u.connectionType === 'Fiber' ? u.fiberInfo?.deviceName : u.wirelessInfo?.onuModel;
      const matchesModel = !modTerm || (model && model.toLowerCase().includes(modTerm));
      
      return matchesMain && matchesType && matchesMac && matchesModel;
    });
  }, [activeUsers, searchTerm, typeFilter, macSearch, modelSearch]);

  // Provisioning Form States
  const [fiberForm, setFiberForm] = useState<any>({
    deviceName: '',
    devicePrice: 0,
    deviceSerial: '',
    assetTag: '',
    opticalPowerRange: '-18 to -22 dBm',
    opticalPowerPrice: 500,
    fiberColor: 'Blue',
    cableCore: 2,
    cableMeters: 50,
    cableBasePrice: 0,
    splitterType: '1:4 Splitter',
    splitterPrice: 1200,
    duckPattiQty: 5,
    duckPattiPrice: 150,
    patchCordQty: 1,
    patchCordPrice: 250,
    notes: ''
  });

  const [wirelessForm, setWirelessForm] = useState<any>({
    cat6Meters: 30,
    cat6PricePerMeter: 0,
    clipsQty: 50,
    clipPrice: 0,
    ravalBoldPairs: 2,
    ravalBoldPrice: 0,
    pollHeight: '',
    pollPrice: 0,
    signalStrength: 'High',
    signalStrengthPrice: 0,
    homeTowerHeight: '15ft',
    receiverModel: '',
    receiverPrice: 0,
    onuModel: '',
    onuPrice: 0,
    deviceSerial: '',
    assetTag: '',
    towerAPDevice: 'AP-NODE-01',
    towerAPPrice: 500,
    notes: ''
  });

  // Bulk Selection Handlers
  const toggleBulkSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedBulkIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBulkIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedBulkIds.size === filteredUsers.length) {
      setSelectedBulkIds(new Set());
    } else {
      setSelectedBulkIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkChangeType = async (type: 'Fiber' | 'Wireless') => {
    if (selectedBulkIds.size === 0) return;
    setIsSaving(true);
    for (const id of selectedBulkIds) {
      await db.updateConnectionDetails(id, { connectionType: type });
    }
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Batch Transformation', `Linked ${selectedBulkIds.size} nodes to ${type} protocol.`);
    }, 500);
  };

  const handleToggleIndividualType = async () => {
    if (!selectedUserId || !selectedUser) return;
    const nextType = selectedUser.connectionType === 'Fiber' ? 'Wireless' : 'Fiber';
    await db.updateConnectionDetails(selectedUserId, { connectionType: nextType });
    db.logNotification(selectedUser.id, 'info', 'Type Migration', `Node ${selectedUser.connectionId} shifted to ${nextType} path.`);
  };

  // Infrastructure Audit Calculations
  const auditMetrics = useMemo(() => {
    let totalFiberValue = 0;
    let totalWirelessValue = 0;
    let fiberMeters = 0;
    let cat6Meters = 0;
    const deviceInventory: Record<string, number> = {};

    activeUsers.forEach(u => {
      if (u.connectionStatus === ConnectionStatus.ACTIVE || u.connectionStatus === ConnectionStatus.INSTALLED) {
        if (u.connectionType === 'Fiber' && u.fiberInfo) {
          const f = u.fiberInfo;
          const cost = (f.devicePrice || 0) + (f.opticalPowerPrice || 0) + ((f.cableMeters || 0) * (f.cableBasePrice || 0)) + (f.splitterPrice || 0) + ((f.duckPattiQty || 0) * (f.duckPattiPrice || 0)) + ((f.patchCordQty || 0) * (f.patchCordPrice || 0));
          totalFiberValue += cost;
          fiberMeters += (f.cableMeters || 0);
          if (f.deviceName) deviceInventory[f.deviceName] = (deviceInventory[f.deviceName] || 0) + 1;
        } else if (u.connectionType === 'Wireless' && u.wirelessInfo) {
          const w = u.wirelessInfo;
          const cost = ((w.cat6Meters || 0) * (w.cat6PricePerMeter || 0)) + ((w.clipsQty || 0) * (w.clipPrice || 0)) + ((w.ravalBoldPairs || 0) * (w.ravalBoldPrice || 0)) + (w.pollPrice || 0) + (w.signalStrengthPrice || 0) + (w.receiverPrice || 0) + (w.onuPrice || 0) + (w.towerAPPrice || 0);
          totalWirelessValue += cost;
          cat6Meters += (w.cat6Meters || 0);
          if (w.receiverModel) deviceInventory[w.receiverModel] = (deviceInventory[w.receiverModel] || 0) + 1;
          if (w.onuModel) deviceInventory[w.onuModel] = (deviceInventory[w.onuModel] || 0) + 1;
        }
      }
    });

    return {
      totalValue: totalFiberValue + totalWirelessValue,
      fiberValue: totalFiberValue,
      wirelessValue: totalWirelessValue,
      fiberMeters,
      cat6Meters,
      deviceInventory,
      activeNodes: activeUsers.filter(u => u.connectionStatus !== ConnectionStatus.PENDING).length
    };
  }, [activeUsers]);

  // Load User Data into Provisioning Form
  useEffect(() => {
    if (selectedUser) {
      setErrors({});
      const globalCfg = state.settings.techConfig;
      if (selectedUser.connectionType === 'Fiber') {
        const defaultOnu = globalCfg.fiber.onus[0];
        setFiberForm({
          ...fiberForm,
          deviceName: selectedUser.fiberInfo?.deviceName || defaultOnu?.model || '',
          devicePrice: selectedUser.fiberInfo?.devicePrice || defaultOnu?.price || 0,
          deviceSerial: selectedUser.fiberInfo?.deviceSerial || '',
          assetTag: selectedUser.fiberInfo?.assetTag || '',
          cableBasePrice: globalCfg.fiber.wirePricePerMeter,
          ...selectedUser.fiberInfo
        });
      } else {
        const defaultReceiver = globalCfg.wireless.receivers[0];
        const defaultOnu = globalCfg.wireless.onus[0];
        const defaultPoll = globalCfg.wireless.polls[0];
        setWirelessForm({
          ...wirelessForm,
          cat6PricePerMeter: globalCfg.wireless.cat6PricePerMeter,
          clipPrice: globalCfg.wireless.clipPrice,
          ravalBoldPrice: globalCfg.wireless.ravalBoldPricePerPair,
          receiverModel: selectedUser.wirelessInfo?.receiverModel || defaultReceiver?.model || '',
          receiverPrice: selectedUser.wirelessInfo?.receiverPrice || defaultReceiver?.price || 0,
          onuModel: selectedUser.wirelessInfo?.onuModel || defaultOnu?.model || '',
          onuPrice: selectedUser.wirelessInfo?.onuPrice || defaultOnu?.price || 0,
          pollHeight: selectedUser.wirelessInfo?.pollHeight || defaultPoll?.height || '',
          pollPrice: selectedUser.wirelessInfo?.pollPrice || defaultPoll?.price || 0,
          deviceSerial: selectedUser.wirelessInfo?.deviceSerial || '',
          assetTag: selectedUser.wirelessInfo?.assetTag || '',
          ...selectedUser.wirelessInfo
        });
      }
    }
  }, [selectedUserId, selectedUser?.connectionType, state.settings.techConfig]);

  const packagePrice = useMemo(() => {
    if (!selectedUser) return 0;
    const pkg = state.packages.find(p => p.id === selectedUser.packageId);
    return pkg ? pkg.price : 0;
  }, [selectedUser, state.packages]);

  const fiberTotal = useMemo(() => {
    const f = fiberForm;
    const cableTotal = (f.cableCore || 0) * (f.cableMeters || 0) * (f.cableBasePrice || 0);
    const duckPattiTotal = (f.duckPattiQty || 0) * (f.duckPattiPrice || 0);
    const patchCordTotal = (f.patchCordQty || 0) * (f.patchCordPrice || 0);
    return (f.devicePrice || 0) + (f.opticalPowerPrice || 0) + cableTotal + (f.splitterPrice || 0) + duckPattiTotal + patchCordTotal + packagePrice;
  }, [fiberForm, packagePrice]);

  const wirelessTotal = useMemo(() => {
    const w = wirelessForm;
    const cat6Total = (w.cat6Meters || 0) * (w.cat6PricePerMeter || 0);
    const clipsTotal = (w.clipsQty || 0) * (w.clipPrice || 0);
    const boltTotal = (w.ravalBoldPairs || 0) * (w.ravalBoldPrice || 0);
    return cat6Total + clipsTotal + boltTotal + (w.pollPrice || 0) + (w.signalStrengthPrice || 0) + (w.receiverPrice || 0) + (w.onuPrice || 0) + (w.towerAPPrice || 0) + packagePrice;
  }, [wirelessForm, packagePrice]);

  const handleSaveProvisioning = async () => {
    if (!selectedUserId) return;
    
    const newErrors: Record<string, string> = {};
    const validate = () => {
      if (selectedUser?.connectionType === 'Fiber') {
        const f = fiberForm;
        if (f.devicePrice < 0) newErrors.devicePrice = "Cannot be negative";
        if (f.cableMeters < 0) newErrors.cableMeters = "Cannot be negative";
        if (f.cableMeters > 5000) newErrors.cableMeters = "Exceeds standard 5km limit";
        if (f.duckPattiQty < 0) newErrors.duckPattiQty = "Cannot be negative";
        if (f.patchCordQty < 0) newErrors.patchCordQty = "Cannot be negative";
      } else {
        const w = wirelessForm;
        if (w.cat6Meters < 0) newErrors.cat6Meters = "Cannot be negative";
        if (w.cat6Meters > 1000) newErrors.cat6Meters = "Exceeds standard 1km limit";
        if (w.clipsQty < 0) newErrors.clipsQty = "Cannot be negative";
        if (w.ravalBoldPairs < 0) newErrors.ravalBoldPairs = "Cannot be negative";
      }
      return Object.keys(newErrors).length === 0;
    };

    if (!validate()) {
      setErrors(newErrors);
      alert("Validation Failed: Please correct highlighted fields in the dossier.");
      return;
    }

    setIsSaving(true);
    const updateData: any = {
      connectionStatus: ConnectionStatus.ACTIVE,
      activationCount: (selectedUser?.activationCount || 0) + 1,
      connectionType: selectedUser?.connectionType
    };
    if (selectedUser?.connectionType === 'Fiber') updateData.fiberInfo = fiberForm;
    else updateData.wirelessInfo = wirelessForm;

    await db.updateConnectionDetails(selectedUserId, updateData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification(selectedUser!.id, 'success', 'Hardware Link Published', `Dossier for ${selectedUser?.name} is now live.`);
    }, 800);
  };

  const handleSaveCatalog = async () => {
    setIsSaving(true);
    await db.updateSettings({ ...state.settings, techConfig });
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Hardware Registry Synced', 'Global pricing and equipment nodes updated.');
    }, 800);
  };

  const addCatalogItem = (path: 'wireless' | 'fiber', list: string, template: any) => {
    const next = { ...techConfig };
    (next[path] as any)[list].push(template);
    setTechConfig(next);
  };

  const removeCatalogItem = (path: 'wireless' | 'fiber', list: string, index: number) => {
    const next = { ...techConfig };
    (next[path] as any)[list].splice(index, 1);
    setTechConfig(next);
  };

  const getInputClass = (key: string) => {
    const base = "w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs outline-none transition-all";
    return errors[key] ? `${base} border-rose-500 bg-rose-50 ring-2 ring-rose-100` : `${base} focus:border-indigo-500`;
  };

  const runAudit = () => {
    // Audit implementation
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Network className="text-indigo-600" size={32} />
            Hardware Command Center
          </h2>
          <p className="text-slate-500 font-medium">Control individual link setups or globally define equipment catalog pricing.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setActiveView('provisioning')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'provisioning' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Zap size={14} /> Node Setup
          </button>
          <button 
            onClick={() => setActiveView('catalog')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'catalog' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Database size={14} /> Hardware Catalog
          </button>
          <button 
            onClick={() => setActiveView('audit')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <BarChart3 size={14} /> Infrastructure Audit
          </button>
        </div>
      </div>

      {activeView === 'provisioning' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
                      placeholder="Name or Connection ID..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                       {['All', 'Fiber', 'Wireless'].map((f: any) => (
                         <button 
                          key={f} 
                          onClick={() => setTypeFilter(f)}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${typeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                         >
                            {f}
                         </button>
                       ))}
                    </div>
                    <div className="relative">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-[10px] font-black uppercase"
                         placeholder="Filter by MAC Address..."
                         value={macSearch}
                         onChange={e => setMacSearch(e.target.value)}
                       />
                    </div>
                    <div className="relative">
                       <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-[10px] font-black uppercase"
                         placeholder="Filter by Hardware Model..."
                         value={modelSearch}
                         onChange={e => setModelSearch(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between px-2">
                 <button onClick={toggleSelectAll} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedBulkIds.size === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}
                    {selectedBulkIds.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All In View'}
                 </button>
                 {selectedBulkIds.size > 0 && (
                   <span className="text-[9px] font-black uppercase text-indigo-600 animate-pulse">{selectedBulkIds.size} Linked</span>
                 )}
              </div>
            </div>

            {selectedBulkIds.size > 0 && (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                   <Layers className="text-indigo-400" size={20}/>
                   <h3 className="text-xs font-black uppercase tracking-widest italic">Batch Protocols</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => handleBulkChangeType('Fiber')}
                    disabled={isSaving}
                    className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 transition-all group"
                   >
                      <Flame size={20} className="text-blue-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase">Switch Fiber</span>
                   </button>
                   <button 
                    onClick={() => handleBulkChangeType('Wireless')}
                    disabled={isSaving}
                    className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-600 transition-all group"
                   >
                      <Wifi size={20} className="text-emerald-400 group-hover:text-white" />
                      <span className="text-[8px] font-black uppercase">Switch Wireless</span>
                   </button>
                </div>
                <button 
                  onClick={() => setSelectedBulkIds(new Set())}
                  className="w-full py-3 bg-white/10 text-slate-400 rounded-xl font-black text-[9px] uppercase hover:bg-white/20 transition-all"
                >
                   Clear Batch
                </button>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Registry</h3>
                 <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 border px-2 py-0.5 rounded uppercase">Filtered: {filteredUsers.length}</span>
              </div>
              <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                 {filteredUsers.map(u => (
                   <button 
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full p-6 text-left transition-all flex items-center justify-between group ${selectedUserId === u.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'} ${selectedBulkIds.has(u.id) ? 'bg-indigo-50/50 ring-2 ring-indigo-200 ring-inset' : ''}`}
                   >
                      <div className="flex items-center gap-4">
                         <div onClick={(e) => toggleBulkSelect(u.id, e)} className={`p-1 transition-all ${selectedUserId === u.id ? 'text-white' : 'text-slate-300 hover:text-indigo-600'}`}>
                            {selectedBulkIds.has(u.id) ? <CheckSquare size={18}/> : <Square size={18}/>}
                         </div>
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${selectedUserId === u.id ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <UserCircle size={24} />
                         </div>
                         <div className="overflow-hidden">
                            <p className="font-black uppercase tracking-tight text-sm leading-none mb-1 truncate w-32">{u.name}</p>
                            <p className={`text-[10px] font-bold uppercase truncate w-32 ${selectedUserId === u.id ? 'text-indigo-200' : 'text-slate-400'}`}>{u.connectionId} • {u.connectionType}</p>
                         </div>
                      </div>
                      <ChevronRight size={18} className={selectedUserId === u.id ? 'text-white' : 'text-slate-200'} />
                   </button>
                 ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            {!selectedUser ? (
              <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20">
                <Layers className="text-slate-100 mb-8" size={80} />
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Initialize Node Provisioning</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2 leading-relaxed">
                   Select a registry node or start a batch selection to deploy physical infrastructure parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                      <div className="space-y-6 flex-1">
                         <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                               {selectedUser.connectionType === 'Fiber' ? <Flame size={32} className="text-blue-400" /> : <Wifi size={32} className="text-emerald-400" />}
                            </div>
                            <div>
                               <h3 className="text-3xl font-black uppercase tracking-tighter italic">{selectedUser.name}</h3>
                               <div className="flex items-center gap-3">
                                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.4em]">{selectedUser.connectionType} LINK LAYER</p>
                                  <button 
                                    onClick={handleToggleIndividualType}
                                    className="px-2 py-0.5 bg-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-white/50 hover:bg-white/20 hover:text-white transition-all flex items-center gap-1"
                                  >
                                     <ArrowLeftRight size={10}/> Migrat Path
                                  </button>
                               </div>
                            </div>
                         </div>
                         <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center">
                            <div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Authorized Tier</p>
                               <p className="text-lg font-black text-white uppercase">{state.packages.find(p => p.id === selectedUser.packageId)?.name || 'NO PLAN'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fiscal Total</p>
                               <p className="text-3xl font-black text-emerald-400 italic">Rs. {selectedUser.connectionType === 'Fiber' ? fiberTotal.toLocaleString() : wirelessTotal.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={handleSaveProvisioning}
                        disabled={isSaving}
                        className="px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                         {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20} />}
                         Deploy Parameters
                      </button>
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-10">
                   {selectedUser.connectionType === 'Fiber' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Equipment Selection</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">ONU Model</label>
                                 <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={fiberForm.deviceName} onChange={e => {
                                   const match = state.settings.techConfig.fiber.onus.find(o => o.model === e.target.value);
                                   setFiberForm({...fiberForm, deviceName: e.target.value, devicePrice: match?.price || 0});
                                 }}>
                                    <option value="">Choose Registry ONU...</option>
                                    {state.settings.techConfig.fiber.onus.map(o => <option key={o.model} value={o.model}>{o.model} (Rs.{o.price})</option>)}
                                 </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Serial Number</label>
                                    <div className="relative">
                                       <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                       <input className="w-full pl-8 pr-3 py-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="SN-..." value={fiberForm.deviceSerial} onChange={e => setFiberForm({...fiberForm, deviceSerial: e.target.value})} />
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Asset Tag</label>
                                    <div className="relative">
                                       <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                       <input className="w-full pl-8 pr-3 py-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="ISP-..." value={fiberForm.assetTag} onChange={e => setFiberForm({...fiberForm, assetTag: e.target.value})} />
                                    </div>
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Optical Power</label>
                                    <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={fiberForm.opticalPowerRange} onChange={e => setFiberForm({...fiberForm, opticalPowerRange: e.target.value})} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Power Surcharge</label>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      className={getInputClass('opticalPowerPrice')} 
                                      value={fiberForm.opticalPowerPrice} 
                                      onChange={e => setFiberForm({...fiberForm, opticalPowerPrice: Number(e.target.value)})} 
                                    />
                                    {errors.opticalPowerPrice && <p className="text-[8px] text-rose-500 font-black uppercase ml-1">{errors.opticalPowerPrice}</p>}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Fiber Inventory</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cable Core</label>
                                 <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={fiberForm.cableCore} onChange={e => setFiberForm({...fiberForm, cableCore: Number(e.target.value)})}>
                                    {[1, 2, 4, 6, 12].map(c => <option key={c} value={c}>{c} Core</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cable Meters</label>
                                 <input 
                                   type="number" 
                                   min="0" 
                                   max="5000"
                                   className={getInputClass('cableMeters')} 
                                   value={fiberForm.cableMeters} 
                                   onChange={e => setFiberForm({...fiberForm, cableMeters: Number(e.target.value)})} 
                                 />
                                 {errors.cableMeters && <p className="text-[8px] text-rose-500 font-black uppercase ml-1">{errors.cableMeters}</p>}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Setup Technical Notes</label>
                              <textarea className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-[10px] h-20 uppercase" value={fiberForm.notes} onChange={e => setFiberForm({...fiberForm, notes: e.target.value})} placeholder="Audit observations..." />
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Link Hardware</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">PTP Receiver</label>
                                 <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={wirelessForm.receiverModel} onChange={e => {
                                   const match = state.settings.techConfig.wireless.receivers.find(r => r.model === e.target.value);
                                   setWirelessForm({...wirelessForm, receiverModel: e.target.value, receiverPrice: match?.price || 0});
                                 }}>
                                    <option value="">Select Receiver Node...</option>
                                    {state.settings.techConfig.wireless.receivers.map(r => <option key={r.model} value={r.model}>{r.model}</option>)}
                                 </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Device Serial</label>
                                    <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="SN-..." value={wirelessForm.deviceSerial} onChange={e => setWirelessForm({...wirelessForm, deviceSerial: e.target.value})} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Asset Tag</label>
                                    <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase" placeholder="TAG-..." value={wirelessForm.assetTag} onChange={e => setWirelessForm({...wirelessForm, assetTag: e.target.value})} />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Pole Height</label>
                                    <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={wirelessForm.pollHeight} onChange={e => {
                                       const match = state.settings.techConfig.wireless.polls.find(p => p.height === e.target.value);
                                       setWirelessForm({...wirelessForm, pollHeight: e.target.value, pollPrice: match?.price || 0});
                                    }}>
                                       <option value="">Select Pole Registry...</option>
                                       {state.settings.techConfig.wireless.polls.map(p => <option key={p.height} value={p.height}>{p.height}</option>)}
                                    </select>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">CAT6 Length (M)</label>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="1000"
                                      className={getInputClass('cat6Meters')} 
                                      value={wirelessForm.cat6Meters} 
                                      onChange={e => setWirelessForm({...wirelessForm, cat6Meters: Number(e.target.value)})} 
                                    />
                                    {errors.cat6Meters && <p className="text-[8px] text-rose-500 font-black uppercase ml-1">{errors.cat6Meters}</p>}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Client-Side Logic</h4>
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Local ONU/Router</label>
                                 <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={wirelessForm.onuModel} onChange={e => {
                                    const match = state.settings.techConfig.wireless.onus.find(o => o.model === e.target.value);
                                    setWirelessForm({...wirelessForm, onuModel: e.target.value, onuPrice: match?.price || 0});
                                 }}>
                                    <option value="">Choose Node Router...</option>
                                    {state.settings.techConfig.wireless.onus.map(o => <option key={o.model} value={o.model}>{o.model}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Setup Technical Notes</label>
                                 <textarea className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-[10px] h-20 uppercase" value={wirelessForm.notes} onChange={e => setWirelessForm({...wirelessForm, notes: e.target.value})} placeholder="Audit observations..." />
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'catalog' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <Wifi size={24} className="text-emerald-400" />
                       <div>
                          <h3 className="text-xl font-black uppercase tracking-tight italic">Wireless Registry Catalog</h3>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global PTP Hardware Node</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 space-y-10">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14}/> Unit Pricing (Auto-Calc)</h4>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase">CAT6 (M)</label>
                             <input type="number" min="0" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={techConfig.wireless.cat6PricePerMeter} onChange={e => setTechConfig({...techConfig, wireless: {...techConfig.wireless, cat6PricePerMeter: Math.max(0, Number(e.target.value))}})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase">Clips (Unit)</label>
                             <input type="number" min="0" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={techConfig.wireless.clipPrice} onChange={e => setTechConfig({...techConfig, wireless: {...techConfig.wireless, clipPrice: Math.max(0, Number(e.target.value))}})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase">Bolt (Pair)</label>
                             <input type="number" min="0" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={techConfig.wireless.ravalBoldPricePerPair} onChange={e => setTechConfig({...techConfig, wireless: {...techConfig.wireless, ravalBoldPricePerPair: Math.max(0, Number(e.target.value))}})} />
                          </div>
                       </div>
                    </div>

                    {[
                       { label: 'Poll Elevation Registry', key: 'polls', template: { height: 'New Poll', price: 0 }, icon: ListPlus },
                       { label: 'Link Receivers (PTP)', key: 'receivers', template: { model: 'New Receiver', price: 0 }, icon: Wifi },
                       { label: 'WiFi ONU / Routers', key: 'onus', template: { model: 'New Router', price: 0 }, icon: Smartphone }
                    ].map(list => (
                       <div key={list.key} className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><list.icon size={14}/> {list.label}</h4>
                             <button onClick={() => addCatalogItem('wireless', list.key, list.template)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Plus size={16}/></button>
                          </div>
                          <div className="space-y-2">
                             {(techConfig.wireless as any)[list.key].map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                   <input className="flex-[2] p-3 bg-slate-50 border rounded-xl font-bold text-[11px] uppercase" value={item.height || item.model} onChange={e => {
                                      const next = {...techConfig};
                                      const obj = (next.wireless as any)[list.key][idx];
                                      if (obj.height !== undefined) obj.height = e.target.value; else obj.model = e.target.value;
                                      setTechConfig(next);
                                   }} />
                                   <input type="number" min="0" className="flex-1 p-3 bg-slate-50 border rounded-xl font-black text-[11px]" value={item.price} onChange={e => {
                                      const next = {...techConfig};
                                      (next.wireless as any)[list.key][idx].price = Math.max(0, Number(e.target.value));
                                      setTechConfig(next);
                                   }} />
                                   <button onClick={() => removeCatalogItem('wireless', list.key, idx)} className="p-3 text-rose-300 hover:text-rose-600"><Trash2 size={16}/></button>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <Flame size={24} className="text-blue-400" />
                       <div>
                          <h3 className="text-xl font-black uppercase tracking-tight italic">Fiber (FTTH) Catalog Registry</h3>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Optical Path Parameters</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 space-y-10">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14}/> Node Distribution Pricing</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase">Fiber (Per Meter)</label>
                             <input type="number" min="0" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={techConfig.fiber.wirePricePerMeter} onChange={e => setTechConfig({...techConfig, fiber: {...techConfig.fiber, wirePricePerMeter: Math.max(0, Number(e.target.value))}})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase">Base Installation</label>
                             <input type="number" min="0" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={techConfig.fiber.baseInstallation} onChange={e => setTechConfig({...techConfig, fiber: {...techConfig.fiber, baseInstallation: Math.max(0, Number(e.target.value))}})} />
                          </div>
                       </div>
                    </div>

                    {[
                       { label: 'Optical Device Registry', key: 'onus', template: { model: 'New GPON ONU', price: 0 }, icon: HardDrive },
                       { label: 'Gigabit Routers', key: 'routers', template: { model: 'New Router', price: 0 }, icon: Smartphone }
                    ].map(list => (
                       <div key={list.key} className="space-y-4">
                          <div className="flex justify-between items-center px-1">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><list.icon size={14}/> {list.label}</h4>
                             <button onClick={() => addCatalogItem('fiber', list.key, list.template)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={16}/></button>
                          </div>
                          <div className="space-y-2">
                             {(techConfig.fiber as any)[list.key].map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                   <input className="flex-[2] p-3 bg-slate-50 border rounded-xl font-bold text-[11px] uppercase" value={item.model} onChange={e => {
                                      const next = {...techConfig};
                                      (next.fiber as any)[list.key][idx].model = e.target.value;
                                      setTechConfig(next);
                                   }} />
                                   <input type="number" min="0" className="flex-1 p-3 bg-slate-50 border rounded-xl font-black text-[11px]" value={item.price} onChange={e => {
                                      const next = {...techConfig};
                                      (next.fiber as any)[list.key][idx].price = Math.max(0, Number(e.target.value));
                                      setTechConfig(next);
                                   }} />
                                   <button onClick={() => removeCatalogItem('fiber', list.key, idx)} className="p-3 text-rose-300 hover:text-rose-600"><Trash2 size={16}/></button>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="p-10 border-t bg-slate-50">
                    <button 
                      onClick={handleSaveCatalog}
                      disabled={isSaving}
                      className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       {isSaving ? <Mini5GMicroLoader size={18} /> : <Save size={18}/>}
                       Commit Hardware Registry
                    </button>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8 animate-in slide-in-from-right-4 duration-500">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Operational Audit</h3>
              <button onClick={() => runAudit()} className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:underline"><RefreshCw size={14}/> Refresh Pulse</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Circulating Capital', val: `Rs. ${auditMetrics.totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Fiber Length', val: `${auditMetrics.fiberMeters} M`, icon: Flame, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'CAT6 Length', val: `${auditMetrics.cat6Meters} M`, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Live Nodes', val: auditMetrics.activeNodes, icon: Server, color: 'text-indigo-600', bg: 'bg-indigo-50' }
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                   <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><stat.icon size={20}/></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <h4 className="text-2xl font-black text-slate-900 mt-1 italic tracking-tighter">{stat.val}</h4>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionSetupAdmin;

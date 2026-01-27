
import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { AppState, ISPUser, NetworkMapping, Device } from '../types';
import { 
  Map, Search, Filter, HardDrive, UserCircle, 
  ChevronRight, RefreshCw, X, Save, ShieldCheck,
  Hash, Smartphone, Globe, Signal, Zap, AlertTriangle,
  Layers, Database, ArrowRight, CheckCircle, SmartphoneIcon, Activity
} from 'lucide-react';

const UserDeviceMapping: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [mapping, setMapping] = useState<NetworkMapping>({
    userId: '',
    connectionType: 'Fiber',
    deviceId: '',
    configured: false
  });

  const activeUsers = state.users.filter(u => !u.deleted && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.connectionId.toLowerCase().includes(searchTerm.toLowerCase())));
  const selectedUser = useMemo(() => state.users.find(u => u.id === selectedUserId), [state.users, selectedUserId]);

  const handleSelectUser = (user: ISPUser) => {
    setSelectedUserId(user.id);
    const existing = db.getMappingForUser(user.id);
    if (existing) {
      setMapping(existing);
    } else {
      setMapping({
        userId: user.id,
        connectionType: user.connectionType,
        deviceId: state.devices.find(d => (user.connectionType === 'Fiber' ? d.type === 'VSOL_OLT' : d.type === 'MikroTik'))?.id || '',
        configured: false,
        ssidName: user.username ? user.username + "_WIFI" : "NETRECOVER_NODE"
      });
    }
  };

  const handleSave = async () => {
    if (!mapping.deviceId) {
      alert("Validation Error: Please select a target infrastructure node.");
      return;
    }
    setIsSaving(true);
    await db.saveMapping({ ...mapping, configured: true });
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification(mapping.userId, 'success', 'Node Mapping Synchronized', 'Hardware parameters successfully bound to identity.');
    }, 800);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-500 pb-20">
      {/* Sidebar: Registry Hub */}
      <div className="xl:col-span-1 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Map className="text-indigo-600" size={32} />
            Node Mapping
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Hardware Binding Protocol</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
                placeholder="Find identity by Name or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
           <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Registry</h3>
              <span className="text-[8px] font-black text-slate-400 bg-white border px-2 py-0.5 rounded uppercase">Verified</span>
           </div>
           <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
              {activeUsers.map(user => {
                const isMapped = db.getMappingForUser(user.id)?.configured;
                const isActive = selectedUserId === user.id;
                return (
                  <button 
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-6 text-left transition-all flex items-center justify-between group ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${isActive ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          <UserCircle size={24} />
                       </div>
                       <div>
                          <p className="font-black uppercase tracking-tight text-sm leading-none mb-1">{user.name}</p>
                          <div className="flex items-center gap-2">
                             <p className={`text-[10px] font-bold uppercase ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{user.connectionId}</p>
                             {isMapped && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>Mapped</span>}
                          </div>
                       </div>
                    </div>
                    <ChevronRight size={18} className={isActive ? 'text-white' : 'text-slate-200'} />
                  </button>
                );
              })}
           </div>
        </div>
      </div>

      {/* Main Panel: Configuration Engine */}
      <div className="xl:col-span-2">
         {!selectedUser ? (
           <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20">
              <Database className="text-slate-100 mb-8" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Select Target Identity</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2 leading-relaxed">
                 Choose a subscriber from the registry hub to bind their account to a physical MikroTik or OLT node.
              </p>
           </div>
         ) : (
           <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-6 flex-1">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                          {mapping.connectionType === 'Fiber' ? <Layers size={32} className="text-blue-400" /> : <Signal size={32} className="text-emerald-400" />}
                       </div>
                       <div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedUser.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                             <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.4em]">{mapping.connectionType} LINK LAYER</p>
                             <div className="px-2 py-0.5 bg-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-slate-400 border border-white/5">Ref: {selectedUser.connectionId}</div>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                       {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                       Commit Mapping
                    </button>
                 </div>
                 <Globe className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                          <HardDrive size={18} className="text-indigo-600"/>
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Infrastructure Node</h4>
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Physical Device</label>
                             <select 
                               className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-600 uppercase"
                               value={mapping.deviceId}
                               onChange={e => setMapping({...mapping, deviceId: e.target.value})}
                             >
                                <option value="">Select Reg Node...</option>
                                {state.devices.filter(d => (mapping.connectionType === 'Fiber' ? d.type === 'VSOL_OLT' : d.type === 'MikroTik')).map(d => (
                                  <option key={d.id} value={d.id}>{d.name} ({d.ip})</option>
                                ))}
                             </select>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                          <Zap size={18} className="text-emerald-600"/>
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Protocol Binding</h4>
                       </div>
                       <div className="space-y-4">
                          {mapping.connectionType === 'Wireless' ? (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PPPoE Credentials / User</label>
                                  <div className="relative">
                                     <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                     <input className="w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase" placeholder="PPPoE Username" value={mapping.pppoeUsername || ''} onChange={e => setMapping({...mapping, pppoeUsername: e.target.value})} />
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Static IP (Optional)</label>
                                  <div className="relative">
                                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                     <input className="w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase" placeholder="10.X.X.X" value={mapping.ipAddress || ''} onChange={e => setMapping({...mapping, ipAddress: e.target.value})} />
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ONU Machine Serial</label>
                                  <div className="relative">
                                     <SmartphoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                     <input className="w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase" placeholder="VSOL-..." value={mapping.onuSerial || ''} onChange={e => setMapping({...mapping, onuSerial: e.target.value})} />
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provisioned SSID</label>
                                  <div className="relative">
                                     <Signal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                                     <input className="w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl font-black text-xs uppercase" placeholder="User Wi-Fi Name" value={mapping.ssidName || ''} onChange={e => setMapping({...mapping, ssidName: e.target.value})} />
                                  </div>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                       <CheckCircle size={24} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Mapping Authorization</p>
                       <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed opacity-80">
                          Binding this identity to the <strong className="text-blue-900">{state.devices.find(d => d.id === mapping.deviceId)?.name || 'unselected'}</strong> node will enable real-time telemetry and self-service password protocols in the subscriber terminal.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-100 rounded-[2rem] flex items-center justify-between mx-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={24} className="text-slate-400" />
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Validated by Registry Node v8.5.2</p>
                 </div>
                 <Activity size={24} className="text-slate-300" />
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default UserDeviceMapping;

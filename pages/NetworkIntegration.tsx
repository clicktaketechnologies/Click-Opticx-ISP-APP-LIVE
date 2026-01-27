
import React, { useState } from 'react';
import { db } from '../db';
import { AppState, NetworkNode } from '../types';
import { 
  Link2, Server, Settings, Activity, ShieldCheck, 
  Plus, Search, RefreshCw, Layers, HardDrive, 
  Cpu, Globe, Terminal, ShieldAlert, X, Save,
  CheckCircle, XCircle, Loader2, Wifi, Zap,
  Key, Shield, Settings2, Power, AlertCircle, Clock
} from 'lucide-react';

const NetworkIntegration: React.FC<{ state: AppState }> = ({ state }) => {
  const [nodes, setNodes] = useState<NetworkNode[]>(state.networkNodes);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNodeData, setNewNodeData] = useState<Partial<NetworkNode>>({
    name: '',
    vendor: 'Huawei',
    ip: '',
    port: 22,
    protocol: 'SSH',
    username: 'admin',
    password: ''
  });
  const [allowReset, setAllowReset] = useState(state.settings.allowWifiReset);
  const [isSaving, setIsSaving] = useState(false);
  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleToggleReset = async () => {
    setAllowReset(!allowReset);
    await db.updateSettings({ ...state.settings, allowWifiReset: !allowReset });
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeData.name || !newNodeData.ip) return;

    setIsSaving(true);
    const res = await db.addNetworkNode(newNodeData);
    if (res.success) {
      setNodes(db.getState().networkNodes);
      setIsAddModalOpen(false);
      setNewNodeData({ name: '', vendor: 'Huawei', ip: '', port: 22, protocol: 'SSH', username: 'admin', password: '' });
    }
    setIsSaving(false);
  };

  const handleTestConnection = async (nodeId: string) => {
    setTestingNodeId(nodeId);
    const res = await db.testNodeConnection(nodeId);
    setTestResults(prev => ({ ...prev, [nodeId]: { success: res.success, message: res.message } }));
    setTestingNodeId(null);
    setNodes(db.getState().networkNodes);

    // Auto-clear result after 7s
    setTimeout(() => {
      setTestResults(prev => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    }, 7000);
  };

  const vendorOptions: NetworkNode['vendor'][] = [
    'Huawei', 'ZTE', 'MikroTik', 'Cisco', 'FiberHome', 
    'VSOL', 'BDCOM', 'Syrotech', 'Netlink', 'Digisol', 
    'Eurotech', 'Nokia', 'Calix', 'Adtran', 'Raisecom', 
    'Ubiquiti', 'Juniper', 'Zyxel', 'TP-Link', 'D-Link', 
    'Alcatel-Lucent', 'Generic_EPON', 'Generic_GPON'
  ];

  const getStatusBadge = (status: NetworkNode['status']) => {
    switch (status) {
      case 'Connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Connected</span>
          </div>
        );
      case 'Disconnected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-200 shadow-sm">
            <Power size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
          </div>
        );
      case 'Error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 shadow-sm animate-pulse">
            <AlertCircle size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Auth Error</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Link2 className="text-blue-600" size={32} />
            Infrastructure Nodes
          </h2>
          <p className="text-slate-500 font-medium mt-2">Manage connected OLTs, BRAS routers, and legacy hardware API handshakes.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> Add Physical Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Layers size={14} className="text-blue-600"/> Active OLT / Router Registry
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Activity size={12} className="text-emerald-500" />
                    Pulse Monitoring: Active
                  </div>
               </div>
               <div className="divide-y divide-slate-100">
                  {nodes.map(node => (
                    <div key={node.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                       <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 shadow-inner transition-all ${node.status === 'Connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : node.status === 'Error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                             <Server size={32}/>
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight truncate">{node.name}</h4>
                                {getStatusBadge(node.status)}
                             </div>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                               <Shield size={12} className="text-indigo-400"/> {node.vendor.replace('_', ' ')} Registry • {node.ip}:{node.port} ({node.protocol})
                             </p>
                             <div className="flex items-center gap-4 mt-3">
                               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                 <Clock size={12} className="text-blue-500" />
                                 Heartbeat: {new Date(node.lastHeartbeat).toLocaleString()}
                               </div>
                             </div>
                             {testResults[node.id] && (
                               <div className={`mt-3 p-3 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 animate-in slide-in-from-top-2 ${testResults[node.id].success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                 {testResults[node.id].success ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                 {testResults[node.id].message}
                               </div>
                             )}
                          </div>
                       </div>
                       <div className="flex items-center gap-3 shrink-0">
                          <button 
                            // Fixed: node.id converted to string to match handler signature
                            onClick={() => handleTestConnection(node.id.toString())}
                            // Fixed: node.id converted to string to match testingNodeId type
                            disabled={testingNodeId === node.id.toString()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${testingNodeId === node.id.toString() ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'}`}
                          >
                             {testingNodeId === node.id.toString() ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                             {testingNodeId === node.id.toString() ? 'Testing...' : 'Test Connection'}
                          </button>
                          <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm">
                             <Settings2 size={20}/>
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 text-indigo-400">
                     <Terminal size={24}/>
                     <h3 className="text-xl font-black uppercase tracking-tight italic">Global Command Console</h3>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] font-mono text-xs text-slate-400 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                     <p className="flex gap-4"><span className="text-emerald-500 shrink-0">12:00:01</span> [OLT-01] Polling subscriber nodes...</p>
                     <p className="flex gap-4"><span className="text-emerald-500 shrink-0">12:00:02</span> [OLT-01] Handshake verified for 422 identities.</p>
                     <p className="flex gap-4"><span className="text-blue-500 shrink-0">12:00:05</span> [OLT-02] Syncing hardware registry v8.5...</p>
                     <p className="flex gap-4"><span className="text-amber-500 shrink-0">12:00:10</span> [SYSTEM] Pushing authorized WIFI rotation signals...</p>
                     <p className="flex gap-4"><span className="text-indigo-400 shrink-0">12:04:22</span> [SNMP] Global health audit heartbeat recorded.</p>
                     <p className="flex gap-4"><span className="text-emerald-500 shrink-0">12:05:00</span> [API] Handshake successful with 22 vendor nodes.</p>
                  </div>
               </div>
               <Globe className="absolute -right-16 -bottom-16 opacity-5 scale-150 pointer-events-none" size={300} />
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={18} className="text-indigo-600" /> API Feature Control
               </h3>
               
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group transition-all hover:bg-white">
                  <div className="flex-1 pr-4">
                     <h4 className="text-xs font-black uppercase text-slate-900">Self-Service WIFI Reset</h4>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-relaxed">
                        Allow subscribers to initialize password rotation requests directly from their portal.
                     </p>
                  </div>
                  <button 
                    onClick={handleToggleReset}
                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${allowReset ? 'bg-emerald-600 shadow-emerald-200 shadow-lg' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${allowReset ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                  <ShieldAlert className="text-blue-600 mt-1 shrink-0" size={24} />
                  <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
                     Node integration requires validated credentials for all registered vendors.
                     Contact core engineering for secure endpoint registration and certificate distribution.
                  </p>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> Handshake Statistics
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Uptime Rank', value: '99.99%', icon: Activity, color: 'text-emerald-500' },
                    { label: 'Active Ports', value: '3,842', icon: Link2, color: 'text-blue-500' },
                    { label: 'CPU Load', value: '24%', icon: Cpu, color: 'text-amber-500' },
                    { label: 'RAM Sync', value: '4.2 GB', icon: HardDrive, color: 'text-indigo-500' }
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white transition-all">
                       <div className="flex items-center gap-3">
                          <stat.icon size={16} className={stat.color}/>
                          <span className="text-[10px] font-black uppercase text-slate-500">{stat.label}</span>
                       </div>
                       <span className="text-xs font-black text-slate-900">{stat.value}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Add Physical Node Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Provision Node</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hardware Deployment Handshake</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <form onSubmit={handleAddNode} className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Node Label (Friendly Name)</label>
                       <input 
                         className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none focus:border-blue-600 transition-all text-slate-900 shadow-inner"
                         placeholder="e.g. OLT-NORTH-05"
                         value={newNodeData.name}
                         onChange={e => setNewNodeData({...newNodeData, name: e.target.value})}
                         required
                         autoFocus
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Vendor Architecture</label>
                          <select 
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-600"
                            value={newNodeData.vendor}
                            onChange={e => setNewNodeData({...newNodeData, vendor: e.target.value as any})}
                          >
                             {vendorOptions.map(v => (
                               <option key={v} value={v}>{v.replace('_', ' ')} Node</option>
                             ))}
                          </select>
                       </div>
                       <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Public IP</label>
                             <input 
                               className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-blue-600"
                               placeholder="10.0.0.X"
                               value={newNodeData.ip}
                               onChange={e => setNewNodeData({...newNodeData, ip: e.target.value})}
                               required
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Port</label>
                             <input 
                               type="number"
                               className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-blue-600"
                               value={newNodeData.port}
                               onChange={e => setNewNodeData({...newNodeData, port: Number(e.target.value)})}
                               required
                             />
                          </div>
                       </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
                       <div className="flex items-center gap-3 text-indigo-400">
                          <Key size={18} />
                          <h4 className="text-xs font-black uppercase tracking-widest italic">Communication Auth</h4>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol</label>
                             <select 
                               className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white text-[10px] uppercase outline-none"
                               value={newNodeData.protocol}
                               onChange={e => setNewNodeData({...newNodeData, protocol: e.target.value as any})}
                             >
                                <option value="SSH" className="bg-slate-900">SSH Protocol</option>
                                <option value="SNMP" className="bg-slate-900">SNMP v2/v3</option>
                                <option value="API" className="bg-slate-900">REST API</option>
                                <option value="Telnet" className="bg-slate-900">Telnet (Legacy)</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Username / Community</label>
                             <input 
                               className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs outline-none"
                               value={newNodeData.username}
                               onChange={e => setNewNodeData({...newNodeData, username: e.target.value})}
                             />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Secret / Auth Key</label>
                             <input 
                               type="password"
                               className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs outline-none"
                               placeholder="Node password or community string"
                               value={newNodeData.password}
                               onChange={e => setNewNodeData({...newNodeData, password: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                    <ShieldAlert size={24} className="text-blue-600 shrink-0 mt-1" />
                    <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                       Provisioning a node requires verified physical presence in the POP registry. API link will attempt immediate handshake after deployment using the specified protocol.
                    </p>
                 </div>

                 <button 
                   type="submit"
                   disabled={isSaving}
                   className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Initialize Deployment
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default NetworkIntegration;

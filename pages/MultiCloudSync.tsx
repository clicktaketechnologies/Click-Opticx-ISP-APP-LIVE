import React, { useState, useEffect, useRef } from 'react';
import { AppState, CloudAccount, KYCFile, CloudTransferLog } from '../types';
import { db } from '../db';
import ModuleGuide from '../components/shared/ModuleGuide';
import { 
  Cloud, ShieldCheck, Folder, File, 
  Search, ArrowRightLeft, RefreshCcw, LogOut,
  ExternalLink, MoreVertical, Plus, Trash2,
  ChevronRight, Download, Upload, Activity,
  CheckCircle2, AlertCircle, Clock, Database,
  Settings2, Smartphone, Monitor, Edit3, Loader2, Play,
  Terminal, Shield, Zap, Lock, Globe, Server,
  PlusCircle, LayoutDashboard, DatabaseZap, HardDrive,
  Check, X, FileText, ChevronDown, ListFilter,
  ArrowUpRight, ArrowDownRight, Link2, Ghost, Power,
  Filter, Move, Eye, MoreHorizontal
} from 'lucide-react';

interface Props {
  state: AppState;
}

const MultiCloudSync: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'kyc_files' | 'telemetry' | 'add_new'>('infrastructure');
  const [isSearching, setIsSearching] = useState('');
  const [fileFilter, setFileFilter] = useState<'ALL' | 'TEMP' | 'MOVED'>('ALL');
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showPortal, setShowPortal] = useState<{provider: string, status: string, progress: number} | null>(null);
  const [telemetry, setTelemetry] = useState<string[]>(['[SYSTEM] Cloud Kernel Initialized', '[INFO] Scanning active node clusters...']);
  
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [telemetry]);

  const addTelemetry = (msg: string) => {
    setTelemetry(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleMoveFile = async (fileId: string, provider: string) => {
    setLoadingAction(prev => ({ ...prev, [fileId]: true }));
    addTelemetry(`Initiating migration of artifact ${fileId} to ${provider}...`);
    
    // Artificial delay
    await new Promise(r => setTimeout(r, 1500));
    const res = await db.moveKYCFileToCloud(fileId, provider);
    
    if (res.success) {
      addTelemetry(`[SUCCESS] Artifact ${fileId} secured in ${provider} vault.`);
    } else {
      addTelemetry(`[ERROR] Migration failed for artifact ${fileId}.`);
    }
    setLoadingAction(prev => ({ ...prev, [fileId]: false }));
  };

  const handleSmartMove = async (fileId: string) => {
    const file = state.kycFiles?.find(f => f.id === fileId);
    if (!file) return;

    let targetProvider = 'Google Drive'; // Default
    if (file.file_type.includes('image')) targetProvider = 'Cloudinary';
    else if (file.file_type.includes('pdf')) targetProvider = 'OneDrive';

    addTelemetry(`[SMART-ROUTING] Detected ${file.file_type}. Routing to optimized node: ${targetProvider}`);
    handleMoveFile(fileId, targetProvider);
  };

  const handleBulkMove = async (provider: string) => {
    if (selectedFiles.length === 0) return;
    addTelemetry(`[BATCH] Starting bulk migration of ${selectedFiles.length} artifacts to ${provider}...`);
    for (const id of selectedFiles) {
      await handleMoveFile(id, provider);
    }
    setSelectedFiles([]);
    addTelemetry(`[BATCH] Bulk migration completed.`);
  };

  const handleConnectAccount = async (provider: string, method: string) => {
    setShowPortal({ provider, status: `Initializing ${method} Protocol...`, progress: 10 });
    addTelemetry(`[AUTH] Protocol Shift: Opening Secure Gateway for ${provider} via ${method}...`);
    
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setShowPortal(prev => prev ? { 
        ...prev, 
        progress: Math.min(p, 100),
        status: p < 40 ? 'Verifying Credentials...' : (p < 70 ? 'Exchanging Secret Keys...' : 'Allocating Node Registry...')
      } : null);
      
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(async () => {
           const id = `cloud-${Date.now()}`;
           await db.addCloudAccount({
              id,
              provider: provider as any,
              email: 'admin@clickopticx.com',
              status: 'Connected',
              accessToken: 'SECURE_TOKEN_' + Math.random().toString(36).substring(7).toUpperCase(),
              refreshToken: 'REFRESH_' + Math.random().toString(36).substring(7).toUpperCase(),
              expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
              quota: { used: 0, total: 15 * (1024**3) },
              connectedAt: new Date().toISOString(),
              loginMethod: method as any
           });
           setShowPortal(null);
           addTelemetry(`[AUTH] Success: ${provider} node integrated into Multi-Cloud Mesh.`);
           setActiveTab('infrastructure');
        }, 500);
      }
    }, 40);
  };

  const guideItems = [
    { title: 'KYC Buffering', description: 'Files initially hit the TEMP registry. Move them to your permanent cloud nodes for long-term audit compliance.' },
    { title: 'Node Redundancy', description: 'Connect multiple providers to ensure identity artifacts are reachable even if one cloud node fails.' },
    { title: 'Smart Handshakes', description: 'Supports OAuth for Drive/OneDrive, API Keys for Cloudinary, and Magic Links for Supabase/Appwrite.' }
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'TEMP': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'MOVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'FAILED': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] p-8 space-y-10 animate-premium text-[#1A1F36] selection:bg-blue-100 selection:text-blue-900 border-t-4 border-blue-600">
      <ModuleGuide 
        moduleName="Multi-Cloud Infrastructure OS" 
        description="Enterprise-Grade Gateway for KYC Artifact Routing and Redundancy"
        items={guideItems}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-8">
           <div className="w-16 h-16 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center transition-transform hover:scale-105">
              <DatabaseZap size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-[#1A1F36] tracking-tight">Cloud Sync</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-3">
                 <ShieldCheck size={16} className="text-[#3ECF8E]" /> Unified Storage Gateway • v10.0.0
              </p>
           </div>
        </div>

        <nav className="flex bg-[#F6F9FC] p-1.5 rounded-2xl border border-slate-100 self-start lg:self-center">
           {[
             { id: 'infrastructure', label: 'Nodes', icon: Server },
             { id: 'kyc_files', label: 'KYC Files', icon: FileText },
             { id: 'add_new', label: 'Connect', icon: PlusCircle },
             { id: 'telemetry', label: 'Logs', icon: Terminal }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </nav>
      </div>

      {activeTab === 'infrastructure' && (
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1F36] tracking-tight flex items-center gap-4">
              <HardDrive className="text-blue-600" /> Active Storage Nodes
            </h2>
            <button onClick={() => setActiveTab('add_new')} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3">
              <Plus size={18} /> Provision New Node
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.cloudAccounts?.map((account) => (
              <div key={account.id} className="bg-white rounded-2xl p-10 border border-slate-200 group transition-all hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden">
                 {account.isPrimary && (
                   <div className="absolute top-0 right-0 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                     Default Node
                   </div>
                 )}
                 <div className="flex items-center justify-between mb-8">
                    <div className="p-4 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                       {account.provider === 'Google Drive' ? <Monitor size={32}/> : (account.provider === 'OneDrive' ? <Cloud size={32}/> : <Database size={32}/>)}
                    </div>
                    <div className={`flex items-center gap-3 px-4 py-2 ${account.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} rounded-full border border-current/10`}>
                       <div className={`w-2 h-2 rounded-full ${account.status === 'Connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">{account.status}</span>
                    </div>
                 </div>

                 <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#1A1F36] tracking-tight">{account.provider}</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase mt-1 tracking-widest">{account.email}</p>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Capacity</span>
                          <span>{(account.quota.used / (1024**3)).toFixed(1)}GB / {(account.quota.total / (1024**3)).toFixed(0)}GB</span>
                       </div>
                       <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(account.quota.used / account.quota.total) * 100}%` }}></div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button className="flex items-center justify-center gap-3 py-3 bg-white text-[#1A1F36] rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-600 transition-all">
                          <RefreshCcw size={14}/> Sync Now
                       </button>
                       <button onClick={() => db.updateCloudAccount(account.id, { isPrimary: true })} className="flex items-center justify-center gap-3 py-3 bg-[#F6F9FC] text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                          <CheckCircle2 size={14}/> Set Default
                       </button>
                    </div>
                    
                    <button onClick={() => db.disconnectCloudAccount(account.id)} className="w-full py-3 text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                       <Power size={14} /> Disconnect Node
                    </button>
                 </div>
              </div>
            ))}
            
            {(!state.cloudAccounts || state.cloudAccounts.length === 0) && (
              <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-8 bg-slate-50 rounded-full text-slate-300">
                  <Ghost size={64} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-600">No Active Cloud Nodes</h3>
                  <p className="text-sm font-bold text-slate-400 mt-2">Connect a storage provider to begin syncing KYC artifacts.</p>
                </div>
                <button onClick={() => setActiveTab('add_new')} className="px-10 py-4 bg-[#1A1F36] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kyc_files' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
           <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#FAFBFC]">
              <div>
                 <h2 className="text-2xl font-black text-[#1A1F36] tracking-tight">KYC Temp Storage</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-3">
                    <DatabaseZap size={16} className="text-blue-600" /> Buffering Registry
                 </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search User or KYC ID..." 
                      value={isSearching}
                      onChange={e => setIsSearching(e.target.value)}
                      className="pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-300 w-full md:w-80 shadow-sm"
                    />
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {['ALL', 'TEMP', 'MOVED'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFileFilter(f as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${fileFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {f}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-white border-b border-slate-100">
                       <th className="px-10 py-6">
                         <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedFiles.length > 0 && selectedFiles.length === state.kycFiles?.length}
                            onChange={(e) => {
                               if (e.target.checked) setSelectedFiles(state.kycFiles?.map(f => f.id) || []);
                               else setSelectedFiles([]);
                            }}
                         />
                       </th>
                       <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Subscriber / KYC ID</th>
                       <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Artifact</th>
                       <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(state.kycFiles || [])
                      .filter(f => (fileFilter === 'ALL' || f.status === fileFilter))
                      .filter(f => f.userName.toLowerCase().includes(isSearching.toLowerCase()) || f.kyc_id.toLowerCase().includes(isSearching.toLowerCase()))
                      .map((file) => (
                       <tr key={file.id} className="hover:bg-[#F6F9FC]/80 transition-all group">
                          <td className="px-10 py-8">
                             <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedFiles.includes(file.id)}
                                onChange={(e) => {
                                   if (e.target.checked) setSelectedFiles([...selectedFiles, file.id]);
                                   else setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                                }}
                             />
                          </td>
                          <td className="px-10 py-8">
                             <div>
                                <p className="text-base font-black text-[#1A1F36]">{file.userName}</p>
                                <p className="text-[10px] font-mono text-slate-400 uppercase mt-1 tracking-tighter">{file.kyc_id}</p>
                             </div>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                   <FileText size={20} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-[#1A1F36]">{file.file_name}</p>
                                   <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB • {file.file_type}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-8">
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(file.status)}`}>
                                {file.status === 'MOVED' ? `${file.status} (${file.provider})` : file.status}
                             </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                             {file.status === 'TEMP' ? (
                               <div className="flex items-center justify-end gap-3">
                                  <button 
                                    onClick={() => handleSmartMove(file.id)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                                  >
                                    <Zap size={14} /> Smart Move
                                  </button>
                                  <div className="relative inline-block text-left group/menu">
                                     <button className="flex items-center gap-3 px-6 py-3 bg-[#1A1F36] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                        {loadingAction[file.id] ? <Loader2 size={14} className="animate-spin" /> : 'Move To'} <ChevronDown size={14} />
                                     </button>
                                     <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all scale-95 group-hover/menu:scale-100 overflow-hidden">
                                        <div className="px-5 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 mb-2">Manual Routing</div>
                                        {state.cloudAccounts?.map(node => (
                                          <button 
                                            key={node.id}
                                            onClick={() => handleMoveFile(file.id, node.provider)}
                                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all text-xs font-bold"
                                          >
                                            <Upload size={14} /> {node.provider}
                                          </button>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                             ) : (
                               <div className="flex items-center justify-end gap-3">
                                  <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all"><Eye size={18} /></button>
                                  <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={18} /></button>
                               </div>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           {selectedFiles.length > 0 && (
             <div className="p-8 bg-[#1A1F36] text-white flex items-center justify-between sticky bottom-0 z-40">
                <div className="flex items-center gap-6">
                   <div className="px-5 py-2 bg-blue-600 rounded-lg text-sm font-black tracking-widest">{selectedFiles.length} SELECTED</div>
                   <p className="text-sm font-bold text-slate-400">Bulk action will trigger parallel node handshakes.</p>
                </div>
                <div className="flex items-center gap-6">
                   <div className="relative group/bulk">
                      <button className="px-8 py-4 bg-white text-[#1A1F36] rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        Bulk Move <ChevronDown size={14} />
                      </button>
                      <div className="absolute bottom-full right-0 mb-4 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 invisible group-hover/bulk:visible opacity-0 group-hover/bulk:opacity-100 transition-all scale-95 group-hover/bulk:scale-100">
                         {state.cloudAccounts?.map(node => (
                           <button 
                             key={node.id}
                             onClick={() => handleBulkMove(node.provider)}
                             className="w-full flex items-center gap-4 px-5 py-3 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all text-xs font-bold text-left"
                           >
                             <Move size={14} /> {node.provider}
                           </button>
                         ))}
                      </div>
                   </div>
                   <button onClick={() => setSelectedFiles([])} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancel</button>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'add_new' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-[2.5rem] p-16 border border-slate-200 shadow-xl space-y-12">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
                <Plus size={40} />
              </div>
              <h2 className="text-4xl font-black text-[#1A1F36] tracking-tight">Provision New Node</h2>
              <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">Select Provider and Logic</p>
            </div>

            <div className="space-y-10">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block ml-1">Infrastructure Provider</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Google Drive', 'OneDrive', 'pCloud', 'Firebase', 'Supabase', 'Cloudinary', 'Appwrite'].map(p => (
                      <button 
                        key={p}
                        className="p-6 rounded-2xl border-2 border-slate-100 bg-[#FAFBFC] hover:border-blue-600 hover:bg-white transition-all text-center group"
                      >
                        <div className="text-slate-400 group-hover:text-blue-600 mb-3 flex justify-center">
                          {p === 'Google Drive' ? <Monitor size={24}/> : (p === 'OneDrive' ? <Cloud size={24}/> : <Database size={24}/>)}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{p}</span>
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block ml-1">Authentication Method</label>
                  <div className="relative">
                    <select className="w-full px-8 py-5 bg-[#F6F9FC] border border-slate-200 rounded-2xl text-base font-bold text-[#1A1F36] outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-sm">
                       <option value="OAuth">OAuth 2.0 (Social Auth)</option>
                       <option value="API Key">Secure API Key</option>
                       <option value="Magic Link">Magic Verification Link</option>
                       <option value="Email/Password">Administrative Login</option>
                    </select>
                    <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={24}/>
                  </div>
               </div>

               <button 
                 onClick={() => handleConnectAccount('Google Drive', 'OAuth')}
                 className="w-full py-6 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-4"
               >
                 Initiate Node Handshake <ArrowRightLeft size={20} />
               </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#1A1F36] rounded-[2.5rem] p-12 text-white border border-[#232B4F] shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                  <Shield size={160} />
               </div>
               <div className="relative z-10 space-y-8">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <Lock size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight mb-4">Storage Security Hub</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                      All connected cloud nodes use end-to-end encryption. Artifacts are automatically hashed before transfer to ensure data integrity.
                    </p>
                  </div>
                  <ul className="space-y-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                    <li className="flex items-center gap-4"><CheckCircle2 className="text-[#3ECF8E]" size={18} /> AES-256 Vaulting</li>
                    <li className="flex items-center gap-4"><CheckCircle2 className="text-[#3ECF8E]" size={18} /> Zero-Knowledge Paths</li>
                    <li className="flex items-center gap-4"><CheckCircle2 className="text-[#3ECF8E]" size={18} /> Multi-Region Auth</li>
                  </ul>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-xl">
               <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#1A1F36] mb-8">System Health Status</h4>
               <div className="flex items-center justify-between p-6 bg-[#F6F9FC] rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                        <Activity size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-widest">API Gateway</p>
                        <p className="text-[10px] font-bold text-emerald-500">OPERATIONAL</p>
                     </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">LATENCY: 42ms</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="bg-[#1A1F36] rounded-2xl p-12 border border-[#232B4F] shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
           <div className="flex items-center justify-between mb-10 relative z-10 border-b border-[#232B4F] pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                    <Activity size={32} className="text-blue-400 animate-pulse" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">Infrastructure Logs</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Streaming Multi-Cloud Event Handlers</p>
                 </div>
              </div>
           </div>

           <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-4 font-mono text-sm custom-scrollbar pr-6 relative z-10">
              {telemetry.map((line, i) => (
                <div key={i} className="flex gap-6 group">
                   <span className="text-slate-700 select-none shrink-0 border-r border-slate-800 pr-4">{i.toString().padStart(3, '0')}</span>
                   <div className={`flex-1 transition-colors ${
                     line.includes('SUCCESS') ? 'text-[#3ECF8E]' : 
                     (line.includes('ERROR') ? 'text-rose-400' : 
                     (line.includes('AUTH') ? 'text-amber-400' : 'text-slate-400'))
                   }`}>
                      {line}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <style>{`
        .animate-premium {
          animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E6EBF1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D8DEE9;
        }
      `}</style>
      
      {showPortal && (
        <div className="fixed inset-0 bg-[#0A2540]/90 backdrop-blur-3xl z-[2000] flex items-center justify-center p-8">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-16 space-y-12 shadow-[0_30px_150px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${showPortal.progress}%` }}></div>
              </div>
              <div className="relative w-32 h-32 mx-auto">
                 <div className="absolute inset-0 border-8 border-slate-50 rounded-full"></div>
                 <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Shield size={48} className="text-blue-600" />
                 </div>
              </div>
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-[#1A1F36] tracking-tight">{showPortal.provider}</h2>
                 <p className="text-base font-bold text-slate-400 uppercase tracking-widest">{showPortal.status}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MultiCloudSync;

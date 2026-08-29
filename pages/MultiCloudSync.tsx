import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { AppState, CloudAccount, KYCFile } from '../types';
import { db } from '../db';
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
  Filter, Move, Eye, MoreHorizontal, Users, ShieldAlert,
  Archive, RotateCcw, Box, UserCheck, Sparkles, AlertTriangle
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

interface Props {
  state: AppState;
}

const MultiCloudSync: React.FC<Props> = ({ state }) => {
  const [kycFiles, setKycFiles] = useState<KYCFile[]>([]);
  const [cloudAccounts, setCloudAccounts] = useState<CloudAccount[]>([]);
  const [telemetry, setTelemetry] = useState<string[]>(['[SYSTEM] Cloud Kernel Initialized', '[INFO] Scanning active node clusters...']);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});
  const [isSearching, setIsSearching] = useState('');
  const [fileFilter, setFileFilter] = useState<'ALL' | 'TEMP' | 'MOVED'>('ALL');
  const [showPortal, setShowPortal] = useState<{ provider: string, status: string, progress: number } | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CloudAccount | null>(null);
  const [manageForm, setManageForm] = useState({
    provider: 'Google Drive',
    loginMethod: 'OAuth',
    email: '',
    api_key: '',
    secret: '',
    endpoint: ''
  });

  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const fetchKYC = async () => {
    try {
       // Check if there's a real API endpoint, otherwise fall back to db
      const res = await fetch('/api/kyc/list').catch(() => null);
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) setKycFiles(data.list);
      } else {
         // Fallback to local DB reference for demo
         const allFiles = Object.values(db.getState().kycFiles || {});
         setKycFiles(allFiles);
      }
    } catch (err) {
      addTelemetry(`[ERROR] Failed to fetch KYC registry: ${err}`);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/cloud/accounts').catch(() => null);
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) setCloudAccounts(data.accounts);
      } else {
         // Fallback to local DB reference
         setCloudAccounts(state.cloudAccounts || []);
      }
    } catch (err) {
      addTelemetry(`[ERROR] Failed to fetch cloud nodes: ${err}`);
    }
  };

  useEffect(() => {
    fetchKYC();
    fetchAccounts();

    const socket = io();
    socketRef.current = socket;

    socket.on('kyc_uploaded', (newFile: KYCFile) => {
      addTelemetry(`[EVENT] New KYC Buffer Received: ${newFile.userName}`);
      setKycFiles(prev => [...prev, newFile]);
    });

    socket.on('file_moved', (updatedFile: KYCFile) => {
      addTelemetry(`[EVENT] Migration Complete: ${updatedFile.file_name} -> ${updatedFile.provider}`);
      setKycFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
    });

    socket.on('account_updated', (updatedAccount: CloudAccount) => {
      addTelemetry(`[EVENT] Node Synchronized: ${updatedAccount.provider} status is now ${updatedAccount.status}`);
      setCloudAccounts(prev => {
        const exists = prev.find(a => a.id === updatedAccount.id);
        if (exists) return prev.map(a => a.id === updatedAccount.id ? updatedAccount : a);
        return [...prev, updatedAccount];
      });
    });

    socket.on('account_deleted', ({ id }: { id: string }) => {
      addTelemetry(`[EVENT] Node Decommissioned: ID ${id}`);
      setCloudAccounts(prev => prev.filter(a => a.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [telemetry, showTelemetry]);

  const addTelemetry = (msg: string) => {
    setTelemetry(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleMoveFile = async (fileId: string, accountId: string) => {
    setLoadingAction(prev => ({ ...prev, [fileId]: true }));
    const node = cloudAccounts.find(a => a.id === accountId);
    addTelemetry(`Initiating migration of artifact ${fileId} to ${node?.provider || 'Node'}...`);
    
    try {
      const res = await fetch('/api/cloud/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId: fileId, accountId })
      });
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) {
           addTelemetry(`[SUCCESS] Artifact secured in node vault.`);
         } else {
           addTelemetry(`[ERROR] Migration failed: ${data.message || 'Node Error'}`);
         }
      } else {
         addTelemetry(`[SIMULATION] Simulated migration successful to ${node?.provider}.`);
         setKycFiles(prev => prev.map(f => f.id === fileId ? {...f, status: 'MOVED', provider: node?.provider || 'External'} : f));
      }
    } catch (err) {
      addTelemetry(`[ERROR] Network fault during migration.`);
    }
    setTimeout(() => {
       setLoadingAction(prev => ({ ...prev, [fileId]: false }));
    }, 800);
  };

  const handleSmartMove = async (fileId: string) => {
    const file = kycFiles.find(f => f.id === fileId);
    if (!file) return;

    let targetProvider = 'Google Drive';
    if (file.file_type.includes('image')) targetProvider = 'Cloudinary';
    else if (file.file_type.includes('pdf')) targetProvider = 'OneDrive';

    addTelemetry(`[SMART-ROUTING] Detected ${file.file_type}. Routing to optimized node: ${targetProvider}`);
    
    const targetNode = cloudAccounts.find(a => a.provider === targetProvider && (a.status === 'Connected' || a.status === 'VERIFIED'));
    if (targetNode) {
      handleMoveFile(fileId, targetNode.id);
    } else {
      addTelemetry(`[WARNING] No healthy ${targetProvider} node found. Routing to Primary...`);
      const primary = cloudAccounts.find(a => a.isPrimary) || cloudAccounts[0];
      if (primary) handleMoveFile(fileId, primary.id);
      else addTelemetry(`[ERROR] No active nodes to route payload.`);
    }
  };

  const handleBulkMove = async (accountId: string) => {
    if (selectedFiles.length === 0) return;
    const node = cloudAccounts.find(a => a.id === accountId);
    addTelemetry(`[BATCH] Starting bulk migration of ${selectedFiles.length} artifacts to ${node?.provider}...`);
    for (const id of selectedFiles) {
      await handleMoveFile(id, accountId);
    }
    setSelectedFiles([]);
    addTelemetry(`[BATCH] Bulk migration completed.`);
  };

  const handleConnectAccount = async (provider: string, method: string) => {
    if (provider === 'Google Drive' && method === 'OAuth') {
      addTelemetry(`[AUTH] Initiating redirection to Google OAuth Gateway...`);
      try {
        const res = await fetch('/api/cloud/connect/google').catch(() => null);
        if (res && res.ok) {
           const data = await res.json();
           if (data.url) {
             window.open(data.url, '_blank', 'width=600,height=600');
           }
        } else {
           addTelemetry(`[WARNING] No backend route for Google OAuth. Simulating connect.`);
           setShowPortal({ provider, status: `Initializing ${method} Protocol...`, progress: 10 });
        }
      } catch (err) {
        addTelemetry(`[ERROR] Failed to start OAuth handshake.`);
      }
      if (document.querySelector('meta[name="vite-dev"]')) return;
    }

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
           addTelemetry(`[SIMULATION] Simulated success for ${provider}. Connect a real account for production usage.`);
           
            // Mock saving it locally
           setCloudAccounts(prev => [...prev, {
              id: Date.now().toString(),
              provider: provider as any,
              email: method === 'Email Password' ? manageForm.email : `admin@${provider.toLowerCase()}.com`,
              status: 'Connected',
              quota: { used: 0, total: 15 * 1024 * 1024 * 1024 },
              loginMethod: method as any,
              isPrimary: prev.length === 0,
              accessToken: '',
              refreshToken: '',
              expiry: '',
              connectedAt: new Date().toISOString()
           }]);

           setShowPortal(null);
           setIsManageModalOpen(false);
        }, 500);
      }
    }, 40);
  };

  const openManageModal = (node: CloudAccount | null = null) => {
    if (node) {
      setEditingNode(node);
      setManageForm({
        provider: node.provider,
        loginMethod: node.loginMethod || 'API Key',
        email: node.email || '',
        api_key: '',
        secret: '',
        endpoint: node.endpoint || ''
      });
    } else {
      setEditingNode(null);
      setManageForm({
        provider: 'Google Drive',
        loginMethod: 'OAuth',
        email: '',
        api_key: '',
        secret: '',
        endpoint: ''
      });
    }
    setIsManageModalOpen(true);
  };

  const handleSaveAccount = async () => {
    addTelemetry(`[DATA] Saving node configuration for ${manageForm.provider}...`);
    
    // Check if dealing with local mock or real API
    try {
      const url = editingNode ? `/api/cloud/account/${editingNode.id}` : '/api/cloud/account/save';
      const method = editingNode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manageForm)
      }).catch(() => null);
      
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) {
           addTelemetry(`[SUCCESS] Node configuration saved.`);
           setIsManageModalOpen(false);
           fetchAccounts();
         } else {
           addTelemetry(`[ERROR] Save failed: ${data.error}`);
         }
      } else {
         // Mock Action
         addTelemetry(`[SIMULATION] Mock node saved for ${manageForm.provider}.`);
         handleConnectAccount(manageForm.provider, manageForm.loginMethod);
      }
    } catch (err) {
      addTelemetry(`[ERROR] Network fault while saving node.`);
    }
  };

  const handleTestConnection = async (accountId: string) => {
    setLoadingAction(prev => ({ ...prev, [accountId]: true }));
    addTelemetry(`[DIAGNOSTIC] Initiating connection handshake for node ${accountId}...`);
    
    try {
      const res = await fetch('/api/cloud/account/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId })
      }).catch(() => null);
      
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) {
           if (data.status === 'VERIFIED') {
             addTelemetry(`[SUCCESS] Node ${accountId} identity verified.`);
           } else {
             addTelemetry(`[WARNING] Node ${accountId} verification failed: ${data.message}`);
           }
         } else {
           addTelemetry(`[ERROR] Diagnostics failed: ${data.error}`);
         }
      } else {
         // Mock
         setTimeout(() => {
            addTelemetry(`[SIMULATION] Node ping successful: 42ms latency.`);
            setLoadingAction(prev => ({ ...prev, [accountId]: false }));
         }, 1000);
         return;
      }
    } catch (err) {
      addTelemetry(`[ERROR] Diagnostic network fault.`);
    }
    setLoadingAction(prev => ({ ...prev, [accountId]: false }));
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to decommission this node?')) return;
    addTelemetry(`[SYSTEM] Decommissioning node ${id}...`);
    
    try {
      const res = await fetch(`/api/cloud/account/${id}`, { method: 'DELETE' }).catch(() => null);
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) {
           addTelemetry(`[SUCCESS] Node decommissioned.`);
           fetchAccounts();
         }
      } else {
         addTelemetry(`[SIMULATION] Node virtually removed.`);
         setCloudAccounts(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      addTelemetry(`[ERROR] Failed to decommission node.`);
    }
  };

  const handleSyncAccount = async (id: string) => {
    setLoadingAction(prev => ({ ...prev, [id]: true }));
    addTelemetry(`[SYNC] Requesting capacity audit for node ${id}...`);
    try {
      const res = await fetch('/api/cloud/account/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => null);
      
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) addTelemetry(`[SUCCESS] Audit complete. Node capacity synchronized.`);
      } else {
         setTimeout(() => {
            addTelemetry(`[SIMULATION] Local drive scan complete. Usage nominal.`);
            setLoadingAction(prev => ({ ...prev, [id]: false }));
         }, 1200);
         return;
      }
    } catch (err) {
      addTelemetry(`[ERROR] Audit failed.`);
    }
    setLoadingAction(prev => ({ ...prev, [id]: false }));
  };

  const handleSetDefaultAccount = async (id: string) => {
    addTelemetry(`[SYSTEM] Setting node ${id} as primary gateway...`);
    try {
      const res = await fetch('/api/cloud/account/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => null);
      
      if (res && res.ok) {
         const data = await res.json();
         if (data.success) {
           addTelemetry(`[SUCCESS] Primary node updated.`);
           fetchAccounts();
         }
      } else {
         addTelemetry(`[SIMULATION] Primary cluster re-aligned.`);
         setCloudAccounts(prev => prev.map(c => ({...c, isPrimary: c.id === id})));
      }
    } catch (err) {
      addTelemetry(`[ERROR] Primary delegation failed.`);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'TEMP': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'MOVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'FAILED': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 p-8 pt-0">
      
      {/* ─── HEADER COMMAND CENTER ─── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
         <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
               <DatabaseZap className="text-indigo-600" size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 leading-none">Cloud Infrastructure Sync</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic leading-none">
              Nexus Routing Core
            </h2>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest opacity-80 mt-2">Unified Multi-Cloud Sync Gateway</p>
         </div>
         <div className="flex gap-4">
            <button
               onClick={() => setShowTelemetry(!showTelemetry)}
               className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border shadow-sm ${showTelemetry ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600'}`}
            >
               <Terminal size={18} /> {showTelemetry ? 'Hide Telemetry' : 'View Logs'}
            </button>
            <button
               onClick={() => openManageModal()}
               className="group flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-100 border border-white/10"
            >
               <Server size={18} /> Add Cloud Node
            </button>
         </div>
      </div>

      {/* ─── MASTHEAD METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <Users className="absolute -right-6 -bottom-6 text-slate-100 opacity-50 scale-150 rotate-12 group-hover:scale-[1.8] group-hover:rotate-6 transition-all duration-700" size={140} />
            <div className="relative z-10 flex flex-col gap-6">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <UserCheck size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Identity Records</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{state.users?.length || 0}</h3>
               </div>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <Archive className="absolute -right-6 -bottom-6 text-slate-100 opacity-50 scale-150 -rotate-12 group-hover:scale-[1.8] group-hover:-rotate-6 transition-all duration-700" size={140} />
            <div className="relative z-10 flex flex-col gap-6">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Active Cloud Nodes</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{cloudAccounts.length}</h3>
               </div>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <HardDrive className="absolute -right-6 -bottom-6 text-slate-100 opacity-50 scale-150 rotate-12 group-hover:scale-[1.8] transition-all duration-700" size={140} />
            <div className="relative z-10 flex flex-col gap-6">
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Folder size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Buffered KYC Artifacts</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{kycFiles.length > 0 ? kycFiles.filter(k => k.status === 'TEMP').length : 0}</h3>
               </div>
            </div>
         </div>
      </div>

      {/* ─── TELEMETRY OVERLAY ─── */}
      {showTelemetry && (
         <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-top-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Activity size={100} className="text-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-4 mb-6 relative z-10 border-b border-slate-800 pb-6">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
               <h4 className="text-xs font-black uppercase text-slate-300 tracking-[0.3em]">Live Node Action Stream</h4>
            </div>
            <div ref={terminalRef} className="h-64 overflow-y-auto space-y-3 font-mono text-[11px] custom-scrollbar relative z-10 pr-4">
               {telemetry.map((line, i) => (
                 <div key={i} className={`flex gap-4 ${line.includes('ERROR') ? 'text-rose-400' : (line.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-400')}`}>
                    <span className="text-slate-600 shrink-0">{i.toString().padStart(4, '0')}</span>
                    <span>{line}</span>
                 </div>
               ))}
            </div>
         </div>
      )}

      {/* ─── ACTIVE STORAGE NODES ─── */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 ml-2">
            <Server className="text-indigo-600" size={24} />
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 italic">Redundant Storage Nodes</h3>
         </div>
         
         {(!cloudAccounts || cloudAccounts.length === 0) ? (
            <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
               <Ghost className="text-slate-300 mb-6" size={64}/>
               <h3 className="text-2xl font-black text-slate-700 italic">No Nodes Detected</h3>
               <p className="text-slate-500 font-bold max-w-md mt-2">Connect Google Drive, Supabase, or AWS storage arrays to securely stream user KYC artifacts across multiple clouds.</p>
               <button onClick={() => openManageModal()} className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-200 transition-all active:scale-95">Initiate Handshake</button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
               {cloudAccounts.map(account => (
                 <div key={account.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 flex flex-col">
                    {account.isPrimary && (
                      <div className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest text-center py-1.5 shadow-sm">
                         Primary Routing Hub
                      </div>
                    )}
                    <div className="p-8 space-y-6 flex-1">
                       <div className="flex justify-between items-start mb-2">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                             {account.provider === 'Google Drive' ? <Monitor size={24}/> : (account.provider === 'OneDrive' ? <Cloud size={24}/> : <Database size={24}/>)}
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${account.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${account.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                             {account.status}
                          </div>
                       </div>
                       
                       <div>
                          <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none">{account.provider}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate leading-none">{account.email}</p>
                       </div>

                       <div className="space-y-2 !mt-8">
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <span>Capacity</span>
                             <span>{account.quota ? (account.quota.used / (1024**3)).toFixed(1) : '0'}GB / {account.quota ? (account.quota.total / (1024**3)).toFixed(0) : '0'}GB</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: account.quota ? `${(account.quota.used / account.quota.total) * 100}%` : '0%' }}></div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3 !mt-6">
                          <button onClick={() => handleTestConnection(account.id)} disabled={loadingAction[account.id]} className="py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100">
                             {loadingAction[account.id] ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12}/>} Ping
                          </button>
                          <button onClick={() => handleSyncAccount(account.id)} disabled={loadingAction[account.id]} className="py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100">
                             {loadingAction[account.id] ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12}/>} Audit
                          </button>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-50 px-8 py-5 bg-slate-50/50 mt-auto">
                       <div className="flex gap-1">
                         <button onClick={() => handleDeleteAccount(account.id)} className="text-slate-400 hover:text-rose-500 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm transition-colors"><Trash2 size={14} /></button>
                         <button onClick={() => openManageModal(account)} className="text-slate-400 hover:text-indigo-600 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm transition-colors"><Edit3 size={14} /></button>
                       </div>
                       {!account.isPrimary && (
                         <button onClick={() => handleSetDefaultAccount(account.id)} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Set Primary</button>
                       )}
                    </div>
                 </div>
               ))}
               
               {/* Add Node Card Component inside Grid */}
               <button onClick={() => openManageModal()} className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-500 min-h-[300px] group w-full">
                  <div className="w-16 h-16 bg-white rounded-[1.25rem] flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mb-4">
                     <Plus size={32} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest italic">Expand Array</h4>
               </button>
            </div>
         )}
      </div>

      {/* ─── KYC BUFFER & MIGRATION POOL ─── */}
      <div className="space-y-6 mt-16">
         <div className="flex items-center gap-3 ml-2">
            <Archive className="text-indigo-600" size={24} />
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 italic">KYC Artifact Registry</h3>
         </div>

         <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
            <div className="p-8 lg:p-10 bg-slate-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 relative z-20">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                     <Folder size={28} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Local Registry Buffer</h3>
                     <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Pending Artifact Migration</p>
                     </div>
                  </div>
               </div>
               <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                  {['ALL', 'TEMP', 'MOVED'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFileFilter(f as any)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${fileFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-b border-slate-100">
               <div className="relative group max-w-md mx-auto">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search Registry IDs, Names..." 
                    value={isSearching}
                    onChange={e => setIsSearching(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar bg-white">
               <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                        <th className="px-8 py-6 text-center w-20">
                           <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                              checked={selectedFiles.length > 0 && kycFiles && selectedFiles.length === kycFiles.length}
                              onChange={(e) => {
                                 if (e.target.checked && kycFiles) setSelectedFiles(kycFiles.map(f => f.id));
                                 else setSelectedFiles([]);
                              }}
                           />
                        </th>
                        <th className="px-6 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">Identity</th>
                        <th className="px-6 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">Artifact Meta</th>
                        <th className="px-6 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">Current Status</th>
                        <th className="px-6 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 text-right">Action Matrix</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {(!kycFiles || kycFiles.filter(f => (fileFilter === 'ALL' || f.status === fileFilter))
                              .filter(f => f.userName?.toLowerCase().includes(isSearching.toLowerCase()) || f.kyc_id?.toLowerCase().includes(isSearching.toLowerCase()))
                              .length === 0) ? (
                        <tr>
                           <td colSpan={5} className="py-24 text-center text-slate-400">
                              <Box size={48} className="mx-auto mb-4 opacity-30" />
                              <p className="text-sm font-black uppercase tracking-widest">No Artifacts Reside Here</p>
                           </td>
                        </tr>
                     ) : (
                        kycFiles
                          .filter(f => (fileFilter === 'ALL' || f.status === fileFilter))
                          .filter(f => f.userName?.toLowerCase().includes(isSearching.toLowerCase()) || f.kyc_id?.toLowerCase().includes(isSearching.toLowerCase()))
                          .map(file => (
                           <tr key={file.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-8 py-6 text-center border-r border-slate-50/50">
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={(e) => {
                                       if (e.target.checked) setSelectedFiles([...selectedFiles, file.id]);
                                       else setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                                    }}
                                 />
                              </td>
                              <td className="px-6 py-6 border-r border-slate-50/50">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                       {file.userName ? file.userName.charAt(0) : '?'}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-none">{file.userName}</p>
                                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{file.kyc_id}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-6 border-r border-slate-50/50">
                                 <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    <div>
                                       <p className="text-[11px] font-black text-slate-700 truncate max-w-[200px]">{file.file_name}</p>
                                       <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">{(file.size / 1024).toFixed(0)} KB • {file.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-6 border-r border-slate-50/50">
                                 <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5 ${getStatusStyle(file.status)}`}>
                                    {file.status === 'MOVED' ? <CheckCircle2 size={10} /> : (file.status === 'TEMP' ? <Clock size={10} /> : <AlertCircle size={10} />)}
                                    {file.status === 'MOVED' ? `${file.status} (${file.provider || 'NODE'})` : file.status}
                                 </span>
                              </td>
                              <td className="px-6 py-6 text-right">
                                 {file.status === 'TEMP' ? (
                                    <div className="flex items-center justify-end gap-2 relative">
                                       <button 
                                         onClick={() => handleSmartMove(file.id)}
                                         disabled={loadingAction[file.id]}
                                         className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 border border-indigo-100"
                                       >
                                         {loadingAction[file.id] ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Smart Route
                                       </button>
                                       <div className="relative inline-block text-left group/dropdown">
                                          <button className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-700 shadow-md">
                                             Push <ChevronDown size={14} className="group-hover/dropdown:rotate-180 transition-transform" />
                                          </button>
                                          {/* Dropdown Menu */}
                                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[60] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all origin-top-right">
                                             {cloudAccounts?.map(node => (
                                               <button key={node.id} onClick={() => handleMoveFile(file.id, node.id)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest text-left">
                                                 <Upload size={14} /> {node.provider}
                                               </button>
                                             ))}
                                             {(!cloudAccounts || cloudAccounts.length === 0) && (
                                               <div className="px-4 py-3 text-[9px] text-slate-400 uppercase text-center font-bold">No Active Nodes</div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="flex items-center justify-end gap-2">
                                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all"><Eye size={16} /></button>
                                       <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>

            {/* Bulk Actions Panel */}
            {selectedFiles.length > 0 && (
              <div className="p-6 bg-slate-950 text-white border-t border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom border-t-white/10 relative z-30">
                 <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedFiles.length} Selected</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Mass routing bypasses temp buffer.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="relative group/bulkup">
                       <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                          Batch Push <ArrowUpRight size={14} />
                       </button>
                       <div className="absolute right-0 bottom-full mb-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 invisible opacity-0 translate-y-2 group-hover/bulkup:visible group-hover/bulkup:opacity-100 group-hover/bulkup:translate-y-0 transition-all origin-bottom-right">
                          <div className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Target Infrastructure</div>
                          {cloudAccounts?.map(node => (
                            <button key={node.id} onClick={() => handleBulkMove(node.id)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest text-left">
                              <HardDrive size={14} /> {node.provider}
                            </button>
                          ))}
                       </div>
                    </div>
                    <button onClick={() => setSelectedFiles([])} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 px-4 py-3 transition-colors">Deselect</button>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* ─── ADD/EDIT NODE MODAL ─── */}
      <Modal
         isOpen={isManageModalOpen}
         onClose={() => setIsManageModalOpen(false)}
         title={editingNode ? 'Configure Infrastructure' : 'Bind New Cloud Node'}
         icon={<Server size={24} className="text-indigo-400" />}
         maxWidth="max-w-xl"
         onConfirm={handleSaveAccount}
         confirmLabel="Compile & Bind Node"
      >
         <div className="space-y-6 py-4">
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center mb-6">
               <Globe className="text-indigo-500 mx-auto mb-3" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Infrastructure Handshake Protocol</p>
               <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Select logic layer for remote storage bridging.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Service Provider</label>
                  <select 
                    value={manageForm.provider}
                    onChange={e => setManageForm({ ...manageForm, provider: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all appearance-none"
                  >
                     <option>Google Drive</option>
                     <option>Cloudinary</option>
                     <option>Supabase</option>
                     <option>AWS S3</option>
                     <option>OneDrive</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Auth Protocol</label>
                  <select 
                    value={manageForm.loginMethod}
                    onChange={e => setManageForm({ ...manageForm, loginMethod: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all appearance-none"
                  >
                     <option>OAuth</option>
                     <option>API Key</option>
                     <option>Email Password</option>
                  </select>
               </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
               {manageForm.loginMethod === 'OAuth' && (
                 <div className="p-8 bg-indigo-50 rounded-2xl border border-indigo-100 text-center space-y-4">
                    <ShieldCheck className="text-indigo-600 mx-auto" size={32} />
                    <p className="text-xs font-bold text-slate-600">Secure OAuth 2.0 redirection is required to generate access tokens without exposing secrets to ClickOptix logs.</p>
                    <button type="button" onClick={() => handleConnectAccount(manageForm.provider, 'OAuth')} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 border border-indigo-500/50">Open Redirect Gateway</button>
                 </div>
               )}

               {manageForm.loginMethod === 'API Key' && (
                 <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Public ID / Key</label>
                       <input 
                          type="password"
                          value={manageForm.api_key}
                          onChange={e => setManageForm({ ...manageForm, api_key: e.target.value })}
                          placeholder="pk_live_..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-mono"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Private Secret</label>
                       <input 
                          type="password"
                          value={manageForm.secret}
                          onChange={e => setManageForm({ ...manageForm, secret: e.target.value })}
                          placeholder="sk_live_..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-mono shadow-sm"
                       />
                    </div>
                    {manageForm.provider === 'Supabase' && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Project Rest URL</label>
                         <input 
                            type="text"
                            value={manageForm.endpoint}
                            onChange={e => setManageForm({ ...manageForm, endpoint: e.target.value })}
                            placeholder="https://xyz.supabase.co"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
                         />
                      </div>
                    )}
                 </div>
               )}

               {manageForm.loginMethod === 'Email Password' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Service Email</label>
                       <input 
                          type="email"
                          value={manageForm.email}
                          onChange={e => setManageForm({ ...manageForm, email: e.target.value })}
                          placeholder="admin@vault.com"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Vault Password</label>
                       <input 
                          type="password"
                          value={manageForm.secret}
                          onChange={e => setManageForm({ ...manageForm, secret: e.target.value })}
                          placeholder="••••••••••"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all tracking-widest shadow-sm"
                       />
                    </div>
                  </div>
               )}
            </div>
         </div>
      </Modal>

      {/* Simulated Portal Loader */}
      {showPortal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[9999] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-16 space-y-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                 <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${showPortal.progress}%` }}></div>
              </div>
              <div className="relative w-32 h-32 mx-auto">
                 <div className="absolute inset-0 border-[6px] border-slate-50 rounded-full"></div>
                 <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent border-r-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={40} className="text-indigo-600 animate-pulse" />
                 </div>
              </div>
              <div className="space-y-3">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{showPortal.provider}</h2>
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{showPortal.status}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MultiCloudSync;

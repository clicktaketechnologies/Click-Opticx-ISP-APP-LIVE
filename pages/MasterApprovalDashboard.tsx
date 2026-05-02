import React, { useState, useMemo } from 'react';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import { AppState, Role, UserStatus, VerificationStatus } from '../types';
import { db } from '../db';
import {
  CheckCircle, XCircle, Clock, Zap, User,
  ShieldCheck, ChevronRight, Activity,
  HardDrive, AlertTriangle, Layers, Banknote, Globe, Landmark,
  ShieldAlert, RotateCw, Search, Filter, Hash, Eye, Info,
  Wallet, Smartphone, AlertCircle, FileText, UserCircle, X, Database, MapPin, Fingerprint, Package as PackageIcon
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';
import { KYCReviewDesk } from '../components/admin/desks/KYCReviewDesk';
import { BillingRequestDesk } from '../components/admin/desks/BillingRequestDesk';
import { ProvisioningDesk } from '../components/admin/desks/ProvisioningDesk';
import { usePermissions } from '../src/hooks/usePermissions';

// Safe Icon Wrapper
const SafeIcon: React.FC<{ icon: any; size?: number; className?: string; strokeWidth?: number }> = ({ icon: Icon, size = 18, className = '', strokeWidth }) => {
  if (!Icon) return <div style={{ width: size, height: size }} className={`bg-slate-200/50 rounded-full ${className}`} />;
  const isValidType = typeof Icon === 'function' || typeof Icon === 'string' || (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon);
  if (!isValidType) return <div style={{ width: size, height: size }} className={`bg-slate-200/50 rounded-full ${className}`} />;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
};

interface Props {
  state: AppState;
  defaultTab?: string;
}

export const MasterApprovalDashboard: React.FC<Props> = ({ state, defaultTab = 'kyc' }) => {
  const { canView, role } = usePermissions(state);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isProcessing, setIsProcessing] = useState(false);

  // Map internal tabs to permission page IDs
  const tabs = [
    { id: 'kyc', label: 'KYC Hub', icon: ShieldCheck, perm: 'kyc-hub' },
    { id: 'billing', label: 'Billing Desk', icon: Banknote, perm: 'accounting' },
    { id: 'provisioning', label: 'Provisioning', icon: Zap, perm: 'connection-setup' },
    { id: 'signup', label: 'Signups', icon: Fingerprint, perm: 'users' },
    { id: 'login', label: 'Logins', icon: ShieldAlert, perm: 'auth-control' },
    { id: 'audit', label: 'Audit Vault', icon: Activity, perm: 'archive' },
    { id: 'settings', label: 'System Config', icon: Hash, perm: 'system-config' }
  ].filter(t => canView(t.perm));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic leading-none uppercase">
            <SafeIcon icon={ShieldCheck} className="text-blue-600" size={28} />
            Approval Center
          </h2>
          <p className="text-slate-400 font-bold text-[clamp(0.5rem,1.5vw,0.6rem)] tracking-[0.3em] uppercase italic border-l-4 border-blue-500 pl-4">Modular Desk Hub & Operational Registry</p>
        </div>
        <div className="flex bg-slate-100/50 p-1.5 rounded-[2.5rem] border border-slate-200 overflow-x-auto no-scrollbar scroll-smooth shadow-inner w-full md:w-auto shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[800px] animate-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'kyc' && <KYCReviewDesk state={state} />}
        {activeTab === 'billing' && <BillingRequestDesk state={state} />}
        {activeTab === 'provisioning' && <ProvisioningDesk state={state} />}
        
        {activeTab === 'signup' && (
           <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
              <UserCircle size={120} className="text-blue-50/20 mx-auto mb-6 absolute -top-10 -right-10" />
              <div className="relative z-10">
                 <SafeIcon icon={Fingerprint} size={64} className="text-blue-100 mx-auto mb-6" />
                 <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">Registration Queue</h3>
                 <div className="w-20 h-1 bg-blue-500 mx-auto mb-6 rounded-full" />
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">New account requests are being routed to the Provisioning Desk. Use the Provisioning Desk for all activations.</p>
              </div>
           </div>
        )}
        
        {activeTab === 'login' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 shadow-inner">
                         <SafeIcon icon={ShieldAlert} size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Authentication Monitor</h3>
                         <p className="text-blue-600/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Real-time terminal access auditing</p>
                      </div>
                   </div>
                </div>
                <SafeIcon icon={Activity} className="absolute -right-20 -bottom-20 text-blue-500/5 scale-150 pointer-events-none" size={300} />
             </div>
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-20 text-center flex flex-col items-center gap-6">
                   <Database className="text-slate-100" size={64} />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Encrypted Handshake Logs streaming to vault...</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'audit' && (
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 text-center space-y-6 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
              <Activity size={300} className="absolute -bottom-20 -right-20 text-slate-50/50 pointer-events-none" />
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-100 border-2 border-dashed border-slate-200">
                 <SafeIcon icon={Activity} size={48} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">System Audit Vault</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-sm">Historical handshake records and administrative decision logs are permanently archived here.</p>
              </div>
           </div>
        )}
        
        {activeTab === 'settings' && (
           <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                 <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 leading-none"><SafeIcon icon={Hash} size={24} /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">System & AI Configuration</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global kill-switches and automation toggles</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-500/5">
                    <div className="space-y-2">
                       <p className="text-sm font-black text-slate-800 uppercase italic">AI Verification Agent</p>
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${state.settings.aiAgentEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {state.settings.aiAgentEnabled ? 'Operational Scan Active' : 'Automated Sanity Scan Disabled'}
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => db.updateSettings({ ...state.settings, aiAgentEnabled: !state.settings.aiAgentEnabled })}
                      className={`w-20 h-10 rounded-full transition-all relative shadow-inner ${state.settings.aiAgentEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all shadow-md ${state.settings.aiAgentEnabled ? 'left-11' : 'left-2'}`} />
                    </button>
                 </div>

                 <div className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/5">
                    <div className="space-y-2">
                       <p className="text-sm font-black text-slate-800 uppercase italic">Cloud Sync & Local Purge</p>
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${state.settings.autoCloudSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                             {state.settings.autoCloudSync ? 'Drive Handshake Active' : 'Manual Storage Mode'}
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => db.updateSettings({ ...state.settings, autoCloudSync: !state.settings.autoCloudSync })}
                      className={`w-20 h-10 rounded-full transition-all relative shadow-inner ${state.settings.autoCloudSync ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all shadow-md ${state.settings.autoCloudSync ? 'left-11' : 'left-2'}`} />
                    </button>
                 </div>

                 <div className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-amber-200 transition-all hover:bg-white hover:shadow-2xl hover:shadow-amber-500/5 col-span-1 md:col-span-2">
                    <div className="space-y-2">
                       <p className="text-sm font-black text-slate-800 uppercase italic">Required KYC Artifacts</p>
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                             {state.settings.requiredKycDocs || 10} Mandatory Files
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
                       <button 
                          onClick={() => db.updateSettings({ ...state.settings, requiredKycDocs: Math.max(1, (state.settings.requiredKycDocs || 10) - 1) })}
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all font-black"
                       >-</button>
                       <span className="text-lg font-black text-slate-800 w-8 text-center">{state.settings.requiredKycDocs || 10}</span>
                       <button 
                          onClick={() => db.updateSettings({ ...state.settings, requiredKycDocs: (state.settings.requiredKycDocs || 10) + 1 })}
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all font-black"
                       >+</button>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-blue-50/10 rounded-[2.5rem] border border-blue-100 border-dashed flex items-center justify-between">
                 <div className="flex items-center gap-4 text-blue-600/60">
                    <Info size={20} />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Verification status of all subscribers is synchronized with global registry settings. AI Agent observes all incoming artifacts for fraud markers.</p>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

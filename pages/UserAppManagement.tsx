import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Role, ISPUser, UserStatus, SecurityLog, UserSession, AppPage, HomeCard, VerificationStatus, AppSection } from '../types';
import { db } from '../db';
import {
   Smartphone, UserCheck, ShieldAlert, Key,
   ExternalLink, Ban, CheckCircle, X,
   Clock, Filter, Search, UserPlus, Fingerprint, Activity, Zap, RotateCw,
   ShieldCheck, ArrowRight, UserCircle, History, Shield, AtSign, ArrowUpRight, Contact,
   User, SmartphoneIcon, Globe, MapPin, MoreVertical, AlertTriangle, AlertCircle, Lock, Info, Pencil, MessageSquare, ChevronRight, LogOut, Power, CheckSquare, Square, Layers as LayersIcon, SearchCode,
   ShieldEllipsis, LayoutGrid, GripVertical, Eye, EyeOff, Settings, ChevronUp, ChevronDown, FileText, Image as ImageIcon,
   Compass, Book, Trophy, Megaphone, Gauge, Monitor, Wallet, HeartPulse, Sparkles, Home, Wifi, Bell, Headphones, Target, XCircle, Mic, Palette, Sliders, Sun
} from 'lucide-react';

const UserAppManagement: React.FC<{ state: AppState }> = ({ state }) => {
   const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'layout' | 'grid' | 'audit'>('users');
   const [searchTerm, setSearchTerm] = useState('');
   const [isProcessing, setIsProcessing] = useState<string | null>(null);
   const [editingSection, setEditingSection] = useState<AppSection | null>(null);

   const appearance = state.settings.appearance;
   const appPages = appearance.appPages || [];

   // Real-time derivation from state props
   const sections = useMemo(() => {
      return [...(state.settings.appearance.sections || [])].sort((a, b) => a.order - b.order);
   }, [state.settings.appearance.sections]);

   const filteredUsers = useMemo(() => {
      const term = (searchTerm || '').toLowerCase();
      return (state.users || []).filter(u => {
         if (!u || u.deleted) return false;
         const name = (u.name || '').toLowerCase();
         const connectionId = (u.connectionId || '').toLowerCase();
         return name.includes(term) || connectionId.includes(term);
      });
   }, [state.users, searchTerm]);

   const signupRequests = useMemo(() => {
      return (state.signupRequests || []).filter(r => r.status === 'Pending');
   }, [state.signupRequests]);

   const handleTogglePortal = async (userId: string, current: boolean) => {
      setIsProcessing(userId);
      await db.updateUser(userId, { portalEnabled: !current });
      setIsProcessing(null);
   };

   const handleApproveSignup = async (id: string) => {
      setIsProcessing(id);
      await db.approveSignup(id);
      setIsProcessing(null);
      db.logNotification('all', 'success', 'Account Activated', 'Subscriber signup request authorized.');
   };

   const handleToggleGlobalFeature = async (key: string, current: boolean) => {
      const nextSettings = {
         ...state.settings,
         appearance: {
            ...state.settings.appearance,
            [key]: !current
         }
      };
      if (key === 'showAICalling') {
         const idx = nextSettings.appearance.appPages.findIndex(p => p.id === 'ai-voice-call');
         if (idx !== -1) nextSettings.appearance.appPages[idx].enabled = !current;
      }
      await db.updateSettings(nextSettings);
   };

   const handleUpdateSection = async (section: AppSection) => {
      // Immediate local update for "Real-Time" feel
      if (editingSection && editingSection.id === section.id) {
         setEditingSection(section);
      }
      // FIX: was called with the whole section object but the method expects
      // (sectionId, data) — the mismatch corrupted state.appSections.
      await (db as any).updateAppSection(section.id, section);
   };

   const handleImpersonate = async (userId: string) => {
      setIsProcessing(userId);
      try {
         const adminToken = localStorage.getItem('token');
         const res = await fetch(`${db.backendUrl}/api/admin/impersonate/${userId}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
               'Content-Type': 'application/json',
               ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
            }
         });
         const data = await res.json();
         if (data.success) {
            localStorage.setItem('admin_token', adminToken || '');
            localStorage.setItem('token', data.token);
            window.location.href = '/'; // Routes to subscriber view automatically due to token
         } else {
            alert('Impersonation failed: ' + data.message);
         }
      } catch (err: any) {
         alert('Network error: ' + err.message);
      }
      setIsProcessing(null);
   };

   // Add Sun to the icon mapping to resolve shorthand property scope error
   const getIcon = (iconName: string) => {
      const map: any = { Home, Monitor, Wallet, Wifi, Bell, Headphones, FileText, Target, Smartphone, Gauge, Zap, Key, Fingerprint, Clock, Book, Compass, Globe, MessageSquare, Trophy, Megaphone, User, Mic, Sun };
      const IconComp = map[iconName] || Smartphone;
      return <IconComp size={20} />;
   };

   const industrialSwatches = [
      '#1570ef', '#32d583', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#2dd4bf',
      '#6366f1', '#0f172a', '#334155', '#64748b'
   ];

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none uppercase">
                  <Smartphone className="text-blue-600" size={32} />
                  App Architecture
               </h2>
               <p className="text-slate-500 font-medium">Control subscriber profiles and UI interactions.</p>
            </div>
            <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
               {[
                  { id: 'users', label: 'Identities', icon: UserCheck },
                  { id: 'approvals', label: 'Onboarding', icon: UserPlus, count: signupRequests.length },
                  { id: 'layout', label: 'Control Plane', icon: LayoutGrid },
                  { id: 'grid', label: 'Layout Grid', icon: Sliders },
                  { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                     <tab.icon size={16} />
                     {tab.label}
                     {tab.count !== undefined && tab.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white animate-pulse">{tab.count}</span>
                     )}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'users' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="relative">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-slate-900"
                        placeholder="Lookup subscriber connection..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Profile</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection Ref</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Access</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Command</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {filteredUsers.map(user => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border shadow-inner">
                                          <User size={20} />
                                       </div>
                                       <div>
                                          <p className="font-black text-slate-900 uppercase text-sm leading-none mb-1">{user.name}</p>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase">{user.phone}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{user.connectionId}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <button
                                       onClick={() => handleTogglePortal(user.id, !!user.portalEnabled)}
                                       disabled={isProcessing === user.id}
                                       className={`w-12 h-6 rounded-full relative transition-all ${user.portalEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                                    >
                                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${user.portalEnabled ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button
                                       onClick={() => handleImpersonate(user.id)}
                                       disabled={isProcessing === user.id}
                                       className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 ml-auto"
                                    >
                                       {isProcessing === user.id ? <Mini5GMicroLoader size={14} /> : <Eye size={14} />} Login As User
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'approvals' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {signupRequests.map(req => (
                     <div key={req.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border shadow-inner"><UserPlus size={28} /></div>
                           <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">New Sign-up Request</span>
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight mb-1">{req.name}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Proposed ID: {req.username || 'P-NODE'}</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                           <div className="flex items-center gap-2 text-slate-500"><Smartphone size={14} /><span className="text-[10px] font-black uppercase">{req.phone}</span></div>
                           <div className="flex items-center gap-2 text-slate-500"><Globe size={14} /><span className="text-[10px] font-black uppercase truncate">{req.email}</span></div>
                        </div>
                        <div className="flex gap-2">
                           <button className="flex-1 py-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Reject</button>
                           <button
                              onClick={() => handleApproveSignup(req.id)}
                              disabled={isProcessing === req.id}
                              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                              {isProcessing === req.id ? <Mini5GMicroLoader size={12} /> : <CheckCircle size={12} />} Approve
                           </button>
                        </div>
                     </div>
                  ))}
                  {signupRequests.length === 0 && (
                     <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
                        <ShieldCheck className="text-slate-100 mb-6" size={80} />
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Onboarding Synchronized</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No pending signups found.</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'grid' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-8">
                     <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter border-b pb-4">Section Orchestrator</h3>
                     <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {sections.map(section => (
                           <div key={section.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group ${section.enabled ? 'border-blue-100 bg-white' : 'border-slate-50 bg-slate-50 opacity-60 grayscale'}`}>
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${section.enabled ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-300'}`}>
                                    <LayersIcon size={24} />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-slate-900 uppercase text-sm leading-none mb-1">{section.label}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Layout: {section.layout} • {section.gridCols} Columns</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <button
                                    onClick={() => setEditingSection(section)}
                                    className={`p-3 rounded-xl transition-all ${editingSection?.id === section.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
                                 >
                                    <Settings size={20} />
                                 </button>
                                 <button
                                    onClick={() => handleUpdateSection({ ...section, enabled: !section.enabled })}
                                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${section.enabled ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-300'}`}
                                 >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${section.enabled ? 'left-7' : 'left-1'}`}></div>
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {editingSection ? (
                     <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Area Inspector</h3>
                              <p className="text-[9px] text-blue-400 font-black uppercase mt-2 tracking-widest">{editingSection.label}</p>
                           </div>
                           <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all"><X size={24} /></button>
                        </div>

                        <div className="space-y-8">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Column Layout</label>
                              <div className="grid grid-cols-4 gap-2">
                                 {[1, 2, 3, 4].map(cols => (
                                    <button
                                       key={cols}
                                       onClick={() => handleUpdateSection({ ...editingSection, gridCols: cols as any })}
                                       className={`py-4 rounded-2xl border-2 font-black text-sm transition-all ${editingSection.gridCols === cols ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                       {cols} Col
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logic Group Layout</label>
                              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                 {['Grid', 'List', 'Scroll'].map(type => (
                                    <button
                                       key={type}
                                       onClick={() => handleUpdateSection({ ...editingSection, layout: type as any })}
                                       className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editingSection.layout === type ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                                    >
                                       {type}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                              <div className="flex justify-between items-center">
                                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> Service Feature Mapping</h4>
                                 <span className="text-[9px] font-black text-slate-500">{editingSection.itemIds.length} Linked Nodes</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                 {appPages.filter(p => editingSection.itemIds.includes(p.id)).map(p => (
                                    <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.swatch ? `${p.swatch}22` : '#fff1', color: p.swatch || '#fff' }}>
                                             {getIcon(p.icon)}
                                          </div>
                                          <span className="text-[10px] font-black uppercase text-slate-300">{p.label}</span>
                                       </div>
                                       <CheckCircle size={12} className="text-green-500" />
                                    </div>
                                 ))}
                                 {editingSection.itemIds.length === 0 && (
                                    <p className="text-[9px] font-black text-slate-600 uppercase text-center py-4 italic">No features linked to this logical group</p>
                                 )}
                              </div>
                           </div>
                        </div>

                        <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
                     </div>
                  ) : (
                     <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                           <LayoutGrid className="text-slate-200" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Select Logic Group</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] max-w-xs mt-2 leading-relaxed">
                           Scale columns and optimize the visual density of each logic group for the Subscriber terminal.
                        </p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'layout' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
               {/* GLOBAL FEATURES */}
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">Global Scope Matrix</h3>
                     <p className="text-[9px] text-slate-500 font-black uppercase mt-2 tracking-widest">Master Switches for App Modules</p>
                  </div>

                  <div className="relative z-10 space-y-4">
                     {[
                        { label: 'AI Voice Support (Relay)', key: 'showAICalling', icon: Mic, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'Real-time bidirectional calling.' },
                        { label: 'AI Chat (Text Agent)', key: 'showAIChat', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'LLM-powered text support.' },
                        { label: 'Fiscal Wallet Center', key: 'showWallet', icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10', desc: 'User-managed balance station.' },
                        { label: 'Emergency Rescue (EL)', key: 'showEmergencyLoad', icon: Zap, keyOverride: 'showEmergencyLoad', color: 'text-amber-400', bg: 'bg-amber-400/10', desc: 'Rs. 2500 credit advance.' },
                        { label: '5G Launch Engine', key: 'show5GLaunchAnimation', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', desc: 'Startup screen high-tech visualization.' }
                     ].map(item => (
                        <div key={item.key} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                           <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center border border-white/5 shadow-xl`}>
                                 <item.icon size={28} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black uppercase tracking-tight">{item.label}</h4>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.desc}</p>
                              </div>
                           </div>
                           <button
                              onClick={() => handleToggleGlobalFeature(item.key, (appearance as any)[item.key])}
                              className={`w-14 h-8 rounded-full relative transition-all duration-300 ${(appearance as any)[item.key] ? 'bg-blue-600 shadow-xl shadow-blue-100' : 'bg-slate-700'}`}
                           >
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${(appearance as any)[item.key] ? 'left-7' : 'left-1'}`}></div>
                           </button>
                        </div>
                     ))}
                  </div>
                  <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[3]" size={300} />
               </div>

               {/* APP PAGES */}
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm flex flex-col space-y-10">
                  <div className="flex justify-between items-center">
                     <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic leading-none">Feature Management</h3>
                        <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">Directory & Permissions Layer</p>
                     </div>
                     <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center gap-2">
                        <LayersIcon size={14} />
                        <span className="text-[10px] font-black">{appPages.length} Registered</span>
                     </div>
                  </div>

                  <div className="space-y-10 overflow-y-auto max-h-[500px] custom-scrollbar pr-4">
                     {appPages.map(page => (
                        <div key={page.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 group ${page.enabled ? 'border-blue-50 bg-white' : 'border-slate-50 bg-slate-50 opacity-60 grayscale'}`}>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-all ${page.enabled ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-slate-300'}`}>
                                    {getIcon(page.icon)}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-slate-900 uppercase text-xs leading-none mb-1">{page.label}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Category: {page.category}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <button
                                    onClick={() => db.toggleDirectoryView(page.id, !page.showInDirectory)}
                                    className={`p-2 rounded-xl transition-all ${page.showInDirectory ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                 >
                                    {page.showInDirectory ? <Eye size={18} /> : <EyeOff size={18} />}
                                 </button>
                                 <button
                                    onClick={() => db.toggleAppPage(page.id, !page.enabled)}
                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${page.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                 >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${page.enabled ? 'left-7' : 'left-1'}`}></div>
                                 </button>
                              </div>
                           </div>

                           <div className="space-y-2 pt-2 border-t border-slate-50">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Palette</p>
                              <div className="flex flex-wrap gap-2">
                                 {industrialSwatches.map(color => (
                                    <button
                                       key={color}
                                       onClick={() => {
                                          const next = appPages.map(p => p.id === page.id ? { ...p, swatch: color } : p);
                                          db.updateSettings({ ...state.settings, appearance: { ...appearance, appPages: next } });
                                       }}
                                       style={{ backgroundColor: color }}
                                       className={`w-6 h-6 rounded-lg transition-all ${page.swatch === color ? 'ring-4 ring-blue-500/30 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                    />
                                 ))}
                                 <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">HEX:</span>
                                    <input
                                       className="w-20 p-1 bg-slate-100 border rounded font-mono text-[9px] text-center uppercase"
                                       value={page.swatch || '#FFFFFF'}
                                       onChange={e => {
                                          const next = appPages.map(p => p.id === page.id ? { ...p, swatch: e.target.value } : p);
                                          db.updateSettings({ ...state.settings, appearance: { ...appearance, appPages: next } });
                                       }}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'audit' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><ShieldAlert size={28} /></div>
                     <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Security Settings</h3>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Service Audit Trail</p>
                     </div>
                  </div>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-blue-300 tracking-widest">{state.securityLogs.length} Events Logged</span>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                  <table className="w-full text-left">
                     <thead className="sticky top-0 bg-white border-b z-10">
                        <tr>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Target</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Level</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {state.securityLogs.map(log => (
                           <tr key={log.id} className="hover:bg-white transition-colors group">
                              <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-8 py-5">
                                 <p className="font-black text-slate-900 uppercase text-xs mb-1">{log.action}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-xs">{log.details}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2">
                                    <UserCircle size={14} className="text-slate-300" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase">{log.targetName}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${log.riskLevel === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    log.riskLevel === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                       'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>{log.riskLevel}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </div>
   );
};

export default UserAppManagement;


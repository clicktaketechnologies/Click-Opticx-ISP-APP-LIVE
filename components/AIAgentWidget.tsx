import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { 
  Bot, Sparkles, X, ChevronRight, Activity, 
  ShieldAlert, Zap, HeartPulse, ShieldCheck, 
  Settings, RefreshCw, BarChart3, TrendingUp, Power, Eye, EyeOff, Lock
} from 'lucide-react';
import { AppState, AISuggestion, Role, AIConfig } from '../types';
import Modal from './shared/Modal';
import { Mini5GMicroLoader } from './Mini5GMicroLoader';

const AIAgentWidget: React.FC<{ state: AppState }> = ({ state }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'audit' | 'status'>('suggestions');
  const [isUpdating, setIsUpdating] = useState(false);

  const user = state.currentUser;
  const isCustomer = user?.role === Role.CUSTOMER;
  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN;
  
  // Fixed: Removed partial fallback object as it causes type union mismatches with full AIConfig
  const aiConfig = state.settings.aiConfig;
  const killSwitch = aiConfig.killSwitchActive;
  const showToUsers = aiConfig.showWidgetToUsers;

  // VISIBILITY LOGIC: Customers only see if allowed; Admins always see if core is active
  if (isCustomer && !showToUsers) return null;

  const suggestions = state.aiSuggestions.slice(0, 5);

  const healthScore = useMemo(() => {
    if (killSwitch) return 0;
    const errorFactor = Math.max(0, 10 - (state.aiEvents.filter(e => e.isError).length / 10));
    return Math.round(90 + errorFactor);
  }, [state.aiEvents, killSwitch]);

  const frictionScore = useMemo(() => {
    if (killSwitch) return 100;
    const failures = state.aiEvents.filter(e => e.action.includes('failure')).length;
    return Math.min(100, failures * 5);
  }, [state.aiEvents, killSwitch]);

  const handleToggleUserVisibility = async () => {
    if (!isAdmin) return;
    setIsUpdating(true);
    // Spreading full aiConfig to ensure all properties required by AIConfig type are present
    const nextConfig: AIConfig = {
      ...aiConfig,
      showWidgetToUsers: !showToUsers
    };
    await db.updateAIConfig(nextConfig);
    setIsUpdating(false);
    db.logNotification('all', 'info', 'AI Visibility Registry', `Subscriber-side AI Assistant has been ${!showToUsers ? 'enabled' : 'restricted'}.`);
  };

  return (
    <>
      {/* Floating AI Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[2000] p-4 rounded-[2rem] shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-3 border-4 border-white group overflow-hidden ${killSwitch ? 'bg-rose-600' : 'bg-slate-900'}`}
      >
         <div className="relative">
            <Bot size={28} className="text-white relative z-10" />
            {!killSwitch && <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-400 animate-pulse z-10" />}
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${killSwitch ? 'bg-rose-400' : 'bg-blue-400'}`}></div>
         </div>
         <span className="text-[10px] font-black text-white uppercase tracking-widest pr-2 hidden md:block">
            {killSwitch ? 'AI OFFLINE' : 'AI Assistant'}
         </span>
         {!showToUsers && isAdmin && (
           <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg border-b border-l border-white/20">
              <EyeOff size={8} className="text-white" />
           </div>
         )}
      </button>

      {/* Smart AI Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={killSwitch ? "SYSTEM_HALTED" : "AI Agent v8.5"}
        type={killSwitch ? "error" : "info"}
        icon={killSwitch ? <Power size={24} className="text-white" /> : <Bot size={24} className="text-white" />}
        maxWidth="max-w-lg"
        headerRightContent={
           isAdmin && (
             <button 
               onClick={handleToggleUserVisibility}
               disabled={isUpdating}
               className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border group/btn ${showToUsers ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
               title={showToUsers ? 'Disable for Subscribers' : 'Enable for Subscribers'}
             >
                {isUpdating ? <Mini5GMicroLoader size={14} /> : showToUsers ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="text-[7px] font-black uppercase tracking-tighter hidden sm:inline">User Side: {showToUsers ? 'ON' : 'OFF'}</span>
             </button>
           )
        }
        footer={
           <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${killSwitch ? 'bg-rose-50 animate-pulse' : 'bg-green-500'}`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{killSwitch ? 'Core Restricted' : 'Core Synchronized'}</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
              >
                Acknowledge
              </button>
           </div>
        }
      >
         <div className="space-y-6">
            <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
               {[
                 { id: 'suggestions', label: 'Intelligence', icon: Sparkles },
                 { id: 'audit', label: 'Safety Audit', icon: ShieldAlert },
                 { id: 'status', label: 'Heuristic Node', icon: Activity }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                 </button>
               ))}
            </div>

            <div className="min-h-[400px]">
               {killSwitch ? (
                 <div className="h-full py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-inner border-2 border-rose-100">
                       <Power size={40} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Handshake Severed</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                          The Global AI Kill-Switch is currently active. All heuristic analysis and suggestions are restricted until re-authorization.
                       </p>
                    </div>
                 </div>
               ) : (
                 <>
                   {activeTab === 'suggestions' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                       <div className="flex justify-between items-end px-2 mb-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Recommendations</h4>
                          <span className="text-[8px] font-black text-green-600 uppercase italic">Real-time analysis active</span>
                       </div>
                       {suggestions.map(sug => (
                         <div key={sug.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3">
                                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${sug.priority === 'Critical' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-blue-50 text-blue-600'}`}>
                                     {sug.category}
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(sug.timestamp).toLocaleTimeString()}</span>
                               </div>
                               <Zap size={14} className={sug.priority === 'Critical' ? 'text-rose-500 animate-pulse' : 'text-slate-200'} />
                            </div>
                            <div className="space-y-1">
                               <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{sug.title}</h5>
                               <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">{sug.message}</p>
                            </div>
                         </div>
                       ))}
                       {suggestions.length === 0 && (
                         <div className="py-20 text-center flex flex-col items-center">
                            <ShieldCheck size={48} className="text-slate-100 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry synchronized. No optimizations suggested.</p>
                         </div>
                       )}
                    </div>
                   )}

                   {activeTab === 'audit' && (
                     <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] space-y-4">
                           <div className="flex items-center gap-4 text-rose-600">
                              <ShieldAlert size={28}/>
                              <h4 className="text-lg font-black uppercase italic tracking-tighter">Security Dossier</h4>
                           </div>
                           <p className="text-[10px] text-rose-800 font-bold uppercase leading-relaxed">
                              AI is monitoring behavior for node ID collisions and potential fiscal fraud patterns.
                           </p>
                        </div>
                        <div className="space-y-3">
                           {state.aiLogs.slice(0, 5).map(log => (
                             <div key={log.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                   <div className={`w-2 h-2 rounded-full ${log.confidence > 0.8 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                   <p className="text-[10px] font-black text-slate-700 uppercase">{log.action}</p>
                                </div>
                                <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   {activeTab === 'status' && (
                      <div className="space-y-8 animate-in slide-in-from-right-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center gap-3 text-center">
                               <HeartPulse size={32} className={`text-green-400 ${killSwitch ? 'opacity-20 grayscale' : 'animate-pulse'}`} />
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Health Score</p>
                                  <h4 className="text-3xl font-black italic">{healthScore}%</h4>
                               </div>
                            </div>
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col items-center gap-3 text-center">
                               <Settings size={32} className={`text-blue-400 ${killSwitch ? 'opacity-20 grayscale' : ''}`} />
                               <div>
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">UX Friction</p>
                                  <h4 className="text-3xl font-black italic">{frictionScore}%</h4>
                               </div>
                            </div>
                         </div>
                         
                         <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Distribution</h4>
                            <div className="flex h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 w-1/2"></div>
                               <div className="h-full bg-blue-500 w-1/4"></div>
                               <div className="h-full bg-green-500 w-1/4"></div>
                            </div>
                            <div className="flex justify-between px-2">
                               <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[7px] font-black text-slate-400 uppercase">FISCAL</span></div>
                               <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[7px] font-black text-slate-400 uppercase">INFRA</span></div>
                               <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[7px] font-black text-slate-400 uppercase">AUTH</span></div>
                            </div>
                         </div>
                      </div>
                   )}
                 </>
               )}
            </div>
         </div>
      </Modal>
    </>
  );
};

export default AIAgentWidget;


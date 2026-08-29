import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useMemo, useState } from 'react';
import { AppState, ReferralRecord, Role } from '../types';
import { db } from '../db';
import { 
  Trophy, Search, Settings2, ShieldCheck, Zap, 
  Users, UserCircle, HandCoins, Activity, History, 
  RotateCw, Layers, ShieldAlert, CheckCircle, XCircle,
  BarChart3, Globe, Sparkles, Filter, ChevronRight
} from 'lucide-react';

const ReferralAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState(state.settings.referral);

  const stats = useMemo(() => {
    const totalPoints = state.referrals.reduce((acc, r) => acc + r.totalPointsEarned, 0);
    const activeNodes = state.referrals.length;
    const pendingConversions = state.users.reduce((acc, u) => acc + (u.referralPoints || 0), 0);
    return { totalPoints, activeNodes, pendingConversions };
  }, [state.referrals, state.users]);

  const filteredReferrals = useMemo(() => {
    return state.referrals.filter(r => 
      r.referredUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referrerId.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.referrals, searchTerm]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await db.updateSettings({ ...state.settings, referral: config });
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Registry Update', 'Referral rules updated across all nodes.');
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Trophy className="text-amber-500" size={32} />
            Economy Command
          </h2>
          <p className="text-slate-500 font-medium">Control global commission rules, audit multi-stage rewards, and monitor network growth.</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-4 px-6">
           <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
              <span className="text-[10px] font-black uppercase text-slate-600">{config.enabled ? 'Infrastructure Online' : 'System Disabled'}</span>
           </div>
           <button 
             onClick={() => setConfig({...config, enabled: !config.enabled})}
             className={`w-12 h-6 rounded-full relative transition-all duration-300 ${config.enabled ? 'bg-green-600' : 'bg-slate-300'}`}
           >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.enabled ? 'left-7' : 'left-1'}`}></div>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {[
           { label: 'Circulating Points', value: stats.totalPoints.toLocaleString(), icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Linked Nodes', value: stats.activeNodes, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Pending Conversions', value: `${state.settings.currency} ${(stats.pendingConversions * config.conversionRatio).toLocaleString()}`, icon: HandCoins, color: 'text-green-600', bg: 'bg-green-50' },
           { label: 'Growth Tier', value: 'High', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><stat.icon size={20}/></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 italic tracking-tighter">{stat.value}</h3>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={18} className="text-blue-600" /> Protocol Rulebook
               </h3>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Signup Pts</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={config.signupPoints} onChange={e => setConfig({...config, signupPoints: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pkg 1 Pts</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={config.pkg1Points} onChange={e => setConfig({...config, pkg1Points: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pkg 2 Pts</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={config.pkg2Points} onChange={e => setConfig({...config, pkg2Points: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pkg 3 Pts</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={config.pkg3Points} onChange={e => setConfig({...config, pkg3Points: Number(e.target.value)})} />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Min Eligible Price (Rs.)</label>
                     <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl font-black" value={config.minPkgPrice} onChange={e => setConfig({...config, minPkgPrice: Number(e.target.value)})} />
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                     <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Fiscal Multiplier</span>
                        <span className="text-xl font-black italic text-green-400">{config.conversionRatio}</span>
                     </div>
                     <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">System assumes 1 point = Rs. {config.conversionRatio}. Conversion burns points instantly.</p>
                  </div>

                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                     {isSaving ? <Mini5GMicroLoader size={16} /> : 'Synchronize All Nodes'}
                  </button>
               </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 space-y-4 shadow-inner">
               <div className="flex items-center gap-3 text-amber-600">
                  <ShieldAlert size={24} />
                  <h4 className="font-black text-xs uppercase">Anti-Fraud Enforcement</h4>
               </div>
               <ul className="space-y-3">
                  {[
                    'One referral path per unique identity.',
                    'Node linkage locked forever at signup.',
                    'Manual adjustment logs required for audit.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-2 text-[9px] font-bold text-amber-800 uppercase leading-none">
                       <CheckCircle size={10} className="mt-0.5 shrink-0" /> {rule}
                    </li>
                  ))}
               </ul>
            </div>
         </div>

         <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center">
               <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    className="w-full pl-14 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-slate-900"
                    placeholder="Audit by referred name or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
               <div className="p-8 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-20">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Globe size={14} className="text-blue-500" /> Operational Link Registry
                  </h3>
                  <span className="px-4 py-1.5 bg-white border rounded-full text-[9px] font-black text-slate-500 uppercase">{filteredReferrals.length} Nodes</span>
               </div>
               
               <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                  {filteredReferrals.map(ref => {
                    const referrer = state.users.find(u => u.id === ref.referrerId);
                    return (
                      <div key={ref.id} className="p-8 hover:bg-slate-50 transition-colors group">
                         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-white border rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-blue-600 transition-colors relative">
                                  <UserCircle size={32} />
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                               </div>
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic leading-none">{ref.referredUserName}</h4>
                                     <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">By: {referrer?.name || 'Unknown'}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ref.referredUserPhone} • Registered {new Date(ref.timestamp).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="text-right">
                                  <p className="text-2xl font-black text-blue-600 italic tracking-tighter">+{ref.totalPointsEarned}</p>
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Credited</p>
                               </div>
                               <button className="p-4 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all">
                                  <History size={18} />
                                </button>
                            </div>
                         </div>

                         <div className="mt-8 grid grid-cols-4 gap-4">
                            {ref.stages.map((stg, si) => (
                              <div key={si} className={`p-4 rounded-2xl border transition-all ${stg.completed ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100 grayscale opacity-60'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{stg.label}</p>
                                    {stg.completed && <CheckCircle size={10} className="text-green-600" />}
                                 </div>
                                 <p className={`text-xs font-black italic ${stg.completed ? 'text-green-700' : 'text-slate-400'}`}>{stg.points} Pts</p>
                              </div>
                            ))}
                         </div>
                      </div>
                    );
                  })}

                  {filteredReferrals.length === 0 && (
                    <div className="p-32 text-center flex flex-col items-center">
                       <ShieldCheck className="text-slate-100 mb-6" size={80} />
                       <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Queue Synchronized. No referrals found.</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReferralAdmin;


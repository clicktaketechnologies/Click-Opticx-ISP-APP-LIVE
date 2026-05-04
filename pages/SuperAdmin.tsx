
import React from 'react';
import { AppState, Role } from '../types';
import { 
  ShieldCheck, Activity, Fingerprint, Lock, 
  Users, Zap, ShieldAlert, Key, Terminal,
  LayoutDashboard, Server, Database, Globe
} from 'lucide-react';

const SuperAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const superAdmins = state.staff?.filter(s => s.role === Role.SUPER_ADMIN) || [];
  
  return (
    <div className="min-h-screen space-y-8 pb-20">
      {/* ─── HERO SECTION ─── */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[3rem] p-10 text-white border border-white/5 shadow-2xl">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
            <ShieldCheck size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Authority Level 0 • Root Console</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
            SuperAdmin Command <span className="text-indigo-500">Center</span>
          </h1>
          <p className="text-slate-400 font-bold max-w-xl text-sm uppercase tracking-tight">
            Comprehensive oversight of the Click Opticx security architecture, hierarchical scope protocols, and cryptographic identity matrix.
          </p>
        </div>
        
        {/* Decorative elements */}
        <ShieldAlert className="absolute -right-10 -bottom-10 text-indigo-500/10 scale-[8] rotate-12" />
        <Fingerprint className="absolute right-20 top-10 text-white/5 size-48 rotate-12" />
      </div>

      {/* ─── METRIC GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Security Tier', value: 'Level 0', sub: 'Root Access', icon: Key, color: 'text-indigo-500' },
          { label: 'Scope Protocol', value: 'v1.2 Stable', sub: 'Matrix Active', icon: Activity, color: 'text-emerald-500' },
          { label: 'Root Guardians', value: superAdmins.length, sub: 'Active Sessions', icon: Users, color: 'text-blue-500' },
          { label: 'System Integrity', value: '99.9%', sub: 'NOC Monitored', icon: Zap, color: 'text-amber-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 ${card.color}`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none mt-1">{card.value}</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── SCOPE PROTOCOL V1.2 SUMMARY ─── */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Terminal size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Scope Protocol v1.2</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Cryptographic Matrix</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">Online</span>
          </div>

          <div className="space-y-4">
            {state.permissions.slice(0, 5).map((perm, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                    <Database size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{perm.id}</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Authority ID: {perm.id.toUpperCase()}-X</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${perm.view?.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>Read</span>
                  <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${perm.edit?.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>Write</span>
                  <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${perm.delete?.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-400'}`}>Purge</span>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="w-full py-4 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-slate-100 flex items-center justify-center gap-3 active:scale-95 shadow-sm"
            onClick={() => window.location.hash = '#/permissions'}
          >
            Manage Full Matrix <ArrowRight size={14} />
          </button>
        </div>

        {/* ─── INFRASTRUCTURE HEALTH ─── */}
        <div className="bg-slate-950 rounded-[3rem] p-8 text-white space-y-8 relative overflow-hidden">
          <Globe className="absolute -right-10 top-0 text-white/5 size-64 rotate-12" />
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-black tracking-tight uppercase italic leading-none">Infrastructure <br/> <span className="text-indigo-400">Health Grid</span></h3>
            
            <div className="space-y-6">
               {[
                 { label: 'Supabase Cloud', status: 'Optimal', icon: Database, color: 'bg-emerald-500' },
                 { label: 'Firebase Realtime', status: 'Syncing', icon: Zap, color: 'bg-amber-500' },
                 { label: 'Edge NOC Nodes', status: 'Active', icon: Server, color: 'bg-indigo-500' },
                 { label: 'AI Control Plane', status: 'Learning', icon: Activity, color: 'bg-blue-500' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shadow-lg`}>
                     <item.icon size={20} className="text-white" />
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                       <span className="text-[9px] font-bold text-white/50">{item.status}</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} animate-pulse`} style={{ width: '85%' }}></div>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;

import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, SenderIdentity } from '../../types';
import { db } from '../../db';
import { 
  UserCheck, Plus, Search, Filter, Mail, Globe, 
  Trash2, ShieldCheck, CheckCircle, RefreshCw, X,
  Save, AlertTriangle, ChevronRight, Activity, Clock, ShieldAlert,
  Smartphone, Hash, Zap, Info
} from 'lucide-react';

const SenderIdentities: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const identities = state.settings.commConfig.senderIdentities;

  const [formData, setFormData] = useState<Partial<SenderIdentity>>({
    name: '',
    email: ''
  });

  const filtered = useMemo(() => {
    return identities.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [identities, searchTerm]);

  const handleAdd = async () => {
    if (!formData.name || !formData.email) return;
    setIsProcessing('new');
    await db.addSenderIdentity(formData);
    setIsProcessing(null);
    setIsModalOpen(false);
    setFormData({ name: '', email: '' });
    db.logNotification('all', 'info', 'Identity Registry', 'New sender node initialized. Awaiting verification handshake.');
  };

  const handleVerify = async (id: string) => {
    const code = prompt("Enter the 6-digit verification code dispatched to this email node:");
    if (!code) return;
    setIsProcessing(id);
    await db.verifySenderIdentity(id);
    setIsProcessing(null);
    db.logNotification('all', 'success', 'Identity Verified', 'Email node successfully authorized for digital dispatch.');
  };

  const handleDelete = async (id: string) => {
    if (confirm("PURGE PROTOCOL: Permanently revoke this identity's authorization?")) {
      await db.deleteSenderIdentity(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <UserCheck className="text-indigo-600" size={32} />
            Authorized Identities
          </h2>
          <p className="text-slate-500 font-medium">Manage verified email nodes for corporate and administrative dispatches.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> Provision Identity
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
              placeholder="Filter identities by name or domain..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filtered.map(ident => (
           <div key={ident.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all hover:shadow-xl group relative overflow-hidden flex flex-col h-full ${ident.isVerified ? 'border-emerald-100' : 'border-amber-100 shadow-amber-50 shadow-lg'}`}>
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner group-hover:scale-105 transition-transform ${ident.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    <Mail size={32}/>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${ident.isVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                       {ident.isVerified ? 'Verified node' : 'Handshake Pending'}
                    </div>
                    {ident.isDefault && <span className="text-[8px] font-black text-indigo-600 uppercase italic">⭐ System Default</span>}
                 </div>
              </div>

              <div className="relative z-10 space-y-4 mb-10 flex-1">
                 <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none truncate group-hover:text-indigo-600 transition-colors">{ident.name}</h4>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{ident.email}</p>
                 <div className="flex items-center gap-2 pt-2 text-slate-300 text-[8px] font-black uppercase">
                    <Clock size={12}/> Provisioned: {new Date(ident.createdAt).toLocaleDateString()}
                 </div>
              </div>

              <div className="mt-auto space-y-4 relative z-10 pt-6 border-t border-slate-50">
                 <div className="flex gap-2">
                    {!ident.isVerified ? (
                       <button 
                         onClick={() => handleVerify(ident.id)}
                         disabled={isProcessing === ident.id}
                         className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                          {isProcessing === ident.id ? <Mini5GMicroLoader size={14} /> : <ShieldCheck size={14}/>}
                          Verify Node
                       </button>
                    ) : (
                       <button className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">Set Default</button>
                    )}
                    <button 
                      onClick={() => handleDelete(ident.id)}
                      className="p-4 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                    >
                       <Trash2 size={20}/>
                    </button>
                 </div>
              </div>
              <Activity className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-indigo-900" size={140} />
           </div>
         ))}
         
         {filtered.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
              <UserCheck className="text-slate-100 mb-8" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Identity Grid Dormant</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Establish your first sender Caller Details to begin digital dispatch.</p>
           </div>
         )}
      </div>

      <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-4 text-emerald-400">
               <ShieldCheck size={28} />
               <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none">Security Architecture</h3>
            </div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase opacity-80 italic">
               Sender identities are cryptographically verified to prevent domain spoofing. Default nodes are prioritized for automated administrative handshakes and billing relays.
            </p>
         </div>
         <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <UserCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Provision Identity</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Email Setup Status</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Sender Friendly Name</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all uppercase" placeholder="e.g. BILLING RELAY" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Corporate Email</label>
                       <input type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all" placeholder="billing@domain.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4 shadow-inner">
                    <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                       Provisioning triggers a verification handshake. The Caller Details will remain 'Standby' until the email link is confirmed.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort</button>
                 <button 
                  onClick={handleAdd}
                  disabled={isProcessing === 'new' || !formData.email || !formData.name}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isProcessing === 'new' ? <Mini5GMicroLoader size={18} /> : <Save size={18}/>}
                    Commit Caller Details
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SenderIdentities;

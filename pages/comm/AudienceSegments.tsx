import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, AudienceSegment, UserStatus } from '../../types';
import { db } from '../../db';
import { 
  Users, Plus, Search, Filter, Layers, 
  UserCheck, ShieldAlert, History, Activity, 
  CheckCircle, ChevronRight, X, Save, 
  RefreshCw, Hash, Database, Zap, Sparkles, Trash2, ShieldCheck
} from 'lucide-react';

const AudienceSegments: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<AudienceSegment>>({
    name: '',
    description: '',
    filters: { status: 'Active' }
  });

  const filteredSegments = useMemo(() => {
    return state.audienceSegments.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.audienceSegments, searchTerm]);

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSaving(true);
    await db.saveAudienceSegment(formData);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Users className="text-blue-600" size={32} />
            User Groups
          </h2>
          <p className="text-slate-500 font-medium">Group users together for easier messaging and announcements.</p>
        </div>
        <button 
          onClick={() => { setFormData({ name: '', description: '', filters: { status: 'Active' } }); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> + Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredSegments.map(seg => (
            <div key={seg.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center border shadow-inner group-hover:scale-105 transition-transform"><Layers size={32}/></div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Users Included</p>
                     <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{seg.subscriberCount}</p>
                  </div>
               </div>

               <div className="relative z-10 space-y-4 mb-10">
                  <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{seg.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed line-clamp-2">{seg.description}</p>
               </div>

               <div className="mt-auto space-y-4 relative z-10 pt-6 border-t border-slate-50">
                  <div className="flex flex-wrap gap-2">
                     {Object.entries(seg.filters).map(([k, v]: [string, any]) => (
                       <span key={k} className="px-2 py-1 bg-slate-900 text-[7px] text-white font-black uppercase tracking-tighter rounded-lg">{k}: {typeof v === 'object' ? JSON.stringify(v) : v}</span>
                     ))}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { setFormData(seg); setIsModalOpen(true); }} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl font-black text-[9px] uppercase hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">Edit Group</button>
                     <button className="p-3 bg-slate-50 text-slate-300 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={18}/></button>
                  </div>
               </div>
               <Sparkles className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-blue-900" size={140} />
            </div>
         ))}
         
         {filteredSegments.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
               <Users className="text-slate-100 mb-8" size={80} />
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Groups Created</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Create your first user group to send targeted messages.</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Group Settings</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Set up group filters</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Group Name</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all" placeholder="e.g. Active Users in Karachi" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Group Description</label>
                       <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:border-blue-600 transition-all uppercase" placeholder="What is this group for?" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Filter Parameters</h4>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black uppercase text-slate-500">User Status</span>
                             <select 
                               className="bg-transparent font-black text-[9px] uppercase outline-none text-blue-600"
                               value={formData.filters?.status || ''}
                               onChange={e => setFormData({...formData, filters: { ...formData.filters, status: e.target.value }})}
                             >
                                <option value="">Any Status</option>
                                {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                          <div className="h-px bg-slate-200"></div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black uppercase text-slate-500">Credit Threshold</span>
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">LT &lt;</span>
                                <input 
                                  type="number" 
                                  className="w-16 bg-white border border-slate-200 rounded p-1 text-[9px] font-black text-center" 
                                  value={formData.filters?.creditScore?.$lt || ''}
                                  onChange={e => setFormData({...formData, filters: { ...formData.filters, creditScore: { $lt: Number(e.target.value) } }})}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                       <Database size={24} className="text-blue-500" />
                       <div>
                          <p className="text-[10px] font-black text-blue-900 uppercase">Total Matches</p>
                          <p className="text-xs font-black text-blue-700 italic">System found approx. {state.users.length} users</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                 <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18}/>}
                    Save Group
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AudienceSegments;


import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, EmailCampaign } from '../../types';
import { db } from '../../db';
import { 
  Send, Plus, Search, Filter, Mail, Calendar, 
  BarChart3, Clock, CheckCircle, AlertCircle, X,
  ArrowRight, Users, Layout, Globe, Trash2, RefreshCw, Info
} from 'lucide-react';

const EmailCampaigns: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<Partial<EmailCampaign>>({
    name: '',
    subject: '',
    senderName: state.settings.notificationBranding.emailSenderName,
    senderEmail: state.settings.support.email,
    templateId: state.emailTemplates[0]?.id || '',
    segmentId: state.audienceSegments[0]?.id || '',
    type: 'One-Time',
    status: 'Draft'
  });

  const filteredCampaigns = useMemo(() => {
    return state.emailCampaigns.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.id.localeCompare(a.id));
  }, [state.emailCampaigns, searchTerm]);

  const handleCreate = async () => {
    if (!formData.name || !formData.subject) return;
    setIsProcessing(true);
    await db.saveEmailCampaign(formData);
    setIsProcessing(false);
    setIsModalOpen(false);
  };

  const handleSend = async (id: string) => {
    if (confirm("SEND MESSAGE: This will send emails to the selected users. Proceed?")) {
      await db.sendCampaign(id);
    }
  };

  const getStatusStyle = (status: EmailCampaign['status']) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Sending': return 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
      case 'Failed': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Scheduled': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Send className="text-emerald-600" size={32} />
            Email Messages
          </h2>
          <p className="text-slate-500 font-medium">Send bulk messages and announcements to your users.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> + Create Message
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-900"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filteredCampaigns.map(camp => (
            <div key={camp.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-md transition-all group">
               <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border shadow-inner ${camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                     <Mail size={32}/>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic truncate">{camp.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(camp.status)}`}>{camp.status}</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Subject: {camp.subject}</p>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Target Group</p>
                           <p className="text-xs font-black text-slate-700 truncate">{state.audienceSegments.find(s => s.id === camp.segmentId)?.name || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Open Rate</p>
                           <p className="text-xs font-black text-emerald-600 italic">
                              {camp.stats.sent > 0 ? Math.round((camp.stats.opened / camp.stats.sent) * 100) : 0}%
                           </p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Clicks</p>
                           <p className="text-xs font-black text-blue-600 italic">{camp.stats.clicked}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Sent</p>
                           <p className="text-xs font-black text-slate-900 italic">{camp.stats.sent}</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 shrink-0">
                  {camp.status === 'Draft' && (
                    <button 
                     onClick={() => handleSend(camp.id)}
                     className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
                    >
                     Send Now
                    </button>
                  )}
                  <button className="p-3.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100">
                     <BarChart3 size={20}/>
                  </button>
                  <button className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100">
                     <Trash2 size={20}/>
                  </button>
               </div>
            </div>
         ))}

         {filteredCampaigns.length === 0 && (
            <div className="p-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
               <Mail className="text-slate-100 mb-6" size={80} />
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Messages Found</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Click "Create Message" to get started.</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Create New Message</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Message Setup</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Message Name (for your records)</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all" placeholder="e.g. Monthly Newsletter" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Subject</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all" placeholder="Action Required: Your Invoice" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Who should receive this?</label>
                       <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-indigo-500" value={formData.segmentId} onChange={e => setFormData({...formData, segmentId: e.target.value})}>
                          {state.audienceSegments.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subscriberCount})</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Message Design/Template</label>
                       <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-indigo-500" value={formData.templateId} onChange={e => setFormData({...formData, templateId: e.target.value})}>
                          {state.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                    <Info className="text-blue-600 mt-1 shrink-0" size={24} />
                    <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                       Messages are saved as drafts first. You'll need to confirm before they are actually sent to users.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                 <button 
                  onClick={handleCreate}
                  disabled={isProcessing}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isProcessing ? <Mini5GMicroLoader size={18} /> : <CheckCircle size={18}/>}
                    Save & Continue
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;

import React, { useState, useMemo } from 'react';
import { AppState, NotificationTemplate, NotificationTriggerEvent } from '../../types';
import { db } from '../../db';
import { 
  FileText, Plus, Search, Layout, Code2, 
  Eye, Save, X, Trash2, Globe, CheckCircle, 
  Smartphone, Monitor, Bell, MessageSquare, Zap, Activity
} from 'lucide-react';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

const NotificationTemplates: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate> | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    return state.notificationTemplates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.notificationTemplates, searchTerm]);

  const handleOpenEdit = (t?: NotificationTemplate) => {
    setEditingTemplate(t || { 
        name: '', 
        event: 'GENERAL', 
        category: 'System', 
        channels: ['Push'],
        pushTitle: '',
        pushBody: '',
        smsMessage: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate?.channels?.length) return;
    setIsSaving(true);
    await db.saveNotificationTemplate(editingTemplate);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await db.deleteNotificationTemplate(id);
    }
  };

  const handleToggleChannel = (channel: 'Push' | 'SMS' | 'Email') => {
      setEditingTemplate(prev => {
          if (!prev) return prev;
          const channels = prev.channels || [];
          if (channels.includes(channel)) {
              return { ...prev, channels: channels.filter(c => c !== channel) };
          } else {
              return { ...prev, channels: [...channels, channel] };
          }
      });
  };

  const triggerEvents: NotificationTriggerEvent[] = [
      'PACKAGE_ACTIVATED', 'PAYMENT_RECEIVED', 'INVOICE_GENERATED',
      'EMERGENCY_LOAD_USED', 'INTERNET_DISCONNECTED', 'SIGNUP_APPROVED', 'AUTH_OTP'
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Layout className="text-blue-600" size={32} />
            Smart Templates
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Master blueprints for Push, SMS, and Email</p>
        </div>
        <button 
          onClick={() => handleOpenEdit()}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> + New Template
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredTemplates.map(t => (
            <div key={t.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border shadow-inner"><FileText size={28}/></div>
                  <div className="flex gap-2">
                      {t.channels.map(ch => (
                          <span key={ch} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100">{ch}</span>
                      ))}
                  </div>
               </div>
               <div className="space-y-2 mb-6 relative z-10">
                  <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight truncate leading-none">{t.name}</h4>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Trigger: {t.event}</p>
               </div>
               
               {t.channels.includes('Push') && (
                   <div className="p-4 bg-slate-50 rounded-2xl text-[9px] text-slate-600 uppercase font-black mb-4 line-clamp-2 leading-relaxed border border-slate-100">
                      <span className="text-slate-400 mr-2">PUSH:</span> {t.pushBody}
                   </div>
               )}
               {t.channels.includes('SMS') && (
                   <div className="p-4 bg-slate-50 rounded-2xl text-[9px] text-slate-600 uppercase font-black mb-4 line-clamp-2 leading-relaxed border border-slate-100">
                      <span className="text-slate-400 mr-2">SMS:</span> {t.smsMessage}
                   </div>
               )}

               <div className="mt-auto flex gap-2 relative z-10 pt-4">
                  <button 
                   onClick={() => handleOpenEdit(t)}
                   className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                  >
                     Edit Template
                  </button>
                  <button 
                   onClick={() => handleDelete(t.id)}
                   className="p-3.5 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                     <Trash2 size={18}/>
                  </button>
               </div>
               <Globe className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-blue-900" size={160} />
            </div>
         ))}

         {filteredTemplates.length === 0 && (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                 <Layout size={64} className="text-slate-200 mx-auto mb-4" />
                 <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">No Templates Found</h3>
             </div>
         )}
      </div>

      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
              <header className="p-8 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Code2 size={28}/></div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Smart Builder</h3>
                       <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Multi-channel message synchronization</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={32}/></button>
                 </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                 {/* Editor Panel */}
                 <div className="flex-[1.5] p-10 space-y-8 overflow-y-auto custom-scrollbar bg-white border-r border-slate-100">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Template Name</label>
                          <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Event Trigger</label>
                          <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-blue-500" value={editingTemplate.event} onChange={e => setEditingTemplate({...editingTemplate, event: e.target.value as any})}>
                             <option value="GENERAL">Manual Dispatch / General API Call</option>
                             {triggerEvents.map(evt => (
                                 <option key={evt} value={evt}>{evt.replace(/_/g, ' ')}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Active Channels</label>
                        <div className="flex gap-4">
                            {[
                                { id: 'Push', icon: Bell },
                                { id: 'SMS', icon: MessageSquare },
                                { id: 'Email', icon: Globe }
                            ].map(ch => (
                                <button 
                                    key={ch.id}
                                    onClick={() => handleToggleChannel(ch.id as any)}
                                    className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${editingTemplate.channels?.includes(ch.id as any) ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    <ch.icon size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{ch.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {editingTemplate.channels?.includes('Push') && (
                        <div className="space-y-4 p-8 bg-blue-50/30 rounded-[2.5rem] border border-blue-100">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 italic"><Bell size={14} /> Firebase Push Payload</h4>
                            <div className="space-y-4">
                                <input placeholder="Notification Title..." className="w-full p-4 bg-white border border-blue-200 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner" value={editingTemplate.pushTitle || ''} onChange={e => setEditingTemplate({...editingTemplate, pushTitle: e.target.value})} />
                                <textarea placeholder="Message Body... (Keep it short)" className="w-full h-24 p-4 bg-white border border-blue-200 rounded-2xl font-black text-xs outline-none focus:border-blue-600 transition-all shadow-inner resize-none" value={editingTemplate.pushBody || ''} onChange={e => setEditingTemplate({...editingTemplate, pushBody: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {editingTemplate.channels?.includes('SMS') && (
                        <div className="space-y-4 p-8 bg-green-50/30 rounded-[2.5rem] border border-green-100">
                            <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2 italic"><MessageSquare size={14} /> Direct SMS Body</h4>
                            <textarea placeholder="SMS Message Content... (160 Chars limit for single part)" className="w-full h-24 p-4 bg-white border border-green-200 rounded-2xl font-black text-xs outline-none focus:border-green-600 transition-all shadow-inner resize-none" value={editingTemplate.smsMessage || ''} onChange={e => setEditingTemplate({...editingTemplate, smsMessage: e.target.value})} />
                        </div>
                    )}
                 </div>

                 {/* Preview Panel Mobile */}
                 <div className="hidden lg:flex flex-1 p-10 bg-slate-100 flex-col items-center justify-center relative overflow-hidden">
                    <div className="w-[320px] h-[600px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[12px] border-slate-900 relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
                        
                        <div className="h-full bg-slate-100 pt-16 p-4 space-y-4 relative">
                            {editingTemplate.channels?.includes('Push') && (
                                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white flex gap-3 animate-in slide-in-from-top-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-[10px] flex items-center justify-center text-white shrink-0 shadow-inner">
                                        <Zap size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">{editingTemplate.pushTitle || 'Push Title'}</h5>
                                        <p className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-3">{editingTemplate.pushBody || 'Preview push body content here...'}</p>
                                    </div>
                                </div>
                            )}

                            {editingTemplate.channels?.includes('SMS') && (
                                <div className="bg-[#e5e5ea] p-4 rounded-[1.5rem] rounded-tl-sm w-fit max-w-[85%] self-start animate-in slide-in-from-left-4 fade-in duration-500 shadow-sm">
                                    <p className="text-[11px] text-black leading-relaxed">{editingTemplate.smsMessage || 'SMS preview content will appear here inside a generic message bubble...'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2]" size={300} />
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0 justify-between items-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic hidden md:block">Master Blueprint synced across all global systems.</p>
                 <div className="flex gap-4 w-full md:w-auto">
                     <button onClick={() => setIsModalOpen(false)} className="px-8 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                     <button 
                      onClick={handleSave}
                      disabled={isSaving || !editingTemplate.channels?.length}
                      className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isSaving ? <Mini5GMicroLoader size={18} /> : <Save size={18}/>}
                        Commit Template
                     </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTemplates;

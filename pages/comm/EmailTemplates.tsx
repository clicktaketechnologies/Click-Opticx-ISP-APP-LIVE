
import React, { useState, useMemo } from 'react';
import { AppState, EmailTemplate } from '../../types';
import { db } from '../../db';
import { 
  FileText, Plus, Search, Layout, Code2, 
  Eye, Save, X, Trash2, Globe, Sparkles, 
  CheckCircle, RefreshCw, Type, Smartphone, Monitor, AlertCircle, Activity
} from 'lucide-react';

const EmailTemplates: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    return state.emailTemplates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.emailTemplates, searchTerm]);

  const handleOpenEdit = (t?: EmailTemplate) => {
    setEditingTemplate(t || { name: '', content: '', category: 'System' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate?.content) return;
    setIsSaving(true);
    await db.saveEmailTemplate(editingTemplate);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently purge this template node?")) {
      await db.deleteEmailTemplate(id);
    }
  };

  const variables = [
    { key: '{{user.name}}', desc: 'Subscriber Full Name' },
    { key: '{{user.balance}}', desc: 'Current Ledger Balance' },
    { key: '{{user.expiryDate}}', desc: 'Package Expiry Registry' },
    { key: '{{user.connectionId}}', desc: 'Unique Handshake ID' }
  ];

  const renderPreviewContent = (content: string) => {
    let replaced = content;
    replaced = replaced.replace(/\{\{user.name\}\}/g, 'John Doe');
    replaced = replaced.replace(/\{\{user.balance\}\}/g, 'Rs. 1,500');
    replaced = replaced.replace(/\{\{user.expiryDate\}\}/g, '2025-06-15');
    return replaced;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Layout className="text-blue-600" size={32} />
            Visual Blueprint Registry
          </h2>
          <p className="text-slate-500 font-medium">Design and authorize global communication templates.</p>
        </div>
        <button 
          onClick={() => handleOpenEdit()}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> New Blueprint
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
              placeholder="Filter by Blueprint ID or Name..."
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
                 <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100">{t.category}</span>
              </div>
              <div className="space-y-2 mb-8 relative z-10">
                 <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight truncate leading-none">{t.name}</h4>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {t.id} • Refreshed: {new Date(t.lastUpdated).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-[9px] text-slate-400 uppercase font-black mb-8 line-clamp-3 leading-relaxed">
                 {t.content}
              </div>
              <div className="mt-auto flex gap-2 relative z-10">
                 <button 
                  onClick={() => handleOpenEdit(t)}
                  className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                 >
                    Modify Node
                 </button>
                 <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-3.5 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                 >
                    <Trash2 size={18}/>
                 </button>
              </div>
              <Globe className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150" size={160} />
           </div>
         ))}
      </div>

      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-6xl h-[90vh] shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
              <header className="p-8 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Code2 size={28}/></div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Blueprint Architect</h3>
                       <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Protocol: Variable Injection v2.1</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                       <button onClick={() => setPreviewMode('desktop')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${previewMode === 'desktop' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><Monitor size={14}/></button>
                       <button onClick={() => setPreviewMode('mobile')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${previewMode === 'mobile' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}><Smartphone size={14}/></button>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={32}/></button>
                 </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                 {/* Editor Panel */}
                 <div className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar bg-white border-r border-slate-100">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Blueprint Name</label>
                          <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Classification</label>
                          <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-indigo-500" value={editingTemplate.category} onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value as any})}>
                             <option value="Billing">Billing Node</option>
                             <option value="Technical">Technical Handshake</option>
                             <option value="Marketing">Growth Protocol</option>
                             <option value="System">Core Relay</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Content Structure (HTML/Markdown)</label>
                          <div className="flex gap-2">
                             {variables.map(v => (
                               <button 
                                key={v.key} 
                                onClick={() => setEditingTemplate({...editingTemplate, content: (editingTemplate.content || '') + ' ' + v.key})}
                                className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                               >
                                  {v.key}
                               </button>
                             ))}
                          </div>
                       </div>
                       <textarea 
                        className="w-full h-80 p-6 bg-slate-950 text-emerald-400 font-mono text-xs rounded-3xl resize-none outline-none border-4 border-slate-900 shadow-inner"
                        value={editingTemplate.content}
                        onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                       />
                    </div>
                 </div>

                 {/* Preview Panel */}
                 <div className="hidden lg:flex flex-1 p-10 bg-slate-50 flex-col items-center justify-center relative overflow-hidden">
                    <div className={`transition-all duration-700 bg-white shadow-2xl overflow-hidden border-8 border-slate-900 ${previewMode === 'mobile' ? 'w-80 h-[500px] rounded-[3rem]' : 'w-full h-full rounded-2xl'}`}>
                       <div className="p-8 space-y-6">
                          <div className="flex items-center gap-3 pb-6 border-b border-slate-50">
                             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic">CO</div>
                             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{state.settings.branding.businessName}</span>
                          </div>
                          <div className="prose max-w-none">
                             <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap uppercase font-bold italic opacity-80">
                                {renderPreviewContent(editingTemplate.content || '')}
                             </p>
                          </div>
                          <div className="pt-10 mt-10 border-t border-slate-50 text-center">
                             <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Sent via ClickOpticx Hub Registry</p>
                          </div>
                       </div>
                    </div>
                    <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2]" size={300} />
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort Process</button>
                 <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                    Authorize Publishing
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;

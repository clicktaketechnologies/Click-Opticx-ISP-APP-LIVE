import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useRef } from 'react';
import { AppState, Role, AboutUsConfig, BrandingConfig, InfrastructureConfig } from '../types';
import { db } from '../db';
import { 
  Info, Sparkles, Target, History, Zap, ShieldCheck, 
  Save, Edit3, X, Plus, Trash2, Globe, Building2, 
  Activity, Star, Layers, RefreshCw, Bookmark, Award, Clock, ArrowRight,
  Upload, Image as ImageIcon, Type, Palette, Smartphone, Network,
  CheckCircle, ShieldAlert, Hash, Landmark, Monitor, Server
} from 'lucide-react';

const AboutUs: React.FC<{ state: AppState }> = ({ state }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AboutUsConfig>(state.settings.aboutUs);
  const [brandData, setBrandData] = useState<BrandingConfig>(state.settings.branding);
  const [infraData, setInfraData] = useState<InfrastructureConfig>(state.settings.infrastructure);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSlot, setUploadSlot] = useState<'logoLight' | 'logoDark' | 'logoSquare' | null>(null);

  const isAdmin = state.currentUser?.role !== Role.CUSTOMER;
  const branding = state.settings.branding;

  const handleSave = async () => {
    setIsSaving(true);
    const updatedAbout = {
      ...formData,
      lastUpdated: new Date().toISOString()
    };
    
    await db.updateSettings({
      ...state.settings,
      branding: brandData,
      aboutUs: updatedAbout,
      infrastructure: infraData
    });

    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      db.logNotification('all', 'success', 'Settings Saved', 'Company branding and website settings updated.');
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSlot) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBrandData(prev => ({
        ...prev,
        [uploadSlot]: base64
      }));
      setUploadSlot(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (slot: 'logoLight' | 'logoDark' | 'logoSquare') => {
    setUploadSlot(slot);
    fileInputRef.current?.click();
  };

  const updateFeature = (id: string, field: 'title' | 'description', value: string) => {
    setFormData({
      ...formData,
      features: formData.features.map(f => f.id === id ? { ...f, [field]: value } : f)
    });
  };

  const updateValue = (index: number, value: string) => {
    const next = [...formData.values];
    next[index] = value;
    setFormData({ ...formData, values: next });
  };

  if (isEditing) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
           <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                <Edit3 className="text-indigo-600" size={32} />
                Edit Company Info
              </h2>
              <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Update your company branding and website settings</p>
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                 {isSaving ? <Mini5GMicroLoader size={16} /> : <ShieldCheck size={16}/>}
                 Save Changes
              </button>
           </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm p-10 space-y-12">
           <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                 <Building2 className="text-indigo-600" size={24} />
                 <h3 className="text-lg font-black uppercase italic tracking-tight">Company Branding</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Company Name</label>
                  <input 
                    type="text" 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-600 outline-none transition-all" 
                    value={brandData.businessName} 
                    onChange={e => setBrandData({...brandData, businessName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Short Name</label>
                  <input 
                    type="text" 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-600 outline-none transition-all" 
                    value={brandData.shortName} 
                    onChange={e => setBrandData({...brandData, shortName: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { id: 'logoLight', label: 'Primary Logo', desc: 'Used on light backgrounds' },
                   { id: 'logoDark', label: 'Secondary Logo', desc: 'Used on dark backgrounds' },
                   { id: 'logoSquare', label: 'App Icon', desc: 'A square version of your logo' }
                 ].map(slot => (
                   <div key={slot.id} className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase ml-1">{slot.label}</p>
                      <div 
                        onClick={() => triggerUpload(slot.id as any)}
                        className={`h-40 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center p-4 relative overflow-hidden ${ (brandData as any)[slot.id] ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300' }`}
                      >
                         {(brandData as any)[slot.id] ? (
                           <>
                             <img src={(brandData as any)[slot.id]} className="h-full object-contain drop-shadow-sm group-hover:opacity-50 transition-opacity" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-3 bg-white text-indigo-600 rounded-full shadow-xl">
                                   <Upload size={20} />
                                </button>
                             </div>
                           </>
                         ) : (
                           <>
                              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 mb-2 shadow-sm border border-slate-100 group-hover:text-indigo-400 transition-colors">
                                 <Upload size={24} />
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{slot.desc}</p>
                           </>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                 <Network className="text-indigo-600" size={24} />
                 <h3 className="text-lg font-black uppercase italic tracking-tight">Website Settings</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Domain Name</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600" 
                    value={infraData.domainNode} 
                    onChange={e => setInfraData({...infraData, domainNode: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Server IP</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600" 
                    value={infraData.targetIP} 
                    onChange={e => setInfraData({...infraData, targetIP: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Domain Status</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase outline-none focus:border-indigo-600"
                     value={infraData.dnsStatus}
                     onChange={e => setInfraData({...infraData, dnsStatus: e.target.value as any})}
                   >
                      <option value="PROPAGATED">Active</option>
                      <option value="PENDING">Pending Update</option>
                      <option value="ERROR">Error</option>
                   </select>
                </div>
              </div>
           </div>

           <div className="space-y-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                 <History className="text-indigo-600" size={24} />
                 <h3 className="text-lg font-black uppercase italic tracking-tight">Our Story</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Our Mission</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:border-indigo-500" value={formData.mission} onChange={e => setFormData({...formData, mission: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Our Vision</label>
                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:border-indigo-500" value={formData.vision} onChange={e => setFormData({...formData, vision: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Company History</label>
                 <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs h-40 outline-none focus:border-indigo-500 resize-none" value={formData.companyStory} onChange={e => setFormData({...formData, companyStory: e.target.value})} />
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
               <div className="flex items-center gap-8">
                  <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center overflow-hidden p-3 border border-white/10 shadow-2xl transform hover:rotate-6 transition-transform">
                     {branding.logoSquare ? (
                       <img src={branding.logoSquare} className="w-full h-full object-contain" alt="Logo" />
                     ) : (
                       <Globe size={48} className="text-indigo-600" />
                     )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                       <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{branding.businessName}</h1>
                       {isAdmin && (
                         <button onClick={() => setIsEditing(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 active:scale-90 group">
                            <Edit3 size={18} className="text-indigo-400 group-hover:text-white" />
                         </button>
                       )}
                    </div>
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-3 opacity-80 italic">About Our Company</p>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                     <Bookmark size={14} className="text-amber-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">{formData.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[8px] font-bold uppercase mr-1">
                     <Clock size={10} /> Last Updated: {new Date(formData.lastUpdated).toLocaleDateString()}
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
               <div className="p-10 bg-white/5 rounded-[2.5rem] backdrop-blur-xl border border-white/10 space-y-4 group hover:bg-white/10 transition-all hover:translate-y-[-4px]">
                  <div className="flex items-center gap-4 text-amber-400 mb-2">
                     <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20 shadow-inner">
                        <Target size={28} />
                     </div>
                     <h4 className="font-black uppercase tracking-[0.3em] text-xs">Our Vision</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed uppercase italic">{formData.vision}</p>
               </div>
               <div className="p-10 bg-white/5 rounded-[2.5rem] backdrop-blur-xl border border-white/10 space-y-4 group hover:bg-white/10 transition-all hover:translate-y-[-4px]">
                  <div className="flex items-center gap-4 text-emerald-400 mb-2">
                     <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center border border-emerald-400/20 shadow-inner">
                        <Zap size={28} />
                     </div>
                     <h4 className="font-black uppercase tracking-[0.3em] text-xs">Our Mission</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed uppercase italic">{formData.mission}</p>
               </div>
            </div>
         </div>
         <Globe className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5] pointer-events-none" size={400} />
      </div>

      {/* Dynamic Infrastructure Registry Section */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
               <Network size={20} className="text-blue-600" /> Website & App Access
            </h3>
            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
              state.settings.infrastructure.dnsStatus === 'PROPAGATED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              state.settings.infrastructure.dnsStatus === 'ERROR' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
              'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
            }`}>
              {state.settings.infrastructure.dnsStatus === 'PROPAGATED' ? 'ACTIVE' : state.settings.infrastructure.dnsStatus}
            </span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain Name</p>
                  <p className="text-base font-black text-slate-900 uppercase">{state.settings.infrastructure.domainNode}</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Server IP</p>
                  <p className="text-sm font-bold text-blue-600 font-mono">{state.settings.infrastructure.targetIP}</p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain Status</p>
                  <p className="text-base font-black text-emerald-600 uppercase">{state.settings.infrastructure.dnsStatus === 'PROPAGATED' ? 'HEALTHY' : 'PENDING'}</p>
               </div>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.settings.infrastructure.dnsStatus === 'PROPAGATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {state.settings.infrastructure.dnsStatus === 'PROPAGATED' ? <CheckCircle size={20} /> : <Mini5GMicroLoader size={20} />}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
               <History size={20} className="text-indigo-600" /> Our Story
            </h3>
            <div className="prose max-w-none relative z-10">
               <p className="text-xl font-bold text-slate-800 leading-relaxed uppercase italic">
                 {formData.companyStory}
               </p>
            </div>
            <Award className="absolute -right-8 -bottom-8 opacity-[0.02] text-indigo-900 group-hover:scale-125 transition-transform duration-1000" size={240} />
         </div>
         
         <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-10">
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-indigo-200">
                  <Star size={20} className="text-amber-400" /> Our Values
               </h3>
               <div className="space-y-5">
                  {formData.values.map((v, i) => (
                    <div key={i} className="flex items-center gap-5 bg-white/10 p-5 rounded-3xl border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                       <ShieldCheck size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                       <span className="text-[11px] font-black uppercase tracking-widest leading-none">{v}</span>
                    </div>
                  ))}
               </div>
            </div>
            <Sparkles className="absolute -right-12 -bottom-12 opacity-10" size={200} />
         </div>
      </div>

      <div className="space-y-8">
         <div className="px-6 flex justify-between items-end">
            <div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Layers size={20} className="text-blue-600" /> Our Features
               </h3>
               <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">What Makes Us Great</p>
            </div>
            <div className="h-[2px] flex-1 bg-slate-100 mx-6 mb-2"></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {formData.features.map(f => (
              <div key={f.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-2xl border border-white/5">
                    <Activity size={32}/>
                 </div>
                 <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic mb-4">{f.title}</h4>
                 <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase px-2">{f.description}</p>
                 <Layers className="absolute -right-6 -bottom-6 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] group-hover:rotate-12 transition-transform duration-700" size={120}/>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[4rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12 shadow-xl hover:shadow-2xl transition-all duration-500">
         <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center shadow-inner border border-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
               <ShieldCheck size={40}/>
            </div>
            <div>
               <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Reliable Service</h4>
               <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Trusted & Verified • Fast Connection • {formData.version}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AboutUs;

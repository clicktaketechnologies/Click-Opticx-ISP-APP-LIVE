import React, { useState, useMemo } from 'react';
import { AppState, Package, Role } from '../types';
import { db } from '../db';
import PackageCard from '../components/shared/PackageCard';
import { 
  Plus, Edit2, X, Lock, Save, Star, Info, Calculator, 
  Settings2, Activity, ShieldCheck, Gauge, Layers, 
  Trash2, PlusCircle, Timer, Zap, Globe, Package as PackageIcon, BarChart3, TrendingUp, ShieldAlert
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

const PackagesPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  
  const initialData: Partial<Package> = { 
    name: '', 
    subtitle: '', 
    speed: '', 
    uploadSpeed: '', 
    dataLimit: 'Unlimited', 
    price: 0, 
    discountPrice: undefined,
    discountExpiry: '',
    taxRate: state.settings.autoTaxPercentage, 
    duration: 30, 
    descriptionBullets: [], 
    trustTags: [], 
    isRecommended: false,
    networkFeatures: {
      gaming: false,
      streaming: true,
      secure: true,
      cloud: false
    },
    techStats: {
      ping: '≤ 20ms',
      jitter: '≤ 5ms',
      packetLoss: '< 1%',
      ipType: 'Dynamic',
      natType: 'Moderate'
    }
  };

  const [formData, setFormData] = useState<Partial<Package>>(initialData);

  const currentUserRole = state.currentUser?.role || Role.VIEWER;
  const canManagePackages = [Role.SUPER_ADMIN, Role.ADMIN].includes(currentUserRole as Role);

  const stats = useMemo(() => {
    const active = state.packages.filter(p => !p.deleted).length;
    const recommended = state.packages.filter(p => p.isRecommended).length;
    const total = state.packages.length;
    return { active, recommended, total };
  }, [state.packages]);

  const handleOpenModal = (pkg?: Package) => {
    if (!canManagePackages) return;
    if (pkg) {
      setEditingPkgId(pkg.id);
      setFormData({ 
        ...pkg,
        networkFeatures: pkg.networkFeatures || initialData.networkFeatures,
        techStats: pkg.techStats || initialData.techStats,
        descriptionBullets: pkg.descriptionBullets || [],
        trustTags: pkg.trustTags || []
      });
    } else {
      setEditingPkgId(null);
      setFormData(initialData);
    }
    setIsModalOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const handleSave = async () => {
    if (!canManagePackages || !formData.name) return;
    setIsSaving(true);
    setToast(null);
    
    const cleanData = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      taxRate: Number(formData.taxRate),
      duration: Number(formData.duration)
    };

    try {
      if (editingPkgId) {
        // Direct backend API synchronization
        const res = await fetch(`${db.backendUrl}/api/packages/${editingPkgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}` },
          body: JSON.stringify(cleanData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Backend sync failed');
        
        await db.updatePackage(editingPkgId, cleanData); // Sync local state
        setToast({ type: 'success', msg: 'Package updated successfully!' });
      } else {
        const res = await fetch(`${db.backendUrl}/api/packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}` },
          body: JSON.stringify(cleanData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Backend creation failed');

        await db.addPackage(cleanData); // Sync local state
        setToast({ type: 'success', msg: 'Package deployed successfully!' });
      }
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err: any) {
      setToast({ type: 'error', msg: `Error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const pkg = state.packages.find(p => p.id === id);
    if (!pkg) return;
    await db.updatePackage(id, { deleted: !pkg.deleted });
  };

  const updateList = (field: 'descriptionBullets' | 'trustTags', index: number, value: string) => {
    const newList = [...(formData[field] || [])];
    newList[index] = value;
    setFormData({ ...formData, [field]: newList });
  };

  const addToList = (field: 'descriptionBullets' | 'trustTags') => {
    setFormData({ ...formData, [field]: [...(formData[field] || []), ''] });
  };

  const removeFromList = (field: 'descriptionBullets' | 'trustTags', index: number) => {
    const newList = [...(formData[field] || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, [field]: newList });
  };

  const updateNested = (parent: 'networkFeatures' | 'techStats', field: string, value: any) => {
    setFormData({
      ...formData,
      [parent]: {
        ...(formData[parent] as any),
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 overflow-hidden relative pb-12 animate-in fade-in duration-500">
      {/* 1. Header Zone */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1 shrink-0">
        <div>
           <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-4">
             <Layers className="text-indigo-600" size={28} />
             Connectivity Catalog
           </h2>
           <p className="text-[clamp(0.5rem,2vw,0.6rem)] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic border-l-2 border-indigo-500 pl-3">
             Configure retail protocols & high-performance network tiers
           </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
          {canManagePackages ? (
            <button 
              onClick={() => handleOpenModal()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Deploy New Plan</span>
            </button>
          ) : (
            <div className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black flex items-center gap-2 border border-slate-200 uppercase tracking-widest italic">
               <Lock size={12} /> Read-Only Access
            </div>
          )}
        </div>
      </div>

      {/* 2. Catalog Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         {[
           { label: 'Total Inventory', count: stats.total, icon: PackageIcon, grad: 'var(--grad-primary)', sub: 'Cumulative Tiers' },
           { label: 'Live on Store', count: stats.active, icon: Globe, grad: 'var(--grad-success)', sub: 'Active Nodes' },
           { label: 'Featured Plans', count: stats.recommended, icon: Star, grad: 'var(--grad-warning)', sub: 'Pinned High-Value' },
           { label: 'Archived Tiers', count: stats.total - stats.active, icon: Trash2, grad: 'var(--grad-violet)', sub: 'Decommissioned' },
         ].map((kpi, idx) => (
           <div key={idx} className="card relative transition-all overflow-hidden border-none shadow-2xl p-6 group hover:scale-[1.02] active:scale-95" style={{ backgroundImage: kpi.grad }}>
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 text-white flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{kpi.label}</p>
                 <div className="p-2 rounded-xl bg-white/25 backdrop-blur-md">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
               </div>
               <h3 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black italic tracking-tighter leading-none">{kpi.count}</h3>
               <p className="text-[9px] font-black uppercase opacity-70 mt-1 tracking-widest">{kpi.sub}</p>
             </div>
          </div>
         ))}
      </div>

      {/* 3. Package Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-8">
          {state.packages.map(pkg => (
            <PackageCard 
              key={pkg.id}
              pkg={pkg}
              mode="admin"
              currency={state.settings.currency}
              onAction={() => {}}
              onEdit={handleOpenModal}
              onToggleStatus={handleToggleStatus}
            />
          ))}
          {canManagePackages && (
            <button 
              onClick={() => handleOpenModal()}
              className="min-h-[400px] border-4 border-dashed border-slate-100 rounded-[3rem] group hover:border-indigo-200 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-6"
            >
               <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <Plus size={40} strokeWidth={2.5} />
               </div>
               <div className="text-center">
                  <p className="text-lg font-black text-slate-300 group-hover:text-indigo-600 uppercase italic tracking-tighter transition-colors">Architect New Plan</p>
                  <p className="text-[10px] text-slate-200 font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Select nodes to begin</p>
               </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. Package Architect Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPkgId ? 'SERVICE RECONFIGURATION' : 'PACKAGE ARCHITECT'}
        maxWidth="max-w-4xl"
        scrollable
      >
        <div className="space-y-12 p-2">
          {/* Section 1: Basic Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Settings2 size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Core Identity Registry</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">General plan identifiers and labels</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Plan Master Name</label>
                <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. ULTRA_GIGA_X" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Marketing Lead Subtext</label>
                <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Maximum Performance Node" />
              </div>

              {/* Revealed Hidden Fields */}
              <div className="space-y-2 flex flex-col justify-center">
                 <label className="flex items-center gap-3 ml-4 cursor-pointer">
                    <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${formData.isRecommended ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.isRecommended ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Recommended Plan</span>
                 </label>
              </div>
              
              <div className="space-y-2 flex flex-col justify-center">
                 <label className="flex items-center gap-3 ml-4 cursor-pointer">
                    <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${(formData as any).autoRenew !== false ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${(formData as any).autoRenew !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Auto-Renew</span>
                 </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Visibility</label>
                <select className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900 focus:border-indigo-600 transition-all shadow-inner" value={(formData as any).visibility || 'Public'} onChange={e => setFormData({...formData, visibility: e.target.value} as any)}>
                   <option value="Public">Public (Storefront)</option>
                   <option value="Hidden">Hidden (Direct Link Only)</option>
                   <option value="Admin">Admin Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Bandwidth Cap</label>
                <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200" value={(formData as any).bandwidthCap || ''} onChange={e => setFormData({...formData, bandwidthCap: e.target.value} as any)} placeholder="e.g. 1TB (Leave empty for unmetered)" />
              </div>
            </div>
          </div>

          {/* Section 2: Technical Performance */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Gauge size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Technical Spec Handshake</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Throughput, latency, and node grade</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Download Rate</label>
                  <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} placeholder="100 Mbps" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Upload Rate</label>
                  <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900" value={formData.uploadSpeed} onChange={e => setFormData({...formData, uploadSpeed: e.target.value})} placeholder="50 Mbps" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Data Quota</label>
                  <input type="text" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900" value={formData.dataLimit} onChange={e => setFormData({...formData, dataLimit: e.target.value})} placeholder="Unlimited" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Duration Cycle (Days)</label>
                  <input type="number" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-200/50">
                {[
                  { label: 'Latency', field: 'ping' },
                  { label: 'Jitter', field: 'jitter' },
                  { label: 'Packet Loss', field: 'packetLoss' },
                  { label: 'IP Mode', field: 'ipType', type: 'select', opts: ['Dynamic', 'Static'] },
                  { label: 'NAT Type', field: 'natType', type: 'select', opts: ['Open', 'Moderate', 'Strict'] },
                ].map(stat => (
                  <div key={stat.field} className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">{stat.label}</label>
                    {stat.type === 'select' ? (
                       <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase outline-none focus:border-indigo-600 transition-all text-slate-900" 
                        value={(formData.techStats as any)?.[stat.field]} 
                        onChange={e => updateNested('techStats', stat.field, e.target.value)}>
                        {stat.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-4 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase outline-none focus:border-indigo-600 transition-all text-slate-900" 
                        value={(formData.techStats as any)?.[stat.field]} 
                        onChange={e => updateNested('techStats', stat.field, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Policy */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Calculator size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Commercial Engine</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pricing, promos, and fiscal variables</p>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Base SRP</label>
                <input type="number" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900 focus:border-emerald-500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Promo SRP</label>
                <input type="number" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-rose-500 focus:border-rose-500" value={formData.discountPrice || ''} onChange={e => setFormData({...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Exp Date</label>
                <input type="datetime-local" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-[10px] text-slate-400 focus:border-indigo-500" value={formData.discountExpiry ? new Date(formData.discountExpiry).toISOString().slice(0, 16) : ''} onChange={e => setFormData({...formData, discountExpiry: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Tax Weight %</label>
                <input type="number" className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] outline-none font-black text-slate-900" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
              </div>
            </div>
          </div>

          {toast && (
             <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-black uppercase tracking-widest ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                {toast.type === 'error' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                {toast.msg}
             </div>
          )}

          <div className="flex gap-4 pt-6">
             <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest transition-all"
             >
                Cancel
             </button>
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] py-6 flex justify-center items-center gap-3 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:bg-black active:scale-95 disabled:opacity-50"
             >
                {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                {editingPkgId ? 'Save Package Updates' : '➕ Add New Plan'}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PackagesPage;

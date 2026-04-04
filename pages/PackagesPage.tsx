
import React, { useState } from 'react';
import { AppState, Package, Role } from '../types';
import { db } from '../db';
import PackageCard from '../components/shared/PackageCard';
import { 
  Plus, Edit2, X, Lock, Save, Star, Info, Calculator, 
  Settings2, Activity, ShieldCheck, Gauge, Layers, 
  Trash2, PlusCircle, Timer, Zap, Globe
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

  const handleOpenModal = (pkg?: Package) => {
    if (!canManagePackages) return;
    if (pkg) {
      setEditingPkgId(pkg.id);
      setFormData({ 
        ...pkg,
        // Ensure nested objects exist to avoid uncontrolled inputs
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

  const handleSave = async () => {
    if (!canManagePackages || !formData.name) return;
    
    // Ensure numeric fields are numbers
    const cleanData = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      taxRate: Number(formData.taxRate),
      duration: Number(formData.duration)
    };

    if (editingPkgId) {
      await db.updatePackage(editingPkgId, cleanData);
    } else {
      await db.addPackage(cleanData);
    }
    setIsModalOpen(false);
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catalog Management</h2>
          <p className="text-slate-500 font-medium italic">Configure retail protocols and technical node specifications.</p>
        </div>
        {canManagePackages ? (
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.25rem] text-[11px] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 uppercase tracking-[0.2em]"
          >
            <Plus size={20} />
            Provision Package
          </button>
        ) : (
          <div className="px-5 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-black flex items-center gap-2 border border-slate-200 uppercase tracking-widest"><Lock size={16} />AUTHORIZED VIEW ONLY</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPkgId ? 'Edit Package' : 'Package Architect'}
        type="form"
        maxWidth="max-w-4xl"
        scrollable
        onConfirm={handleSave}
        confirmLabel={editingPkgId ? 'Save Changes' : 'Authorize Deployment'}
        cancelLabel="Abort Process"
      >
        <div className="space-y-8">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
              <Activity size={16} className="text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">1. Identity</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Identifier (Name)</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white focus:border-blue-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Home Ultra 100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketing Subtitle</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white focus:border-blue-500 transition-all" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Best for 4K Streaming" />
              </div>
            </div>
          </div>

          {/* Section 2: Technical Performance */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
              <Gauge size={16} className="text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">2. Technical Specification</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Download</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} placeholder="100 Mbps" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.uploadSpeed} onChange={e => setFormData({...formData, uploadSpeed: e.target.value})} placeholder="50 Mbps" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Volume</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.dataLimit} onChange={e => setFormData({...formData, dataLimit: e.target.value})} placeholder="Unlimited" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (Days)</label>
                <input type="number" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none" value={formData.techStats?.ping} onChange={e => updateNested('techStats', 'ping', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jitter</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none" value={formData.techStats?.jitter} onChange={e => updateNested('techStats', 'jitter', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loss %</label>
                <input type="text" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none" value={formData.techStats?.packetLoss} onChange={e => updateNested('techStats', 'packetLoss', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Protocol</label>
                <select className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl font-black text-white text-[10px] uppercase outline-none" value={formData.techStats?.ipType} onChange={e => updateNested('techStats', 'ipType', e.target.value)}>
                  <option value="Dynamic">Dynamic</option><option value="Static">Static</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NAT Grade</label>
                <select className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl font-black text-white text-[10px] uppercase outline-none" value={formData.techStats?.natType} onChange={e => updateNested('techStats', 'natType', e.target.value)}>
                  <option value="Open">Open</option><option value="Moderate">Moderate</option><option value="Strict">Strict</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Policy */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
              <Calculator size={16} className="text-emerald-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">3. Commercial Framework</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Price</label>
                <input type="number" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promo Price (Opt)</label>
                <input type="number" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-rose-400" value={formData.discountPrice || ''} onChange={e => setFormData({...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promo Expiry</label>
                <input type="datetime-local" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-bold text-slate-300 text-xs" value={formData.discountExpiry ? new Date(formData.discountExpiry).toISOString().slice(0, 16) : ''} onChange={e => setFormData({...formData, discountExpiry: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{state.settings.taxLabel || 'Tax'} %</label>
                <input type="number" className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl outline-none font-black text-white" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
              </div>
            </div>
          </div>

          {/* Section 4: Marketing Assets */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
              <Star size={16} className="text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">4. Marketing Presence</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Value Points</label>
                  <button onClick={() => addToList('descriptionBullets')} className="p-1 text-blue-400 hover:bg-blue-900/40 rounded-lg transition-all"><PlusCircle size={16} /></button>
                </div>
                <div className="space-y-2">
                  {formData.descriptionBullets?.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" className="flex-1 p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none" value={bullet} onChange={e => updateList('descriptionBullets', idx, e.target.value)} placeholder="Feature description..." />
                      <button onClick={() => removeFromList('descriptionBullets', idx)} className="p-3 text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Tags</label>
                  <button onClick={() => addToList('trustTags')} className="p-1 text-emerald-400 hover:bg-emerald-900/40 rounded-lg transition-all"><PlusCircle size={16} /></button>
                </div>
                <div className="space-y-2">
                  {formData.trustTags?.map((tag, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" className="flex-1 p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none" value={tag} onChange={e => updateList('trustTags', idx, e.target.value)} placeholder="e.g. 99.9% Uptime" />
                      <button onClick={() => removeFromList('trustTags', idx)} className="p-3 text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              {[
                { id: 'gaming', label: 'Pro Gaming', icon: Zap },
                { id: 'streaming', label: '4K Stream', icon: Globe },
                { id: 'secure', label: 'Secure Link', icon: ShieldCheck },
                { id: 'cloud', label: 'Cloud Node', icon: Layers }
              ].map(feat => (
                <button key={feat.id} onClick={() => updateNested('networkFeatures', feat.id, !(formData.networkFeatures as any)[feat.id])}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${ (formData.networkFeatures as any)[feat.id] ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/60 border-slate-700 text-slate-500' }`}>
                  <feat.icon size={18} />
                  <span className="text-[9px] font-black uppercase">{feat.label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.isRecommended ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Star size={20} fill={formData.isRecommended ? "currentColor" : "none"} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-400 uppercase">System Recommendation</h4>
                  <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Pinned status with visual ribbon on app dashboard.</p>
                </div>
              </div>
              <button onClick={() => setFormData({...formData, isRecommended: !formData.isRecommended})}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.isRecommended ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                {formData.isRecommended ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PackagesPage;

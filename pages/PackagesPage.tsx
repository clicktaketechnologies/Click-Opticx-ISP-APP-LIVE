
import React, { useState } from 'react';
import { AppState, Package, Role } from '../types';
import { db } from '../db';
import PackageCard from '../components/shared/PackageCard';
import { 
  Plus, Edit2, X, Lock, Save, Star, Info, Calculator, 
  Settings2, Activity, ShieldCheck, Gauge, Layers, 
  Trash2, PlusCircle, Timer, Zap, Globe
} from 'lucide-react';

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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Package Architect</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-[0.3em] flex items-center gap-2">
                  <Calculator size={12} className="text-blue-500" /> Defining Distribution Node
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-red-50 rounded-2xl transition-all text-slate-400 hover:text-red-600"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {/* Section 1: Basic Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <Activity size={18} className="text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">1. Identity</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Identifier (Name)</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 focus:border-blue-500 focus:bg-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Home Ultra 100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marketing Subtitle</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 focus:border-blue-500 focus:bg-white transition-all" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="e.g. Best for 4K Streaming" />
                  </div>
                </div>
              </div>

              {/* Section 2: Technical Performance */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <Gauge size={18} className="text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">2. Technical Specification</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Download (string)</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} placeholder="100 Mbps" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload (string)</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800" value={formData.uploadSpeed} onChange={e => setFormData({...formData, uploadSpeed: e.target.value})} placeholder="50 Mbps" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Volume</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800" value={formData.dataLimit} onChange={e => setFormData({...formData, dataLimit: e.target.value})} placeholder="Unlimited" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latency</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={formData.techStats?.ping} onChange={e => updateNested('techStats', 'ping', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jitter</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={formData.techStats?.jitter} onChange={e => updateNested('techStats', 'jitter', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loss %</label>
                    <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" value={formData.techStats?.packetLoss} onChange={e => updateNested('techStats', 'packetLoss', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IP Protocol</label>
                    <select className="w-full p-3 bg-slate-50 border rounded-xl font-black text-[10px] uppercase" value={formData.techStats?.ipType} onChange={e => updateNested('techStats', 'ipType', e.target.value)}>
                      <option value="Dynamic">Dynamic</option>
                      <option value="Static">Static</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NAT Grade</label>
                    <select className="w-full p-3 bg-slate-50 border rounded-xl font-black text-[10px] uppercase" value={formData.techStats?.natType} onChange={e => updateNested('techStats', 'natType', e.target.value)}>
                      <option value="Open">Open</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Strict">Strict</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Commercial Policy */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <Calculator size={18} className="text-green-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">3. Commercial Framework</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Price</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Promo Price (Opt)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-rose-600" value={formData.discountPrice || ''} onChange={e => setFormData({...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Promo Expiry (ISO)</label>
                    <input type="datetime-local" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={formData.discountExpiry ? new Date(formData.discountExpiry).toISOString().slice(0, 16) : ''} onChange={e => setFormData({...formData, discountExpiry: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{state.settings.taxLabel || 'Tax'} %</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-700" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Section 4: Marketing Assets */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <Star size={18} className="text-amber-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">4. Marketing Presence</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bullets */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Core Value Points</label>
                      <button onClick={() => addToList('descriptionBullets')} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><PlusCircle size={18} /></button>
                    </div>
                    <div className="space-y-2">
                      {formData.descriptionBullets?.map((bullet, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={bullet} onChange={e => updateList('descriptionBullets', idx, e.target.value)} placeholder="Feature description..." />
                          <button onClick={() => removeFromList('descriptionBullets', idx)} className="p-3 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Trust Tags */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trust Tags</label>
                      <button onClick={() => addToList('trustTags')} className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-all"><PlusCircle size={18} /></button>
                    </div>
                    <div className="space-y-2">
                      {formData.trustTags?.map((tag, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-bold" value={tag} onChange={e => updateList('trustTags', idx, e.target.value)} placeholder="e.g. 99.9% Uptime" />
                          <button onClick={() => removeFromList('trustTags', idx)} className="p-3 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   {[
                     { id: 'gaming', label: 'Pro Gaming', icon: Zap },
                     { id: 'streaming', label: '4K Stream', icon: Globe },
                     { id: 'secure', label: 'Secure Link', icon: ShieldCheck },
                     { id: 'cloud', label: 'Cloud Node', icon: Layers }
                   ].map(feat => (
                     <button 
                       key={feat.id}
                       onClick={() => updateNested('networkFeatures', feat.id, !(formData.networkFeatures as any)[feat.id])}
                       className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${ (formData.networkFeatures as any)[feat.id] ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400' }`}
                     >
                        <feat.icon size={20} />
                        <span className="text-[9px] font-black uppercase">{feat.label}</span>
                     </button>
                   ))}
                </div>

                <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${formData.isRecommended ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                         <Star size={24} fill={formData.isRecommended ? "currentColor" : "none"} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-amber-900 uppercase">System Recommendation</h4>
                         <p className="text-[9px] text-amber-700 font-bold uppercase tracking-widest opacity-80">Pinned status with visual ribbon on app dashboard.</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => setFormData({...formData, isRecommended: !formData.isRecommended})}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${formData.isRecommended ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border border-amber-200'}`}
                   >
                     {formData.isRecommended ? 'ON' : 'OFF'}
                   </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all uppercase tracking-[0.2em] text-[10px]">Abort Process</button>
              <button onClick={handleSave} className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95"><Save size={20} /> Authorize Deployment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;


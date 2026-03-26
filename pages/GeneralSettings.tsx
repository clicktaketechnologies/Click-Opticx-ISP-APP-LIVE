import React, { useState } from 'react';
import { AppState, SystemSettings, TechnicalConfig } from '../types';
import { db } from '../db';
import {
  Settings, Building2, Save, Info, Lock, Database,
  CreditCard, ChevronRight, Banknote, Globe, Wifi, Cpu,
  Layers, Zap, Smartphone, Plus, Trash2, Edit3, CheckCircle, Flame
} from 'lucide-react';
import ModuleGuide from '../components/shared/ModuleGuide';

const GeneralSettings: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'business' | 'security' | 'gateways' | 'tech'>('business');
  const [formData, setFormData] = useState<SystemSettings>(state.settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await db.updateSettings(formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Configuration Saved', 'System rules and pricing have been successfully updated.');
    }, 800);
  };

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'gateways', label: 'Payment Methods', icon: CreditCard },
    { id: 'tech', label: 'Installation Pricing', icon: Wifi },
    { id: 'security', label: 'Security & Access', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ModuleGuide
        moduleName="System Settings"
        description="Manage infrastructure costs, payment methods, and core system rules."
        items={[
          { title: "Business Info", description: "Manage brand identity, business names, and tax identifiers for official documents." },
          { title: "Installation Pricing", description: "Define material pricing for CAT6 and Fiber infrastructure to automate deployment estimates." },
          { title: "Payment Methods", description: "Enable or disable physical and digital payment options for your customers." }
        ]}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Settings className="text-blue-600" size={32} />
            System Settings
          </h2>
          <p className="text-slate-500 font-medium">Manage infrastructure costs, payment methods, and core system rules.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-50">
          {isSaving ? 'Updating...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col gap-1.5 sticky top-24">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4"><tab.icon size={18} /> {tab.label}</div>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl min-h-[600px] p-10">

            {/* Business Tab */}
            {activeTab === 'business' && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Building2 className="text-blue-500" size={32} /> Business Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Business Name</label><input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg" value={formData.branding.businessName} onChange={e => setFormData({ ...formData, branding: { ...formData.branding, businessName: e.target.value } })} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Tax / Registration ID</label><input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg" value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} /></div>
                </div>
              </div>
            )}

            {/* Technical Config Tab */}
            {activeTab === 'tech' && (
              <div className="space-y-12 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Wifi className="text-indigo-600" size={32} /> Installation Pricing</h3>
                </div>

                {/* Wireless Config */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Zap className="text-amber-500" size={20} />
                    <h4 className="text-sm font-black uppercase tracking-widest">Wireless (WiFi) Parts Pricing</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CAT6 Cable (per meter)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border rounded-xl font-black" value={formData.techConfig.wireless.cat6PricePerMeter} onChange={e => setFormData({ ...formData, techConfig: { ...formData.techConfig, wireless: { ...formData.techConfig.wireless, cat6PricePerMeter: Number(e.target.value) } } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cable Clips (per unit)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border rounded-xl font-black" value={formData.techConfig.wireless.clipPrice} onChange={e => setFormData({ ...formData, techConfig: { ...formData.techConfig, wireless: { ...formData.techConfig.wireless, clipPrice: Number(e.target.value) } } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raval Bold (per pair)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border rounded-xl font-black" value={formData.techConfig.wireless.ravalBoldPricePerPair} onChange={e => setFormData({ ...formData, techConfig: { ...formData.techConfig, wireless: { ...formData.techConfig.wireless, ravalBoldPricePerPair: Number(e.target.value) } } })} />
                    </div>
                  </div>
                </div>

                {/* Fiber Config */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Flame className="text-blue-500" size={20} />
                    <h4 className="text-sm font-black uppercase tracking-widest">Fiber Optic Parts Pricing</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fiber Cable (per meter)</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border rounded-xl font-black" value={formData.techConfig.fiber.wirePricePerMeter} onChange={e => setFormData({ ...formData, techConfig: { ...formData.techConfig, fiber: { ...formData.techConfig.fiber, wirePricePerMeter: Number(e.target.value) } } })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Standard Installation Fee</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border rounded-xl font-black" value={formData.techConfig.fiber.baseInstallation} onChange={e => setFormData({ ...formData, techConfig: { ...formData.techConfig, fiber: { ...formData.techConfig.fiber, baseInstallation: Number(e.target.value) } } })} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Tab */}
            {activeTab === 'gateways' && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><CreditCard className="text-indigo-500" size={32} /> Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(() => {
                    const cashGateway = formData.paymentGateways.find(g => g.id === 'cash');
                    const isCashEnabled = cashGateway?.enabled || false;
                    return (
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isCashEnabled ? 'bg-emerald-600' : 'bg-slate-400'}`}><Banknote size={24} /></div>
                            <span className="font-black text-slate-900 uppercase tracking-widest">Cash Payments</span>
                          </div>
                          <button
                            onClick={() => {
                              const nextGateways = formData.paymentGateways.map(g =>
                                g.id === 'cash' ? { ...g, enabled: !g.enabled } : g
                              );
                              setFormData({ ...formData, paymentGateways: nextGateways });
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isCashEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                          >
                            {isCashEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">Allow users to pay with cash at your office or authorized shops.</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;

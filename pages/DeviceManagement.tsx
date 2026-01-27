
import React, { useState } from 'react';
import { db } from '../db';
import { AppState, Device } from '../types';
import { 
  HardDrive, Plus, Search, RefreshCw, X, Save, 
  Trash2, Server, ShieldCheck, Cpu, Globe, Power, 
  ShieldAlert, Activity, Hash, Layers, Signal, Key,
  CheckCircle, Loader2, AlertCircle, Laptop, Zap, Settings2
} from 'lucide-react';

const DeviceManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<Partial<Device> | null>(null);

  const [formData, setFormData] = useState<Partial<Device>>({
    name: '',
    type: 'MikroTik',
    ip: '',
    username: 'admin'
  });

  const filteredDevices = state.devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ip.includes(searchTerm)
  );

  const handleOpenModal = (dev?: Device) => {
    if (dev) {
      setEditingDevice(dev);
      setFormData(dev);
    } else {
      setEditingDevice(null);
      setFormData({ name: '', type: 'MikroTik', ip: '', username: 'admin' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ip) return;

    if (editingDevice) {
      await db.updateDevice(editingDevice.id!, formData);
    } else {
      await db.addDevice(formData);
    }
    setIsModalOpen(false);
  };

  const handleTestConnection = async (id: string) => {
    setIsProcessing(id);
    await db.testDeviceConnection(id);
    setIsProcessing(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently purge this physical node from the registry?")) {
      await db.deleteDevice(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <HardDrive className="text-blue-600" size={32} />
            Infrastructure Registry
          </h2>
          <p className="text-slate-500 font-medium mt-1">Management node for MikroTik BRAS and VSOL OLT devices.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> Provision Physical Node
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Audit nodes by Label or IP Address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredDevices.map(dev => (
           <div key={dev.id} className={`bg-white rounded-[3rem] p-8 border-2 transition-all hover:shadow-xl group relative overflow-hidden flex flex-col ${dev.status === 'Connected' ? 'border-emerald-100' : 'border-rose-100 grayscale opacity-80'}`}>
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${dev.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {dev.type === 'MikroTik' ? <Signal size={28}/> : <Layers size={28}/>}
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${dev.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-rose-50 text-rose-600'}`}>
                       {dev.status}
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Seen: {new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
              </div>

              <div className="space-y-1 mb-8 relative z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">{dev.name}</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{dev.type} Protocol • {dev.ip}</p>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 relative z-10">
                 <button 
                  onClick={() => handleTestConnection(dev.id)}
                  disabled={isProcessing === dev.id}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                 >
                    {isProcessing === dev.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Test Link
                 </button>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(dev)} className="flex-1 py-3.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100 flex items-center justify-center">
                       <Settings2 size={16}/>
                    </button>
                    <button onClick={() => handleDelete(dev.id)} className="flex-1 py-3.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100 flex items-center justify-center">
                       <Trash2 size={16}/>
                    </button>
                 </div>
              </div>
              <Activity className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.7] transition-transform duration-500" size={180} />
           </div>
         ))}

         {filteredDevices.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
              <ShieldAlert className="text-slate-100 mb-8" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Registry Node Empty</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No devices matching search parameters.</p>
           </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">{editingDevice ? 'Modify Node' : 'Provision Node'}</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hardware Handshake Interface</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Node Alias (Label)</label>
                       <input 
                         className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none focus:border-emerald-600 transition-all text-slate-900 shadow-inner"
                         placeholder="e.g. CORE-BRAS-01"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         required
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Physical Architecture</label>
                          <select 
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:border-emerald-600"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                          >
                             <option value="MikroTik">MikroTik (RouterOS)</option>
                             <option value="VSOL_OLT">VSOL (EPON/GPON OLT)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Internal IP Node</label>
                          <input 
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-emerald-600"
                            placeholder="192.168.X.X"
                            value={formData.ip}
                            onChange={e => setFormData({...formData, ip: e.target.value})}
                            required
                          />
                       </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
                       <div className="flex items-center gap-3 text-blue-400">
                          <Key size={18} />
                          <h4 className="text-xs font-black uppercase tracking-widest italic">Communication Secret</h4>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Username</label>
                             <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white text-[10px] uppercase outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Secret</label>
                             <input type="password" placeholder="••••••••" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs outline-none" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                    <ShieldAlert className="text-blue-600 mt-1 shrink-0" size={24} />
                    <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed">
                       Direct Node Sync: Ensure the backend gateway IP is whitelisted in the device firewall registry before deploying.
                    </p>
                 </div>
              </form>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort</button>
                 <button 
                   onClick={handleSave}
                   className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <ShieldCheck size={18}/> Authorize Provisioning
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;

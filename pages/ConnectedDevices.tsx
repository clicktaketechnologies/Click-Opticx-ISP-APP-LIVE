
import React, { useState } from 'react';
import { db } from '../db';
import { ISPUser, ConnectedDevice } from '../types';
import { 
  Smartphone, Monitor, Tablet, Wifi, Shield, 
  Trash2, Edit3, CheckCircle, Ban, X, Globe, SignalHigh
} from 'lucide-react';

const ConnectedDevices: React.FC<{ user: ISPUser }> = ({ user }) => {
  const [devices, setDevices] = useState<ConnectedDevice[]>(db.getConnectedDevices(user.id));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleBlock = async (id: string) => {
    if (confirm("MANDATORY CLEARANCE: Block this MAC identity from the local gateway?")) {
      await db.blockDevice(user.id, id);
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isBlocked: !d.isBlocked } : d));
    }
  };

  const handleRename = async (id: string) => {
    if (!tempName.trim()) return;
    await db.renameDevice(user.id, id, tempName);
    setDevices(prev => prev.map(d => d.id === id ? { ...d, name: tempName } : d));
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="px-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Device Registry</h2>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">Active MAC identities on your node</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map(dev => (
          <div key={dev.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all group ${dev.isBlocked ? 'border-rose-100 bg-rose-50/20' : 'border-slate-50 hover:border-indigo-100 hover:shadow-xl shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border transition-all ${dev.isBlocked ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-white'}`}>
                  {dev.name.toLowerCase().includes('phone') ? <Smartphone size={28} /> : dev.name.toLowerCase().includes('tv') ? <Monitor size={28} /> : <Tablet size={28} />}
                </div>
                <div>
                  {editingId === dev.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500/10"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleRename(dev.id)} className="p-2 bg-emerald-600 text-white rounded-lg"><CheckCircle size={14}/></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-lg"><X size={14}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">{dev.name}</h4>
                      <button onClick={() => { setEditingId(dev.id); setTempName(dev.name); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={14}/></button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{dev.mac} • {dev.ip}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                  <SignalHigh size={12} />
                  {dev.signal} dBm
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Uptime: {dev.duration}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Consumed</p>
                  <p className="text-sm font-black text-slate-800">{dev.usageToday} GB</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${dev.isBlocked ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    {dev.isBlocked ? 'Blocked' : 'Active'}
                  </span>
               </div>
            </div>

            <div className="mt-6 flex gap-3">
               <button 
                 onClick={() => handleBlock(dev.id)}
                 className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 ${dev.isBlocked ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
               >
                  {dev.isBlocked ? <Shield size={14}/> : <Ban size={14}/>}
                  {dev.isBlocked ? 'Authorize Access' : 'Restrict Node'}
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex items-center justify-between">
            <div>
               <h4 className="text-xl font-black italic uppercase tracking-tighter">Guest Protocol</h4>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Current Active Link Capacity: 10 Devices</p>
            </div>
            <div className="px-5 py-2 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-400 shadow-xl">
               8 Available
            </div>
         </div>
         <Wifi className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={140} />
      </div>
    </div>
  );
};

export default ConnectedDevices;

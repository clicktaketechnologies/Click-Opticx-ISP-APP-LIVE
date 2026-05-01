
import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../db';
import { AppState, UserStatus, ConnectionStatus } from '../types';
import { 
  Monitor, Activity, Globe, Download, Upload, 
  Search, Filter, ChevronRight, UserCircle, RotateCw, 
  Smartphone, HardDrive, Wifi, ShieldCheck, AlertCircle
} from 'lucide-react';

const AdminLiveMonitoring: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const activeUsers = useMemo(() => {
    return state.users.filter(u => 
      !u.deleted && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.connectionId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.users, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Monitor className="text-blue-600" size={32} />
            NOC Operational Pulse
          </h2>
          <p className="text-slate-500 font-medium">Real-time telemetry and handshake audit for all active Subscribers.</p>
        </div>
        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase text-slate-700">Real-time Stream: ACTIVE</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Search active nodes by Name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all">
            <RotateCw size={24} />
         </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1200px]">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Speed</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Devices</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Today Usage</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {activeUsers.map(u => {
                    const usage = db.getLiveUsage(u.id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-sm relative">
                                 <UserCircle size={24}/>
                                 <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${u.status === UserStatus.ACTIVE ? 'bg-green-500' : 'bg-rose-500'}`}></div>
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 uppercase text-sm leading-none mb-1">{u.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.connectionId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${u.connectionType === 'Fiber' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              {u.connectionType === 'Fiber' ? <HardDrive size={12}/> : <Wifi size={12}/>}
                              {u.connectionType}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                 <Download size={14} className="text-blue-500"/>
                                 <span className="text-xs font-black text-slate-700 italic">{usage.down} Mbps</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Upload size={14} className="text-green-500"/>
                                 <span className="text-xs font-black text-slate-700 italic">{usage.up} Mbps</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 font-black text-slate-900">
                           <div className="flex items-center gap-2">
                              <Smartphone size={16} className="text-slate-400"/>
                              <span>{db.getConnectedDevices(u.id).length} Connected</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 font-black text-slate-900">
                           <div className="flex items-center gap-2">
                              <Activity size={16} className="text-blue-500"/>
                              <span>{usage.usageToday} GB</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all">
                              <ChevronRight size={18}/>
                           </button>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AdminLiveMonitoring;


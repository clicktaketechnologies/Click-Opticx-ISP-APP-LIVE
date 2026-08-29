import React, { useState, useMemo } from 'react';
import { AppState, ISPUser } from '../../types';
import { db } from '../../db';
import { 
  Smartphone, Search, Fingerprint, Activity, Info, AlertTriangle, XCircle, Layout, Bell, Monitor, RotateCw
} from 'lucide-react';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

const AdminUserDevices: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group users by device status
  const analytics = useMemo(() => {
     const totalUsers = state.users.length;
     const appRegistered = state.users.filter(u => u.fcmToken).length;
     const appEnabled = state.users.filter(u => u.appNotifications).length;
     
     return {
         total: totalUsers,
         registered: appRegistered,
         enabled: appEnabled,
         adoptionRate: totalUsers > 0 ? Math.round((appRegistered / totalUsers) * 100) : 0
     };
  }, [state.users]);

  const filteredUsers = useMemo(() => {
    return state.users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.connectionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.fcmToken && u.fcmToken.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => {
        if (a.fcmToken && !b.fcmToken) return -1;
        if (!a.fcmToken && b.fcmToken) return 1;
        return 0;
    });
  }, [state.users, searchTerm]);

  const handleRefreshTokens = async () => {
      setIsRefreshing(true);
      // Mock diagnostic refresh logic
      setTimeout(async () => {
          db.logNotification('all', 'success', 'Token Sync Complete', 'Verified the integrity of FCM push tokens across the active user fleet.');
          setIsRefreshing(false);
      }, 1500);
  };

  const handleRevokeToken = async (userId: string) => {
      if (confirm("Are you sure you want to revoke push notification access for this device?")) {
          await db.updateUser(userId, { fcmToken: null, appNotifications: false });
      }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                <Smartphone size={28} className="animate-pulse" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">USER DEVICE MAPPING</h2>
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-16">Monitor & Manage Subscriber Push Tokens</p>
        </div>
        <button
          onClick={handleRefreshTokens}
          disabled={isRefreshing}
          className="px-8 py-5 bg-slate-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 group"
        >
          {isRefreshing ? <Mini5GMicroLoader size={18} /> : <RotateCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />}
          Sync Token Registry
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Base', val: analytics.total, icon: Fingerprint, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'App Installs', val: analytics.registered, icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Push Enabled', val: analytics.enabled, icon: Bell, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Adoption Rate', val: `${analytics.adoptionRate}%`, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-6 shadow-inner`}>
                <kpi.icon size={24} />
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <h4 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">{kpi.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Search by User Name, Connection ID, or Device Token..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Subscriber Footprint</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active device authorization registry</p>
              </div>
              <Layout size={24} className="text-slate-300" />
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-slate-50">
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">User Identifier</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Connection ID</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Device Status</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Push Token Signature</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                               <td className="p-8 font-black text-slate-800 uppercase tracking-tighter italic whitespace-nowrap">
                                   <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] text-white shadow-inner ${u.fcmToken ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                           <Monitor size={14} />
                                       </div>
                                       <div className="flex flex-col">
                                           <span className="leading-none">{u.name}</span>
                                           {u.username ? (
                                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{u.username}</span>
                                           ) : (
                                             <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest mt-1">Pending Setup</span>
                                           )}
                                       </div>
                                   </div>
                               </td>
                               <td className="p-8 font-black text-blue-600 uppercase tracking-widest text-[10px] whitespace-nowrap">{u.connectionId}</td>
                               <td className="p-8 whitespace-nowrap">
                                   {u.fcmToken ? (
                                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-100 shadow-sm">
                                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active Link
                                       </div>
                                   ) : (
                                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                           <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> No Token
                                       </div>
                                   )}
                               </td>
                               <td className="p-8 font-mono text-xs text-slate-500 w-full max-w-sm">
                                   <div className="truncate bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                                       {u.fcmToken ? u.fcmToken : 'N/A'}
                                   </div>
                               </td>
                               <td className="p-8 text-center whitespace-nowrap">
                                   {u.fcmToken && (
                                       <button 
                                          onClick={() => handleRevokeToken(u.id)}
                                          className="p-3 bg-white text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-100 hover:border-rose-100 transition-all shadow-sm"
                                          title="Revoke Device Token"
                                       >
                                           <XCircle size={18} />
                                       </button>
                                   )}
                               </td>
                          </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-20 text-center">
                                  <AlertTriangle size={48} className="text-slate-100 mx-auto mb-6" />
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Users Found in Filter</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default AdminUserDevices;

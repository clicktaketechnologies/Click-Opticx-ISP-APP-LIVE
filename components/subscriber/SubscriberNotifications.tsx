
import React, { useMemo } from 'react';
import { AppState, ISPUser, SystemNotification } from '../../types';
import { Bell, Receipt, Wifi, User, ShieldAlert, Clock, CheckCircle, Trash2, ListChecks } from 'lucide-react';
import { db } from '../../db';

const SubscriberNotifications: React.FC<{ user: ISPUser, state: AppState }> = ({ user, state }) => {
  const userNotifs = useMemo(() => {
    // SUBSCRIBER TERMINAL FILTER: Only show subscriber audience events for THIS user id
    return state.notifications
      .filter(n => n.audience === 'subscriber' && (n.targetId === user.id || n.targetId === 'all'))
      .sort((a,b) => b.createdAt - a.createdAt);
  }, [state.notifications, user.id]);

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      await db.clearNotifications(user.id, 'subscriber');
    }
  };

  const handleMarkAllRead = async () => {
    await db.markAllNotificationsRead(user.id, 'subscriber');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
         <div className="p-8 border-b bg-slate-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Bell size={24} />
               </div>
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tight italic">Your Notifications</h3>
                  <p className="text-[9px] text-blue-300 font-black uppercase tracking-widest">Recent Account Activity</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={handleMarkAllRead}
                  title="Mark All as Read"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-green-400 transition-all active:scale-90"
               >
                  <ListChecks size={20}/>
               </button>
               <button 
                  onClick={handleClear}
                  title="Purge Registry"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
               >
                  <Trash2 size={20}/>
               </button>
            </div>
         </div>

         <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
            {userNotifs.length === 0 ? (
              <div className="p-32 text-center flex flex-col items-center">
                 <Wifi size={48} className="text-slate-100 mb-6" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No new notifications.</p>
              </div>
            ) : (
              userNotifs.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && db.markNotificationRead(n.id)}
                  className={`p-8 flex items-start gap-6 hover:bg-slate-50 transition-all group cursor-pointer relative ${!n.read ? 'bg-blue-50/10' : 'bg-white'}`}
                >
                   {!n.read && (
                     <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                   )}
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border transition-all ${n.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : n.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {n.type === 'success' ? <CheckCircle size={28} /> : <ShieldAlert size={28} />}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className={`text-xl font-black uppercase tracking-tight ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                         <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase mt-1">
                            <Clock size={12} /> {new Date(n.timestamp).toLocaleTimeString()}
                         </div>
                      </div>
                      <p className={`text-xs font-medium leading-relaxed uppercase ${!n.read ? 'text-slate-600' : 'text-slate-400'}`}>{n.message}</p>
                   </div>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
};

export default SubscriberNotifications;


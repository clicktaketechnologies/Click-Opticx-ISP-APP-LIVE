import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, UserStatus } from '../../types';
import { db } from '../../db';
import { 
  BellRing, Send, Search, Users, Smartphone, 
  RefreshCw, ShieldCheck, X, Activity, Globe, 
  Zap, AlertTriangle, User, Hash, Clock, ArrowRight,
  MessageSquare, LayoutGrid, HeartPulse, CheckCircle, Info
} from 'lucide-react';

const PushNotifications: React.FC<{ state: AppState }> = ({ state }) => {
  const [targetType, setTargetType] = useState<'Individual' | 'Segment' | 'Global'>('Segment');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'critical'>('normal');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!title || !message) return;
    setIsSending(true);
    
    // Simulate relay handshake
    const actualTarget = targetType === 'Global' ? 'all' : targetId;
    await db.sendPushNotification(actualTarget, `${title}: ${message}`, priority);
    
    setTimeout(() => {
      setIsSending(false);
      setSuccess(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <BellRing className="text-indigo-600" size={32} />
            Push Notifications
          </h2>
          <p className="text-slate-500 font-medium">Send instant notifications to your users' phones or browsers.</p>
        </div>
        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase text-slate-700">System Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Command Panel */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-10">
               <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                  {[
                    { key: 'Individual', label: 'Single User' },
                    { key: 'Segment', label: 'User Group' },
                    { key: 'Global', label: 'Everyone' }
                  ].map((t: any) => (
                    <button
                      key={t.key}
                      onClick={() => { setTargetType(t.key); setTargetId(''); }}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${targetType === t.key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t.label}
                    </button>
                  ))}
               </div>

               <div className="space-y-6">
                  {targetType === 'Individual' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Select User</label>
                       <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600" value={targetId} onChange={e => setTargetId(e.target.value)}>
                          <option value="">Search user...</option>
                          {state.users.filter(u => !u.deleted).map(u => <option key={u.id} value={u.id}>{u.name} ({u.connectionId})</option>)}
                       </select>
                    </div>
                  )}

                  {targetType === 'Segment' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Select Group</label>
                       <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600" value={targetId} onChange={e => setTargetId(e.target.value)}>
                          <option value="">Select a group...</option>
                          {state.audienceSegments.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subscriberCount} Users)</option>)}
                       </select>
                    </div>
                  )}

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Notification Title</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 uppercase" placeholder="e.g. NETWORK ALERT" value={title} onChange={e => setTitle(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Message Content</label>
                        <textarea className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-32 resize-none outline-none focus:border-indigo-600 uppercase" placeholder="Brief message..." value={message} onChange={e => setMessage(e.target.value)} />
                     </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${priority === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-white text-slate-400'}`}>
                           <Zap size={24} fill={priority === 'critical' ? 'currentColor' : 'none'}/>
                        </div>
                        <div>
                           <h4 className="text-xs font-black uppercase text-slate-900">Priority Level</h4>
                           <p className="text-[9px] text-slate-400 font-bold uppercase">High priority messages will alert even if the user is busy.</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setPriority(priority === 'normal' ? 'critical' : 'normal')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${priority === 'critical' ? 'bg-rose-600 text-white' : 'bg-white text-slate-400'}`}
                     >
                        {priority === 'critical' ? 'CRITICAL' : 'NORMAL'}
                     </button>
                  </div>
               </div>

               <button 
                 onClick={handleSend}
                 disabled={isSending || !title || !message || (targetType !== 'Global' && !targetId)}
                 className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
               >
                  {isSending ? <Mini5GMicroLoader size={24} /> : <Send size={24}/>}
                  {isSending ? 'Sending...' : 'Send Notification'}
               </button>
            </div>
         </div>

         {/* Info Sidebar */}
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[300px]">
               <div className="relative z-10 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">System Health</h4>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1 italic">Delivery Success Rate</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">99.4%</p>
                     </div>
                  </div>
               </div>
               <Activity className="absolute -right-16 -bottom-16 opacity-5 scale-[2.5]" size={200} />
            </div>

            {success && (
              <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-center gap-6 animate-in zoom-in duration-300">
                 <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0"><CheckCircle size={32}/></div>
                 <div>
                    <h4 className="text-sm font-black text-emerald-900 uppercase italic">Notification Sent</h4>
                    <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest leading-tight">Your notification has been successfully delivered.</p>
                 </div>
              </div>
            )}

            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] space-y-6">
               <div className="flex items-center gap-3">
                  <Info size={24} className="text-blue-600 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-900">Tips & Rules</h4>
               </div>
               <ul className="space-y-4">
                  {[
                    'You can send up to 3 manual notifications per day.',
                    'Sending to everyone requires special permission.',
                    'Keep messages under 240 characters.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-3 text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                       <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                       {rule}
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PushNotifications;

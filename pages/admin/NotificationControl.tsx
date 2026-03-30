import React, { useState } from 'react';
import { AppState, NotificationMasterMode } from '../../types';
import { db } from '../../db';
import { 
  Bell, Smartphone, MessageSquare, ShieldCheck, Zap, 
  Settings, Save, Activity, RefreshCw, AlertTriangle,
  ToggleLeft, ToggleRight, Layout, Filter, Gauge, Info, Clock
} from 'lucide-react';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

const NotificationControl: React.FC<{ state: AppState }> = ({ state }) => {
  const [formData, setFormData] = useState(state.settings.commConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.updateSettings({ ...state.settings, commConfig: formData });
      setTimeout(() => {
        setIsSaving(false);
        db.logNotification('all', 'success', 'Notification Control Updated', 'Global notification settings have been synchronized.');
      }, 1000);
    } catch (err) {
      setIsSaving(false);
      alert('Update Failed');
    }
  };

  const modes: { id: NotificationMasterMode; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'Push_Only', label: 'Push Only', icon: Smartphone, color: 'text-blue-500', desc: 'Firebase Primary - Zero Cost' },
    { id: 'SMS_Only', label: 'SMS Only', icon: MessageSquare, color: 'text-green-500', desc: 'Gateway Direct - High Delivery' },
    { id: 'Push_And_SMS', label: 'Push + SMS', icon: Zap, color: 'text-purple-500', desc: 'Dual Channel - Maximum Impact' },
    { id: 'Auto_Fallback', label: 'Auto Fallback', icon: RefreshCw, color: 'text-amber-500', desc: 'Push First -> SMS if Failed' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                <Bell size={28} className="animate-bounce-slow" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">SMART NOTIFICATION CONTROL</h2>
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-16">Global Master Orchestration Engine v2.0</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-12 py-5 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 group"
        >
          {isSaving ? <Mini5GMicroLoader size={18} /> : <Save size={18} className="group-hover:rotate-12 transition-transform" />}
          Synchronize Configuration
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Master Toggle Column */}
        <div className="lg:col-span-2 space-y-10">
            {/* System Status Banner */}
            <div className={`p-8 rounded-[3rem] border-2 flex items-center justify-between transition-all ${formData.globalNotificationEnabled ? 'bg-blue-50/50 border-blue-100 text-blue-900 shadow-xl shadow-blue-50' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${formData.globalNotificationEnabled ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'}`}>
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">Global Notification Engine</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{formData.globalNotificationEnabled ? 'Operational & Dispatched' : 'System Hibernated'}</p>
                    </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, globalNotificationEnabled: !formData.globalNotificationEnabled})}
                  className={`w-20 h-10 rounded-full transition-all relative shadow-inner ${formData.globalNotificationEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                    <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-xl transition-all ${formData.globalNotificationEnabled ? 'left-11' : 'left-1.5'}`}></div>
                </button>
            </div>

            {/* Mode Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setFormData({...formData, notificationMode: mode.id})}
                        className={`p-10 rounded-[3rem] border-4 text-left transition-all relative overflow-hidden group ${formData.notificationMode === mode.id ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100 scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border ${formData.notificationMode === mode.id ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                            <mode.icon size={32} className={formData.notificationMode === mode.id ? mode.color : 'text-slate-300'} />
                        </div>
                        <h4 className={`text-2xl font-black uppercase italic tracking-tighter mb-2 ${formData.notificationMode === mode.id ? 'text-slate-900' : 'text-slate-400'}`}>{mode.label}</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${formData.notificationMode === mode.id ? 'text-blue-500' : 'text-slate-300'}`}>{mode.desc}</p>
                        
                        {formData.notificationMode === mode.id && (
                            <div className="absolute top-6 right-6 w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                        )}
                        <Layout className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12" size={160} />
                    </button>
                ))}
            </div>

            {/* Fallback Control */}
            {formData.notificationMode === 'Auto_Fallback' && (
                <div className="p-10 bg-white rounded-[3rem] border-2 border-slate-100 shadow-xl space-y-8 animate-in zoom-in duration-500">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <RefreshCw className="text-amber-500 animate-spin-slow" size={28} />
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Fallback Logic Config</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automatic rerouting parameters</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h5 className="text-sm font-black uppercase text-slate-800">Allow SMS Fallback</h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Send SMS if Firebase Push fails</p>
                            </div>
                        </div>
                        <button 
                          onClick={() => setFormData({...formData, autoFallbackEnabled: !formData.autoFallbackEnabled})}
                          className={`w-16 h-8 rounded-full transition-all relative ${formData.autoFallbackEnabled ? 'bg-amber-500 shadow-lg shadow-amber-100' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.autoFallbackEnabled ? 'left-9' : 'left-1'}`}></div>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Retry Wait (sec)</p>
                            <p className="text-2xl font-black italic text-slate-800 tracking-tighter">30 SEC</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Retries</p>
                            <p className="text-2xl font-black italic text-slate-800 tracking-tighter">3 TIMES</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-[12px] border-blue-600">
                <Gauge className="absolute -right-8 -top-8 opacity-10" size={140} />
                <h4 className="text-xs font-black italic uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                    <Activity size={18} className="text-blue-400 animate-pulse" /> Dispatch Analytics
                </h4>

                <div className="space-y-8 relative z-10">
                    {[
                        { label: 'Push Success %', val: '98.2%', color: 'text-blue-400' },
                        { label: 'SMS Success %', val: '84.5%', color: 'text-green-400' },
                        { label: 'Fallback Rate', val: '2.1%', color: 'text-amber-400' },
                    ].map((stat, i) => (
                        <div key={stat.label} className="flex justify-between items-end border-b border-white/5 pb-4">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
                            <p className={`text-4xl font-black italic italic tracking-tighter leading-none ${stat.color}`}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Info size={18} />
                    </div>
                    <p className="text-[9px] font-black uppercase text-white/50 leading-relaxed tracking-tighter italic">
                       Engine status healthy. Sync cycle optimized for real-time delivery.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-800 flex items-center gap-3">
                    <Settings size={18} className="text-slate-400" /> Advanced Options
                </h3>
                <div className="space-y-4">
                    {[
                        { label: 'Quiet Hours Active', icon: Clock, enabled: formData.quietHours.enabled },
                        { label: 'Signal Warning Alerts', icon: Gauge, enabled: true },
                        { label: 'Marketing Auto-Push', icon: Layout, enabled: false },
                    ].map(opt => (
                        <div key={opt.label} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 group hover:border-blue-600 transition-all">
                            <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                                <opt.icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${opt.enabled ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationControl;

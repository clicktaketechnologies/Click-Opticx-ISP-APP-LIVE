import React from 'react';
import { X, MapPin, Bell, Crosshair, Globe, Settings2, ShieldCheck, Volume2 } from 'lucide-react';
import { PrayerAlertSettings } from './AzanAlertManager';

interface Props {
  onClose: () => void;
  settings: {
    autoLocation: boolean;
    city: string;
    country: string;
    method: number;
    asrMethod: number; // 0: Shafi, 1: Hanafi
    alerts: PrayerAlertSettings;
  };
  onUpdate: (newSettings: any) => void;
}

const PrayerSettingsModal: React.FC<Props> = ({ onClose, settings, onUpdate }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-slate-50 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Settings2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Prayer Settings</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Protocol Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Location Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-rose-500" /> Location Node
            </h4>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => onUpdate({ ...settings, autoLocation: true })}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.autoLocation ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Auto (GPS)
              </button>
              <button 
                onClick={() => onUpdate({ ...settings, autoLocation: false })}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!settings.autoLocation ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Manual City
              </button>
            </div>

            {!settings.autoLocation && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="City" 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:border-blue-500"
                  value={settings.city}
                  onChange={(e) => onUpdate({ ...settings, city: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="Country" 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:border-blue-500"
                  value={settings.country}
                  onChange={(e) => onUpdate({ ...settings, country: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Juristic Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" /> Calculation Juristic
            </h4>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Asr Method</label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => onUpdate({ ...settings, asrMethod: 0 })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.asrMethod === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Standard (Shafi+)
                </button>
                <button 
                  onClick={() => onUpdate({ ...settings, asrMethod: 1 })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${settings.asrMethod === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Hanafi
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Calculation Method</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500/10"
                value={settings.method}
                onChange={(e) => onUpdate({ ...settings, method: Number(e.target.value) })}
              >
                <option value={1}>University of Islamic Sciences, Karachi</option>
                <option value={2}>ISNA (North America)</option>
                <option value={3}>Muslim World League</option>
                <option value={4}>Umm Al-Qura University, Makkah</option>
                <option value={5}>Egyptian General Authority of Survey</option>
                <option value={12}>UOIF (France)</option>
              </select>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bell size={14} className="text-amber-500" /> Azan Handshake
            </h4>
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-700">Master Alert</span>
                <button 
                  onClick={() => onUpdate({ ...settings, alerts: { ...settings.alerts, enabled: !settings.alerts.enabled } })}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.alerts.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings.alerts.enabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sound Selection</label>
                <div className="grid grid-cols-3 gap-2">
                  {['default', 'short', 'silent'].map((s: any) => (
                    <button 
                      key={s}
                      onClick={() => onUpdate({ ...settings, alerts: { ...settings.alerts, sound: s } })}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${settings.alerts.sound === s ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t flex shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrayerSettingsModal;

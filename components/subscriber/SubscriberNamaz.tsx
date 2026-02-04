
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Timer, MapPin, Sun, Moon, CloudSun, Sunset, CloudMoon, 
  Clock, Bell, Settings2, RefreshCw, Loader2, Volume2, VolumeX, ShieldCheck, AlertTriangle
} from 'lucide-react';
import PrayerSettingsModal from './PrayerSettingsModal';
import { azanManager, PrayerAlertSettings } from './AzanAlertManager';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

const SubscriberNamaz: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState('Synchronizing...');
  const [countdown, setCountdown] = useState({ prayer: '', time: '00:00:00' });
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('nr_prayer_settings');
    return saved ? JSON.parse(saved) : {
      autoLocation: true,
      city: 'Karachi',
      country: 'Pakistan',
      method: 1, 
      asrMethod: 1, 
      alerts: {
        enabled: true,
        individual: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
        sound: 'default'
      } as PrayerAlertSettings
    };
  });

  const fetchTimes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      let url = '';
      if (settings.autoLocation && "geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => 
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
          );
          url = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=${settings.method}&school=${settings.asrMethod}`;
          setLocationName('GPS Synchronized');
        } catch (gpsErr) {
          console.warn("GPS Node Unavailable: Falling back to manual registry.");
        }
      }
      
      if (!url) {
        url = `https://api.aladhan.com/v1/timingsByCity/${Math.floor(Date.now() / 1000)}?city=${settings.city}&country=${settings.country}&method=${settings.method}&school=${settings.asrMethod}`;
        setLocationName(`${settings.city}, ${settings.country}`);
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Aladhan API Error: ${res.status}`);
      const data = await res.json();
      
      if (!data?.data?.timings) throw new Error("Registry Data Corrupt");
      
      const timings = data.data.timings;
      const cleanTimes: PrayerTimes = {
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha
      };
      
      setPrayerTimes(cleanTimes);
    } catch (err) {
      console.error("Aladhan Handshake Failure:", err);
      setFetchError("Atmospheric Link Down: Failed to fetch prayer timings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (prayerTimes) {
        azanManager.checkAndTrigger(prayerTimes, settings.alerts);
        
        const prayers = Object.entries(prayerTimes).map(([name, time]) => {
          const [h, m] = (time as string).split(':').map(Number);
          const pDate = new Date();
          pDate.setHours(h, m, 0);
          if (pDate < now) pDate.setDate(pDate.getDate() + 1);
          return { name, date: pDate };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        const next = prayers[0];
        const diff = next.date.getTime() - now.getTime();
        const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        
        setCountdown({ prayer: next.name, time: `${hrs}:${mins}:${secs}` });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes, settings.alerts]);

  const prayerItems = useMemo(() => {
    if (!prayerTimes) return [];
    return [
      { name: 'Fajr', time: prayerTimes.Fajr, icon: Sun, color: 'text-blue-500', bg: 'bg-blue-50' },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr, icon: CloudSun, color: 'text-orange-500', bg: 'bg-orange-50' },
      { name: 'Asr', time: prayerTimes.Asr, icon: Sunset, color: 'text-rose-500', bg: 'bg-rose-50' },
      { name: 'Maghrib', time: prayerTimes.Maghrib, icon: CloudMoon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { name: 'Isha', time: prayerTimes.Isha, icon: Moon, color: 'text-slate-500', bg: 'bg-slate-50' },
    ];
  }, [prayerTimes]);

  if (loading && !fetchError) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
          <Loader2 className="text-emerald-400 animate-spin" size={40} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Querying Aladhan Nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {fetchError ? (
        <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] space-y-6 text-center shadow-xl shadow-rose-100/50">
           <div className="w-16 h-16 bg-rose-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-200">
              <AlertTriangle size={32} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black text-rose-900 uppercase italic">Atmospheric Link Error</h3>
              <p className="text-[10px] text-rose-700 font-bold uppercase tracking-widest">{fetchError}</p>
           </div>
           <button 
             onClick={() => fetchTimes()}
             className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
           >
              <RefreshCw size={16} /> Re-Initialize Link
           </button>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-10">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Authority Node</p>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                        <MapPin className="text-rose-500" size={20} />
                        {locationName}
                     </h3>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setShowSettings(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5"><Settings2 size={20} className="text-indigo-400" /></button>
                     <button onClick={() => fetchTimes(true)} disabled={refreshing} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5">
                        <RefreshCw size={20} className={`text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
                     </button>
                  </div>
               </div>
               
               <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl flex flex-col items-center gap-2 shadow-inner group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Next: {countdown.prayer}</p>
                  <h2 className="text-6xl font-black italic tracking-tighter text-white tabular-nums drop-shadow-2xl">{countdown.time}</h2>
               </div>

               <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.alerts.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {settings.alerts.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Azan Relay {settings.alerts.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <p className="text-xs font-black text-indigo-400 uppercase italic">{settings.asrMethod === 1 ? 'Hanafi' : 'Shafi'}</p>
               </div>
            </div>
            <Timer className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none" size={360} />
          </div>

          <div className="grid grid-cols-1 gap-3 px-1">
            {prayerItems.map((p) => {
              const [h, m] = p.time.split(':').map(Number);
              const pDate = new Date(); pDate.setHours(h, m, 0);
              const passed = currentTime > pDate;
              const isNext = countdown.prayer === p.name;
              const alertActive = settings.alerts.enabled && settings.alerts.individual[p.name];
              
              return (
                <div key={p.name} className={`bg-white p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group shadow-sm ${isNext ? 'ring-4 ring-indigo-600/10 border-indigo-600 shadow-indigo-100 scale-[1.02]' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${p.bg} ${p.color} rounded-[1.5rem] flex items-center justify-center border-2 border-current/10 shadow-inner group-hover:rotate-6 transition-transform`}>
                      <p.icon size={28} />
                    </div>
                    <div>
                      <h4 className={`text-base font-black uppercase tracking-widest leading-none ${passed ? 'text-slate-300' : 'text-slate-800'}`}>{p.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1.5">{passed ? 'Registry Passed' : isNext ? 'Upcoming Handshake' : 'Registry Standby'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <p className={`text-2xl font-black tracking-tighter italic tabular-nums ${passed ? 'text-slate-300' : 'text-slate-900'}`}>{p.time}</p>
                     <button className={`p-4 rounded-2xl transition-all active:scale-90 ${alertActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}><Bell size={20} fill={alertActive ? "currentColor" : "none"} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showSettings && <PrayerSettingsModal settings={settings} onClose={() => setShowSettings(false)} onUpdate={(s) => setSettings(s)} />}
    </div>
  );
};

export default SubscriberNamaz;

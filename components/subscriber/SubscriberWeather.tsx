import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, 
  Search, CloudSun, RefreshCw, Loader2, Sunrise, Sunset, 
  CloudLightning, CloudSnow, Navigation, Settings2, Globe, AlertCircle, Zap
} from 'lucide-react';
import WeatherForecastCard from './WeatherForecastCard';
import WeatherLocationSelector from './WeatherLocationSelector';

interface WeatherData {
  current: {
    temp: number;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    uvIndex: number;
    isDay: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    sunrise: string[];
    sunset: string[];
  };
}

interface Location {
  name: string;
  lat: number;
  lng: number;
  source: 'GPS' | 'Manual' | 'Timezone' | 'Default';
}

const SubscriberWeather: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({ 
    name: 'Syncing...', 
    lat: 24.8607, 
    lng: 67.0011, 
    source: 'Default' 
  });

  const fetchWeather = useCallback(async (loc: Location, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("API_REJECTION");
      const data = await res.json();

      setWeather({
        current: {
          temp: data.current.temperature_2m,
          weatherCode: data.current.weather_code,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          feelsLike: data.current.apparent_temperature,
          uvIndex: data.daily.uv_index_max[0],
          isDay: data.current.is_day
        },
        daily: {
          time: data.daily.time,
          weatherCode: data.daily.weather_code,
          tempMax: data.daily.temperature_2m_max,
          tempMin: data.daily.temperature_2m_min,
          sunrise: data.daily.sunrise,
          sunset: data.daily.sunset
        }
      });
      setLocation(loc);
    } catch (err) {
      setError("Could not fetch weather data.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Triple-Tier Fallback Strategy
  useEffect(() => {
    const initProtocol = async () => {
      // Step 1: Attempt GPS Handshake
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const gpsLoc: Location = { 
              name: 'My Location', 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude, 
              source: 'GPS' 
            };
            fetchWeather(gpsLoc);
          },
          async () => {
            // Step 2: Fallback to Last Searched City
            const saved = localStorage.getItem('nr_weather_location');
            if (saved) {
              const savedLoc = JSON.parse(saved);
              fetchWeather({ ...savedLoc, source: 'Manual' });
            } else {
              // Step 3: Fallback to Timezone-based Geolocation
              try {
                const ipRes = await fetch('https://ipapi.co/json/');
                const ipData = await ipRes.json();
                const tzLoc: Location = { 
                  name: `${ipData.city}, ${ipData.country_code}`, 
                  lat: ipData.latitude, 
                  lng: ipData.longitude, 
                  source: 'Timezone' 
                };
                fetchWeather(tzLoc);
              } catch (e) {
                // Final hardcoded fallback (Karachi)
                fetchWeather({ name: 'Karachi, PK', lat: 24.8607, lng: 67.0011, source: 'Default' });
              }
            }
          },
          { timeout: 5000, enableHighAccuracy: true }
        );
      } else {
        // Geolocation unavailable, use Step 2 logic directly
        const saved = localStorage.getItem('nr_weather_location');
        if (saved) fetchWeather(JSON.parse(saved));
        else fetchWeather({ name: 'Karachi, PK', lat: 24.8607, lng: 67.0011, source: 'Default' });
      }
    };

    initProtocol();
  }, [fetchWeather]);

  const handleManualSelect = (city: any) => {
    const newLoc: Location = {
      name: `${city.name}, ${city.country}`,
      lat: city.latitude,
      lng: city.longitude,
      source: 'Manual'
    };
    // Cache for Step 2 fallback in future sessions
    localStorage.setItem('nr_weather_location', JSON.stringify(newLoc));
    fetchWeather(newLoc);
    setShowSelector(false);
  };

  const getWeatherUI = (code: number, isDay: number) => {
    if (code === 0) return { 
      label: 'Clear Sky', 
      icon: Sun, 
      bg: isDay ? 'from-amber-400 to-orange-600' : 'from-slate-800 to-indigo-950',
      iconColor: 'text-amber-300',
      animation: 'animate-pulse'
    };
    if (code >= 1 && code <= 3) return { 
      label: 'Partly Cloudy', 
      icon: CloudSun, 
      bg: isDay ? 'from-blue-400 to-indigo-600' : 'from-slate-700 to-slate-900',
      iconColor: 'text-blue-100',
      animation: ''
    };
    if (code >= 45 && code <= 48) return { 
      label: 'Foggy', 
      icon: Cloud, 
      bg: 'from-slate-400 to-slate-600',
      iconColor: 'text-white',
      animation: 'animate-pulse'
    };
    if (code >= 51 && code <= 67) return { 
      label: 'Active Rain', 
      icon: CloudRain, 
      bg: 'from-blue-600 to-indigo-900',
      iconColor: 'text-blue-300',
      animation: 'animate-bounce'
    };
    if (code >= 95) return { 
      label: 'Stormy', 
      icon: CloudLightning, 
      bg: 'from-slate-900 via-indigo-950 to-slate-900',
      iconColor: 'text-yellow-400',
      animation: 'animate-pulse'
    };
    return { 
      label: 'Overcast', 
      icon: Cloud, 
      bg: 'from-slate-500 to-slate-700',
      iconColor: 'text-slate-200',
      animation: ''
    };
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
          <Mini5GMicroLoader size={40} />
        </div>
        <div className="text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Locating you...</p>
           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  const ui = weather ? getWeatherUI(weather.current.weatherCode, weather.current.isDay) : null;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Dynamic Main Card */}
      {weather && ui && (
        <div className={`bg-gradient-to-br ${ui.bg} rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-1000`}>
          <div className="relative z-10 flex flex-col space-y-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                   {location.source === 'GPS' ? <Navigation size={10} className="text-emerald-400 animate-pulse"/> : <Globe size={10} className="text-blue-400"/>}
                   {location.source === 'GPS' ? 'GPS Verified' : location.source === 'Timezone' ? 'Estimated Location' : 'Selected Location'}
                </p>
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-black italic tracking-tighter uppercase">{location.name}</h3>
                   <button 
                    onClick={() => setShowSelector(true)} 
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/5 active:scale-90"
                   >
                      <Search size={18} />
                   </button>
                </div>
              </div>
              <button 
                onClick={() => fetchWeather(location, true)}
                disabled={refreshing}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 shadow-xl active:scale-95"
              >
                <Mini5GMicroLoader size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-start gap-4">
                <h2 className="text-9xl font-black italic tracking-tighter leading-none drop-shadow-2xl">
                  {Math.round(weather.current.temp)}°
                </h2>
                <div className="pt-4">
                  <p className="text-2xl font-black uppercase italic tracking-tighter">{ui.label}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">RealFeel {Math.round(weather.current.feelsLike)}°</p>
                </div>
              </div>
              <div className={`w-48 h-48 bg-white/10 rounded-[3.5rem] backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-inner group hover:scale-105 transition-transform duration-700 ${ui.animation}`}>
                <ui.icon size={110} className={`${ui.iconColor} drop-shadow-2xl`} />
              </div>
            </div>

            {/* Sub-stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-10 border-t border-white/10">
               <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase text-white/50"><Droplets size={12}/> Humidity</div>
                  <p className="text-lg font-black">{weather.current.humidity}%</p>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase text-white/50"><Wind size={12}/> Wind</div>
                  <p className="text-lg font-black">{weather.current.windSpeed} <span className="text-[10px]">km/h</span></p>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase text-white/50"><Zap size={12}/> UV Rank</div>
                  <p className="text-lg font-black">{weather.current.uvIndex}</p>
               </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
             <Cloud className="animate-pulse" size={240} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center gap-4 text-amber-700 animate-in shake">
           <AlertCircle size={20} className="shrink-0" />
           <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest">Weather Unavailable</p>
              <p className="text-[9px] font-bold opacity-60 uppercase">{error}</p>
           </div>
           <button onClick={() => window.location.reload()} className="p-2 bg-amber-100 rounded-lg font-black text-[9px] uppercase">Reset</button>
        </div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner border border-amber-100">
                <Sunrise size={24} />
             </div>
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solar Start</p>
                <p className="text-lg font-black text-slate-900 uppercase italic">
                  {weather ? new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
             </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100">
                <Sunset size={24} />
             </div>
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solar End</p>
                <p className="text-lg font-black text-slate-900 uppercase italic">
                  {weather ? new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} className="text-indigo-500" />
            7-Day Forecast
          </h3>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Updated</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
           {weather?.daily.time.map((time, idx) => (
             <WeatherForecastCard 
                key={time}
                date={time}
                maxTemp={weather.daily.tempMax[idx]}
                minTemp={weather.daily.tempMin[idx]}
                weatherCode={weather.daily.weatherCode[idx]}
             />
           ))}
        </div>
      </div>

      {showSelector && (
        <WeatherLocationSelector 
          onClose={() => setShowSelector(false)} 
          onSelect={handleManualSelect} 
        />
      )}
    </div>
  );
};

export default SubscriberWeather;
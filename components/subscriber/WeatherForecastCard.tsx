import React from 'react';
import { LucideIcon, Sun, Cloud, CloudRain, CloudLightning, CloudSnow, Wind } from 'lucide-react';

interface Props {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
}

const getWeatherIcon = (code: number): LucideIcon => {
  if (code === 0) return Sun;
  if (code >= 1 && code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return Wind;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

const WeatherForecastCard: React.FC<Props> = ({ date, maxTemp, minTemp, weatherCode }) => {
  const Icon = getWeatherIcon(weatherCode);
  const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });
  const isToday = new Date(date).toDateString() === new Date().toDateString();

  return (
    <div className={`flex-none w-24 p-5 rounded-3xl border transition-all flex flex-col items-center gap-3 group ${
      isToday ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-200'
    }`}>
      <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-100' : 'text-slate-400'}`}>
        {isToday ? 'Today' : dayName}
      </p>
      <div className={`p-2 rounded-xl ${isToday ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-indigo-50'} transition-colors`}>
        <Icon size={20} className={isToday ? 'text-white' : 'text-indigo-500'} />
      </div>
      <div className="text-center">
        <p className="text-sm font-black tracking-tighter">{Math.round(maxTemp)}°</p>
        <p className={`text-[9px] font-bold opacity-40`}>{Math.round(minTemp)}°</p>
      </div>
    </div>
  );
};

export default WeatherForecastCard;
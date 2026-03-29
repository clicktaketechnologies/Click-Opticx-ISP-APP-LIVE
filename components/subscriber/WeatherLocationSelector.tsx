import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, X, Loader2, Globe, ChevronRight } from 'lucide-react';

interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

interface Props {
  onClose: () => void;
  onSelect: (city: City) => void;
}

const WeatherLocationSelector: React.FC<Props> = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchCities = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Geocoding Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchCities, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[700] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-slate-50 flex flex-col">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Weather Node</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Manual Location Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search global city..." 
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-widest"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && <Mini5GMicroLoader size={18} />}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {results.map((city, idx) => (
              <button 
                key={`${city.name}-${idx}`}
                onClick={() => onSelect(city)}
                className="w-full p-4 flex items-center justify-between bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{city.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
            {query.length >= 3 && results.length === 0 && !loading && (
              <p className="text-center py-8 text-slate-400 font-bold uppercase text-[10px]">No nodes found matching query.</p>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t shrink-0">
          <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase text-center">
            City results provided by Open-Meteo Geocoding Relay.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherLocationSelector;

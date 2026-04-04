import React, { useState } from 'react';
import { MapPin, X, Globe, Search, ChevronRight } from 'lucide-react';
import Modal from '../shared/Modal';

interface Props {
  onClose: () => void;
  onSelect: (city: string, country: string, lat: number, lng: number) => void;
}

// Minimal preset for the fallbacks
const CITY_PRESETS = [
  { city: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { city: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587 },
  { city: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
];

const QiblaLocationSelector: React.FC<Props> = ({ onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  const filtered = CITY_PRESETS.filter(p => 
    p.city.toLowerCase().includes(search.toLowerCase()) || 
    p.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Regional Node"
      type="info"
      icon={<Globe size={24} className="text-white" />}
      maxWidth="max-w-md"
      footer={
        <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase text-center w-full">
          City data is used to calculate bearing if GPS nodes are offline.
        </p>
      }
    >
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search major city..." 
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-widest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {filtered.map(p => (
            <button 
              key={p.city}
              onClick={() => onSelect(p.city, p.country, p.lat, p.lng)}
              className="w-full p-4 flex items-center justify-between bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.city}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{p.country}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default QiblaLocationSelector;

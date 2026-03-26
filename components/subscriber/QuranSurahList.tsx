import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import { ALL_SURAHS, SurahMetadata } from './QuranData';

interface Props {
  onSelectSurah: (surah: SurahMetadata) => void;
}

const QuranSurahList: React.FC<Props> = ({ onSelectSurah }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Meccan' | 'Medinan'>('All');

  const filteredSurahs = useMemo(() => {
    return ALL_SURAHS.filter(s => {
      const lowerSearch = searchTerm.toLowerCase().trim();
      if (!lowerSearch) {
        return filterType === 'All' || s.type === filterType;
      }
      
      const matchesSearch = 
        s.transliteration.toLowerCase().includes(lowerSearch) ||
        s.translation.toLowerCase().includes(lowerSearch) ||
        s.name.includes(lowerSearch) ||
        s.id.toString() === lowerSearch;
      
      const matchesFilter = filterType === 'All' || s.type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-24">
      <div className="space-y-4 shrink-0 px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search Surah (e.g. Fatihah, Baqarah, 36)..." 
            className="w-full pl-14 pr-4 py-5 bg-white border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['All', 'Meccan', 'Medinan'].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                filterType === type 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 mx-4">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <BookOpen size={14} className="text-emerald-500"/> Noble Quran
           </h3>
           <span className="text-[10px] font-black text-slate-500 bg-white border px-3 py-1 rounded-full uppercase">
             {filteredSurahs.length} Surahs
           </span>
        </div>
        <div className="divide-y divide-slate-50 overflow-y-auto flex-1 custom-scrollbar">
          {filteredSurahs.map((surah) => (
            <button 
              key={surah.id} 
              onClick={() => onSelectSurah(surah)}
              className="w-full p-6 flex items-center justify-between hover:bg-emerald-50/50 transition-all group text-left active:scale-[0.99] origin-center"
            >
              <div className="flex items-center gap-5 overflow-hidden">
                <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform italic shrink-0">
                  {surah.id}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-emerald-600 transition-colors flex items-center gap-2 flex-wrap">
                    {surah.transliteration} <span className="font-arabic text-xl opacity-40">{surah.name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    {surah.translation} • {surah.total_verses} Ayahs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                 <span className={`hidden sm:inline-block text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${
                   surah.type === 'Meccan' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                 }`}>
                   {surah.type}
                 </span>
                 <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" size={20} />
              </div>
            </button>
          ))}
          {filteredSurahs.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <Search size={48} className="text-slate-100" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No matches found for your search.</p>
               <button 
                 onClick={() => { setSearchTerm(''); setFilterType('All'); }}
                 className="mt-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest underline"
               >
                 Clear Search
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuranSurahList;

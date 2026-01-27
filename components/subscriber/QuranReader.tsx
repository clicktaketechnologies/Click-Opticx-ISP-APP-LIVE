import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Square, Languages, Loader2, BookOpen, Volume2, AlertCircle } from 'lucide-react';
import { SurahMetadata } from './QuranData';

interface Props {
  surah: SurahMetadata;
  onBack: () => void;
}

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translation?: string;
}

const QuranReader: React.FC<Props> = ({ surah, onBack }) => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSurah = async () => {
      setIsLoading(true);
      try {
        // Fetch Arabic text (Uthmani Script)
        const arabicRes = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah.id}`);
        const arabicData = await arabicRes.json();
        
        // Fetch English translation (Dr. Mustafa Khattab - The Clear Quran)
        const transRes = await fetch(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${surah.id}`);
        const transData = await transRes.json();

        const combinedVerses = arabicData.verses.map((v: any, idx: number) => ({
          id: v.id,
          verse_key: v.verse_key,
          text_uthmani: v.text_uthmani,
          translation: transData.translations[idx]?.text.replace(/<(?:.|\n)*?>/gm, '') // Strip any HTML tags
        }));

        setVerses(combinedVerses);
      } catch (err) {
        console.error("Quran API Link Failure:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurah();
    
    // Audio Node Initialization - Using server8.mp3quran.net for high reliability (Alafasy)
    const audioId = surah.id.toString().padStart(3, '0');
    // Mirror URL fallback strategy
    const primaryUrl = `https://server8.mp3quran.net/afs/${audioId}.mp3`;
    
    const audio = new Audio(primaryUrl);
    audioRef.current = audio;
    
    const handleEnd = () => setIsPlaying(false);
    const handleWaiting = () => setIsAudioLoading(true);
    const handleCanPlay = () => setIsAudioLoading(false);
    const handleError = () => {
      setAudioError("Stream unreachable. Registry timeout.");
      setIsPlaying(false);
      setIsAudioLoading(false);
    };

    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnd);
        audioRef.current.removeEventListener('waiting', handleWaiting);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current = null;
      }
    };
  }, [surah.id]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioError(null);
      setIsAudioLoading(true);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error("Audio Handshake Error:", e);
          setAudioError("Browser blocked autoplay or node offline.");
          setIsAudioLoading(false);
        });
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) toggleAudio();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      {/* Header Overlay */}
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm z-10">
        <button 
          onClick={onBack}
          className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight italic text-slate-900 leading-none">
            {surah.transliteration} <span className="font-arabic text-2xl ml-2 text-emerald-600">{surah.name}</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {surah.translation} • {surah.total_verses} Verses
          </p>
        </div>

        <button 
          onClick={() => setShowTranslation(!showTranslation)}
          className={`p-3 rounded-2xl transition-all active:scale-95 border ${showTranslation ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}
        >
          <Languages size={20} />
        </button>
      </header>

      {/* Reader Scroll Layer */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-12 pb-48">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 shadow-inner">
               <Loader2 className="text-emerald-500 animate-spin" size={32} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Downloading Holy Text...</p>
          </div>
        ) : (
          <>
            {surah.id !== 1 && surah.id !== 9 && (
              <div className="text-center mb-16 animate-in slide-in-from-top-4 duration-1000">
                <p className="font-arabic text-4xl text-slate-900 leading-relaxed tracking-wide mb-4">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <div className="flex items-center justify-center gap-4">
                   <div className="h-[1px] w-12 bg-slate-100"></div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">In the Name of Allah</p>
                   <div className="h-[1px] w-12 bg-slate-100"></div>
                </div>
              </div>
            )}
            
            <div className="space-y-12">
              {verses.map((verse) => (
                <div key={verse.id} className="group pb-12 border-b border-slate-50 last:border-0">
                  <div className="flex flex-col items-end gap-6 mb-6">
                    <div className="w-full flex items-center justify-between border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center text-[10px] font-black italic shadow-lg shrink-0">
                          {verse.verse_key.split(':')[1]}
                       </div>
                       <Volume2 size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="font-arabic text-3xl md:text-5xl text-slate-900 leading-[2.8] md:leading-[3] tracking-wide text-right direction-rtl w-full">
                      {verse.text_uthmani}
                    </p>
                  </div>
                  
                  {showTranslation && (
                    <div className="pl-6 md:pl-12 border-l-4 border-emerald-50 py-2">
                      <p className="text-slate-600 font-medium leading-relaxed italic text-sm md:text-base uppercase tracking-tight">
                        {verse.translation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-20 text-center flex flex-col items-center gap-6">
               <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl rotate-45">
                  <BookOpen size={32} className="-rotate-45" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter">Sadaqallahul Azim</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End of Surah {surah.transliteration}</p>
               </div>
               <button 
                 onClick={onBack}
                 className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-6"
               >
                 Return to Registry
               </button>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Audio Controller */}
      {!isLoading && (
        <div className="fixed bottom-24 inset-x-5 md:inset-x-auto md:right-10 md:w-96 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] p-6 z-[200] animate-in slide-in-from-bottom-8 duration-700">
           {audioError && (
             <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 animate-in fade-in zoom-in">
                <AlertCircle size={14} />
                <span className="text-[8px] font-black uppercase tracking-widest">{audioError}</span>
             </div>
           )}
           
           <div className="flex items-center gap-6">
              <button 
                onClick={toggleAudio}
                disabled={isAudioLoading}
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all active:scale-90 relative ${
                  isPlaying ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'
                } ${isAudioLoading ? 'opacity-80 grayscale' : ''}`}
              >
                {isAudioLoading ? (
                  <Loader2 className="animate-spin" size={28} />
                ) : isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Reciter Node</p>
                    <div className="flex items-center gap-1">
                       <div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                       <span className={`text-[8px] font-black uppercase ${isPlaying ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {isAudioLoading ? 'Buffering' : isPlaying ? 'Streaming' : 'Standby'}
                       </span>
                    </div>
                 </div>
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">Mishary Rashid Alafasy</h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Surah {surah.transliteration}</p>
              </div>

              <button 
                onClick={restartAudio}
                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors active:scale-90"
                title="Restart Handshake"
              >
                <Square size={18} fill="currentColor" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuranReader;

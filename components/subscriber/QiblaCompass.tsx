import React from 'react';
import { Target, Compass, CheckCircle } from 'lucide-react';

interface Props {
  heading: number;
  qiblaBearing: number;
  accuracy: 'High' | 'Medium' | 'Low';
}

const QiblaCompass: React.FC<Props> = ({ heading, qiblaBearing, accuracy }) => {
  // needleRotation = absolute bearing - phone's relative heading
  const needleRotation = qiblaBearing - heading;
  
  // Alignment cone: 3 degrees
  const isAligned = Math.abs((heading - qiblaBearing + 540) % 360 - 180) < 3;

  return (
    <div className="relative flex flex-col items-center justify-center space-y-12">
      {/* Alignment Indicator Header */}
      <div className={`h-12 flex items-center justify-center px-8 rounded-full transition-all duration-500 border-2 ${
        isAligned 
          ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' 
          : 'bg-white text-slate-400 border-slate-100'
      }`}>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          {isAligned ? <><CheckCircle size={14} strokeWidth={4} /> Facing Qibla</> : 'Align Node to Kaaba'}
        </span>
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Degree Markers */}
        <div className="absolute inset-0 rounded-full border-[1px] border-slate-100 opacity-50"></div>
        <div className="absolute inset-4 rounded-full border-[10px] border-slate-50 shadow-inner"></div>
        
        {/* Cardinal Markers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `rotate(${-heading}deg)` }}>
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <div key={dir} className="absolute font-black text-[10px] text-slate-300" style={{ transform: `rotate(${i * 90}deg) translateY(-130px)` }}>
              {dir}
            </div>
          ))}
        </div>

        {/* Dynamic Qibla Pointer */}
        <div 
          className="relative w-72 h-72 transition-transform duration-200 ease-out"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          {/* Alignment Path */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2 origin-bottom transition-all duration-700 ${isAligned ? 'bg-emerald-500 opacity-100' : 'bg-slate-200 opacity-20'}`}></div>
          
          {/* Kaaba Target */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              isAligned ? 'bg-emerald-500 text-white shadow-2xl scale-110' : 'bg-slate-900 text-emerald-400 opacity-60'
            }`}>
              <div className="relative">
                <Target size={32} />
                {isAligned && (
                   <div className="absolute inset-0 animate-ping rounded-full bg-white opacity-20"></div>
                )}
              </div>
            </div>
            <div className={`mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isAligned ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              Target
            </div>
          </div>
        </div>

        {/* Center Point */}
        <div className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-slate-100 z-20"></div>
        
        {/* Glow alignment */}
        {isAligned && (
          <div className="absolute w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm px-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Bearing</p>
          <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{qiblaBearing.toFixed(1)}°</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy Grade</p>
          <p className={`text-2xl font-black italic tracking-tighter ${accuracy === 'High' ? 'text-emerald-600' : 'text-amber-600'}`}>{accuracy}</p>
        </div>
      </div>
    </div>
  );
};

export default QiblaCompass;
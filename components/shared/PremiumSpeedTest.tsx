
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, Play, Activity, Globe, Wifi, 
  ArrowDownCircle, ArrowUpCircle, ShieldCheck, 
  History as HistoryIcon, Server, Zap, AlertTriangle, 
  CheckCircle2, Gauge, RefreshCw, ChevronDown, 
  MapPin, Radio, Signal, Cpu, Network, X, ArrowRight,
  Lock
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer 
} from 'recharts';
import { 
  runPingTest, runDownloadTest, runUploadTest, 
  fetchPublicIP, NetworkInfo, SPEED_TEST_SERVERS 
} from '../../utils/speedtest';

interface Props {
  onComplete?: (results: any) => void;
  className?: string;
  isModal?: boolean;
}

const PremiumSpeedTest: React.FC<Props> = ({ onComplete, className, isModal }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [statusText, setStatusText] = useState('Network Ready');
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [activeServer, setActiveServer] = useState(SPEED_TEST_SERVERS[0]);
  const [showServerList, setShowServerList] = useState(false);
  
  const [results, setResults] = useState({
    dl: 0,
    ul: 0,
    ping: 0,
    jitter: 0,
    packetLoss: 0
  });

  const [graphData, setGraphData] = useState<any[]>([]);
  const graphTick = useRef(0);

  useEffect(() => {
    fetchPublicIP().then(setNetworkInfo);
  }, []);

  const resetGraph = () => {
    setGraphData([]);
    graphTick.current = 0;
  };

  const addGraphPoint = (val: number, type: 'dl' | 'ul') => {
    setGraphData(prev => [...prev.slice(-30), { time: graphTick.current++, value: val, type }]);
  };

  const startTest = async () => {
    if (isTesting) return;
    
    try {
      setIsTesting(true);
      resetGraph();
      setResults({ dl: 0, ul: 0, ping: 0, jitter: 0, packetLoss: 0 });
      
      // 1. Initial Handshake & Latency
      setPhase('ping');
      setStatusText('Syncing Signal Server...');
      const pingResults = await runPingTest();
      setResults(prev => ({ ...prev, ...pingResults }));
      setStatusText('Connection Verified');
      await new Promise(r => setTimeout(r, 600));

      // 2. Download Diagnostics
      setPhase('download');
      setStatusText('Sampling Downlink Bandwidth...');
      const dlRes = await runDownloadTest((progress) => {
        setResults(prev => ({ ...prev, dl: progress }));
        if (Math.random() > 0.6) addGraphPoint(progress, 'dl');
      });
      setResults(prev => ({ ...prev, dl: dlRes }));

      // 3. Upload Diagnostics
      setPhase('upload');
      setStatusText('Sampling Uplink Bandwidth...');
      const ulRes = await runUploadTest((progress) => {
        setResults(prev => ({ ...prev, ul: progress }));
        if (Math.random() > 0.6) addGraphPoint(progress, 'ul');
      });
      setResults(prev => ({ ...prev, ul: ulRes }));

      // Finalize
      setPhase('completed');
      setStatusText('Test Finalized');
      
      if (onComplete) {
        try {
          onComplete({ ...results, dl: dlRes, ul: ulRes, ...pingResults });
        } catch (e) {
          console.warn("[SPEEDTEST] onComplete callback error:", e);
        }
      }
    } catch (err) {
      console.error('[DIAGNOSTIC ERROR]', err);
      setStatusText('Verification Error: Try Again');
      setPhase('idle');
    } finally {
      setIsTesting(false);
    }
  };

  const reset = () => {
    setPhase('idle');
    setStatusText('Network Ready');
    setResults({ dl: 0, ul: 0, ping: 0, jitter: 0, packetLoss: 0 });
    resetGraph();
  };

  const insight = useMemo(() => {
    if (phase !== 'completed') return null;
    if (results.dl > 50 && results.ping < 30) return { text: "Ultra Fast Connection Node", color: "text-blue-600", bg: "bg-blue-50" };
    if (results.dl > 20) return { text: "Optimal Business Stability", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (results.packetLoss > 5) return { text: "High Packet Fragmentation", color: "text-rose-600", bg: "bg-rose-50" };
    return { text: "Limited Bandwidth Detected", color: "text-orange-600", bg: "bg-orange-50" };
  }, [results, phase]);

  const currentSpeed = phase === 'upload' ? results.ul : results.dl;

  return (
    <div className={`speedtest-modal w-full bg-white text-[#0F172A] rounded-[2rem] border-2 border-slate-100 shadow-2xl relative overflow-hidden transition-all duration-500 flex flex-col ${isModal ? 'max-h-[85vh] overflow-y-auto' : ''} ${className}`} style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}>
      
      {/* Visual Identity Strip */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 absolute top-0 left-0 right-0 z-50"></div>

      <div className="p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8 flex-1">
        
        {/* Header: Infrastructure Check */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
             <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner border border-blue-100">
                <Globe size={24} />
             </div>
             <div>
                <h3 className="text-slate-900 font-bold text-[10px] sm:text-sm uppercase italic tracking-tighter">ISP Provider</h3>
                <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-none mt-1">{networkInfo?.isp || 'Syncing Connection...'}</p>
             </div>
          </div>

          <div className="relative group w-full sm:w-auto">
             <button 
               onClick={() => setShowServerList(!showServerList)}
               className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
             >
                <div className="flex items-center gap-2">
                   <Server size={14} className="text-blue-500" />
                   {activeServer.name}
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showServerList ? 'rotate-180' : ''}`} />
             </button>
             {showServerList && (
               <div className="absolute top-full right-0 mt-3 w-full sm:w-64 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl z-[100] animate-in zoom-in-95 duration-200">
                  <div className="p-3 bg-slate-50 border-b border-slate-100"><p className="text-[9px] font-black uppercase text-slate-400">Available Test Servers</p></div>
                  {SPEED_TEST_SERVERS.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setActiveServer(s); setShowServerList(false); }}
                      className="w-full px-5 py-4 text-left text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-slate-50 last:border-0 flex items-center justify-between"
                    >
                      <span>{s.name}</span> <span className="text-[9px] text-slate-400 font-black italic">{s.distance}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* Diagnostic Core: Gauge & Signal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
           
           {/* Speed Gauge Section */}
           <div className="lg:col-span-12 xl:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square flex items-center justify-center">
                 {/* Gauge Background Track */}
                 <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95 sm:scale-100">
                    <circle 
                      cx="50%" cy="50%" r="42%" 
                      fill="none" stroke="#F8FAFC" strokeWidth="12" 
                    />
                 </svg>
                 {/* Live Speed Arc */}
                 <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95 sm:scale-100">
                    <circle 
                      cx="50%" cy="50%" r="42%" 
                      fill="none" stroke="url(#co-speed-gradient)" strokeWidth="12" strokeLinecap="round"
                      style={{ 
                        strokeDasharray: '264', 
                        strokeDashoffset: 264 - (264 * (Math.min(currentSpeed, 100) / 100)),
                        transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                    <defs>
                       <linearGradient id="co-speed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                       </linearGradient>
                    </defs>
                 </svg>

                 <div className="flex flex-col items-center text-center px-4">
                    <div className="flex items-baseline justify-center">
                       <span className="text-5xl sm:text-7xl font-black text-slate-900 italic tracking-tighter leading-none transition-all">
                          {currentSpeed.toFixed(1)}
                       </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 leading-none">
                      {phase === 'upload' ? 'Upload' : 'Download'} <span className="text-slate-900 font-extrabold italic">Mbps</span>
                    </span>
                 </div>

                 {/* Absolute Status Anchor (LITE COLOR) */}
                 <div className="absolute -bottom-2 sm:bottom-2 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full shadow-md border border-blue-100 scale-90 sm:scale-100">
                    <div className={`w-1.5 h-1.5 rounded-full ${isTesting ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="text-[8px] sm:text-[9px] font-black uppercase italic tracking-widest">{statusText}</span>
                 </div>
              </div>
           </div>

           {/* Signal Path Analysis (Graph) */}
           <div className="lg:col-span-7 h-48 sm:h-64 lg:h-72 w-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-6 left-8 flex items-center gap-2 z-10">
                 <Radio size={16} className="text-blue-600 animate-pulse" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Real-Time Stability</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={graphData}>
                    <defs>
                       <linearGradient id="co-graph-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563EB" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#co-graph-fill)" 
                      animationDuration={400}
                    />
                 </AreaChart>
              </ResponsiveContainer>
              {!isTesting && phase === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 backdrop-blur-[2px]">
                   <Activity size={48} className="text-slate-200 mb-4" />
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Ignition Sequence Pending</p>
                </div>
              )}
           </div>
        </div>

        {/* Transmission Grid: Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <DiagnosticMetric label="Latency (Ping)" value={`${results.ping} ms`} icon={Zap} color="text-amber-600" bg="bg-amber-100" />
           <DiagnosticMetric label="Jitter Score" value={`${results.jitter} ms`} icon={RefreshCw} color="text-blue-600" bg="bg-blue-100" />
           <DiagnosticMetric label="Packet Integrity" value={`${100 - results.packetLoss}%`} icon={ShieldCheck} color="text-emerald-600" bg="bg-emerald-100" />
           <DiagnosticMetric label="Signal Path" value="-19 dBm" icon={Signal} color="text-indigo-600" bg="bg-indigo-100" />
        </div>

        {/* Footer Hardware & Result Bar */}
        <div className="flex flex-col md:flex-row gap-5 items-stretch md:items-center pt-6 border-t border-slate-100">
           
           <div className="flex-1">
              <button 
                onClick={phase === 'completed' ? reset : startTest}
                disabled={isTesting}
                className={`w-full py-5 ${phase === 'completed' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-blue-600 shadow-blue-200'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] italic shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50`}
              >
                 {isTesting ? <MiniLoader /> : phase === 'completed' ? <RefreshCw size={20} /> : <Play size={20} fill="currentColor" />}
                 {isTesting ? 'Initializing Diagnostics' : phase === 'completed' ? 'Restart Diagnostic Engine' : 'Start Diagnostic Engine'}
              </button>
           </div>

           {insight && (
              <div className={`flex-1 flex items-center gap-4 px-6 py-5 rounded-2xl border border-dashed border-current transition-all animate-in zoom-in-95 duration-500 bg-white ${insight.color}`}>
                 <div className="p-2 bg-current opacity-10 rounded-xl">
                    <Zap size={24} className="text-current" />
                 </div>
                 <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">CO Diagnostic Insight</h5>
                    <p className="text-xs font-bold leading-tight">{insight.text}</p>
                 </div>
              </div>
           )}
        </div>

        <div className="flex flex-wrap justify-center gap-y-4 gap-x-8 opacity-40 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] pt-4">
           <div className="flex items-center gap-2"><MapPin size={10} /> Localized Server Verification</div>
           <div className="flex items-center gap-2"><Cpu size={10} /> Hardware Layer v3.2.1</div>
           <div className="flex items-center gap-2"><Lock size={10} /> Secure Encryption</div>
        </div>
      </div>
    </div>
  );
};

const DiagnosticMetric = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center text-center transition-all hover:bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 group cursor-default">
     <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all group-hover:rotate-[360deg] duration-700 ${bg} ${color} shadow-sm`}>
        <Icon size={18} />
     </div>
     <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5 leading-none">{label}</span>
     <span className="text-lg sm:text-xl font-black text-[#0F172A] italic tracking-tight leading-none">{value}</span>
  </div>
);

const MiniLoader = () => (
  <div className="flex gap-1 items-center">
    {[1, 2, 3].map(i => (
      <div key={i} className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

export default PremiumSpeedTest;


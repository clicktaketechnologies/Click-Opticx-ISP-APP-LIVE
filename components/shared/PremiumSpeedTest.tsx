
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, Play, Activity, Globe, Wifi, 
  ArrowDownCircle, ArrowUpCircle, ShieldCheck, 
  History as HistoryIcon, Server, Zap, AlertTriangle, 
  CheckCircle2, Gauge, RefreshCw, ChevronDown, 
  MapPin, Radio, Signal, Cpu, Network
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  runPingTest, runDownloadTest, runUploadTest, 
  fetchPublicIP, NetworkInfo, SPEED_TEST_SERVERS 
} from '../../utils/speedtest';

interface Props {
  onComplete?: (results: any) => void;
  className?: string;
}

const PremiumSpeedTest: React.FC<Props> = ({ onComplete, className }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [statusText, setStatusText] = useState('Ready to Test');
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
    setGraphData(prev => [...prev.slice(-20), { time: graphTick.current++, value: val, type }]);
  };

  const startTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    resetGraph();
    setResults({ dl: 0, ul: 0, ping: 0, jitter: 0, packetLoss: 0 });
    
    // 1. Ping / Jitter / Loss
    setPhase('ping');
    setStatusText('Establishing handshake...');
    const pingResults = await runPingTest();
    setResults(prev => ({ ...prev, ...pingResults }));
    setStatusText('Measuring latency...');
    await new Promise(r => setTimeout(r, 800));

    // 2. Download
    setPhase('download');
    setStatusText('Measuring download bandwidth...');
    const dlRes = await runDownloadTest((progress) => {
      setResults(prev => ({ ...prev, dl: progress }));
      addGraphPoint(progress, 'dl');
    });
    setResults(prev => ({ ...prev, dl: dlRes }));

    // 3. Upload
    setPhase('upload');
    setStatusText('Measuring upload bandwidth...');
    const ulRes = await runUploadTest((progress) => {
      setResults(prev => ({ ...prev, ul: progress }));
      addGraphPoint(progress, 'ul');
    });
    setResults(prev => ({ ...prev, ul: ulRes }));

    setPhase('completed');
    setStatusText('Test complete');
    setIsTesting(false);
    
    if (onComplete) onComplete({ ...results, dl: dlRes, ul: ulRes, ...pingResults });
  };

  // Smart Insight Logic
  const insight = useMemo(() => {
    if (phase !== 'completed') return null;
    if (results.dl > 50 && results.ping < 30) return { text: "Excellent for 4K Streaming & Gaming", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (results.dl > 20) return { text: "Good for HD Video Calls & Work", color: "text-blue-400", bg: "bg-blue-500/10" };
    if (results.packetLoss > 5) return { text: "High Packet Loss detected - Check hardware", color: "text-rose-400", bg: "bg-rose-500/10" };
    return { text: "Limited connectivity - May lag in heavy tasks", color: "text-amber-400", bg: "bg-amber-500/10" };
  }, [results, phase]);

  const progress = useMemo(() => {
    if (phase === 'idle') return 0;
    if (phase === 'ping') return 10;
    if (phase === 'download') return 10 + (results.dl > 0 ? 40 : 0);
    if (phase === 'upload') return 50 + (results.ul > 0 ? 40 : 0);
    return 100;
  }, [phase, results]);

  const currentSpeed = phase === 'upload' ? results.ul : results.dl;

  return (
    <div className={`relative bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl overflow-hidden ${className}`}>
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col space-y-8">
        
        {/* Header: Network Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                <Globe size={24} />
             </div>
             <div>
                <h3 className="text-white font-bold text-sm">Network Node</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{networkInfo?.isp || 'Detection in progress...'}</p>
             </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 relative">
             <button 
               onClick={() => setShowServerList(!showServerList)}
               className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors"
             >
                <Server size={14} className="text-blue-400" />
                {activeServer.name}
                <ChevronDown size={14} className={`transition-transform ${showServerList ? 'rotate-180' : ''}`} />
             </button>
             {showServerList && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {SPEED_TEST_SERVERS.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setActiveServer(s); setShowServerList(false); }}
                      className="w-full px-4 py-3 text-left text-[10px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all border-b border-white/5 last:border-0"
                    >
                      {s.name} <span className="float-right text-white/20">{s.distance}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* Main Section: Gauge & Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
           
           {/* Speed Gauge */}
           <div className="flex flex-col items-center">
              <div className="relative w-72 h-72 lg:w-80 lg:h-80 flex items-center justify-center">
                 {/* Static Track */}
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                      cx="50%" cy="50%" r="44%" 
                      fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" 
                      strokeDasharray="276" strokeDashoffset="0"
                    />
                 </svg>
                 {/* Progress Arc */}
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                      cx="50%" cy="50%" r="44%" 
                      fill="none" stroke="url(#blue-gradient)" strokeWidth="12" strokeLinecap="round"
                      style={{ 
                        strokeDasharray: '276', 
                        strokeDashoffset: 276 - (276 * (Math.min(currentSpeed, 100) / 100)),
                        transition: 'stroke-dashoffset 0.5s ease-out',
                        filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
                      }}
                    />
                    <defs>
                       <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#6366F1" />
                       </linearGradient>
                    </defs>
                 </svg>

                 <div className="flex flex-col items-center text-center">
                    <div className="flex items-baseline justify-center">
                       <span className="text-6xl lg:text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                          {currentSpeed.toFixed(1)}
                       </span>
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">Mbps {phase === 'upload' ? 'Upload' : 'Download'}</span>
                 </div>

                 {/* Phase Indicator */}
                 <div className="absolute bottom-4 flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isTesting ? 'bg-blue-400' : 'bg-white/20'}`}></div>
                    <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">{statusText}</span>
                 </div>
              </div>
           </div>

           {/* Live Graph */}
           <div className="h-64 lg:h-72 w-full bg-white/5 rounded-3xl border border-white/10 p-6 relative">
              <div className="absolute top-4 left-6 flex items-center gap-2">
                 <Radio size={14} className="text-blue-400 animate-pulse" />
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Spectral Stability Analysis</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={graphData}>
                    <defs>
                       <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVal)" 
                      animationDuration={500}
                    />
                 </AreaChart>
              </ResponsiveContainer>
              {graphData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-white/10 font-black text-xs uppercase tracking-widest italic">Waiting for connection...</div>
              )}
           </div>
        </div>

        {/* Quad Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <MetricBox label="Latency (ms)" value={results.ping} icon={Activity} color="text-emerald-400" bg="bg-emerald-400/10" />
           <MetricBox label="Jitter (ms)" value={results.jitter} icon={RefreshCw} color="text-blue-400" bg="bg-blue-400/10" />
           <MetricBox label="Packet Loss" value={`${results.packetLoss}%`} icon={Radio} color="text-amber-400" bg="bg-amber-400/10" />
           <MetricBox label="Signal @ ONU" value="-19 dBm" icon={Signal} color="text-indigo-400" bg="bg-indigo-400/10" />
        </div>

        {/* IP and Gateway Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <InfoCard label="Public Access IP" value={networkInfo?.publicIp || '0.0.0.0'} icon={Globe} />
           <InfoCard label="Local Gateway" value="192.168.10.1" icon={Network} />
           <InfoCard label="Device Hardware" value="Click-ONU-V3" icon={Cpu} />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
           <button 
             onClick={startTest}
             disabled={isTesting}
             className="flex-1 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {isTesting ? <Activity className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
              {phase === 'completed' ? 'Retest Connection' : 'Execute Diagnostic Test'}
           </button>
           
           {insight && (
              <div className={`flex-1 flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/5 ${insight.bg} ${insight.color} animate-in slide-in-from-right-4`}>
                 <Zap size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{insight.text}</span>
              </div>
           )}
        </div>

        <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Powered by Click Opticx Infrastructure</p>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex flex-col items-center text-center transition-all hover:bg-white/10 group">
     <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${bg} ${color}`}>
        <Icon size={18} />
     </div>
     <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{label}</span>
     <span className="text-xl font-bold text-white italic">{value}</span>
  </div>
);

const InfoCard = ({ label, value, icon: Icon }: any) => (
  <div className="bg-white/[0.03] border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all">
     <Icon size={18} className="text-white/20" />
     <div>
        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-bold text-white/80">{value}</p>
     </div>
  </div>
);

export default PremiumSpeedTest;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, Play, Activity, Globe, Wifi, 
  ArrowDownCircle, ArrowUpCircle, ShieldCheck, 
  History as HistoryIcon, Server, Zap, AlertTriangle, 
  CheckCircle2, Gauge, RotateCw, ChevronDown, 
  MapPin, Radio, Signal, Cpu, Network, X, ArrowRight,
  Lock, CloudLightning, MousePointer2, Database
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer 
} from 'recharts';
import { 
  runPingTest, runDownloadTest, runUploadTest, 
  fetchPublicIP, NetworkInfo, SPEED_TEST_SERVERS 
} from '../../utils/speedtest';
import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

interface Props {
  onComplete?: (results: any) => void;
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

const PremiumSpeedTest: React.FC<Props> = ({ onComplete, onClose, className, isModal }) => {
  const [testState, setTestState] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [phase, setPhase] = useState<'none' | 'ping' | 'download' | 'upload'>('none');
  const [statusText, setStatusText] = useState('System Ready');
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

  const [history, setHistory] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const graphTick = useRef(0);

  useEffect(() => {
    fetchPublicIP().then(setNetworkInfo);
    
    const socket = (db as any).socket;
    const currentUser = db.getState().currentUser;
    
    if (socket && currentUser) {
      socket.emit('join-room', `user_${currentUser.id}`);
      
      socket.on('speedtest:progress', (data: any) => {
        setResults(prev => ({ 
          ...prev, 
          dl: parseFloat(data.download), 
          ul: parseFloat(data.upload),
          ping: parseFloat(data.ping),
          jitter: parseFloat(data.jitter)
        }));
        setPhase(data.phase);
        setStatusText(`${data.phase.toUpperCase()} - ${data.progress}%`);
        addGraphPoint(data.phase === 'upload' ? parseFloat(data.upload) : parseFloat(data.download), data.phase === 'upload' ? 'ul' : 'dl');
      });

      socket.on('speedtest:complete', (data: any) => {
        setPhase('none');
        setStatusText('Handshake Complete');
        setTestState('SUCCESS');
        
        const finalResults = {
           dl: parseFloat(data.download),
           ul: parseFloat(data.upload),
           ping: parseFloat(data.ping),
           jitter: parseFloat(data.jitter),
           packetLoss: 0,
           server: data.server
        };

        setResults(finalResults);
        setHistory(prev => [{ id: Date.now(), ...finalResults }, ...prev]);
        
        if (onComplete) {
           onComplete(finalResults);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('speedtest:progress');
        socket.off('speedtest:complete');
      }
    };
  }, []);

  const resetGraph = () => {
    setGraphData([]);
    graphTick.current = 0;
  };

  const addGraphPoint = (val: number, type: 'dl' | 'ul') => {
    setGraphData(prev => [...prev.slice(-30), { time: graphTick.current++, value: val, type }]);
  };

  const startTest = async () => {
    if (testState === 'TESTING') return;
    
    try {
      const currentUser = db.getState().currentUser;
      if (!currentUser) throw new Error('Authentication Required');

      setTestState('TESTING');
      resetGraph();
      setResults({ dl: 0, ul: 0, ping: 0, jitter: 0, packetLoss: 0 });
      
      setPhase('ping');
      setStatusText('Syncing Signal Server...');

      await fetch('/api/network/speedtest/start', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      
    } catch (err: any) {
      console.error('[DIAGNOSTIC ERROR]', err);
      setStatusText(err.message || 'Network Fault Detected');
      setTestState('ERROR');
    }
  };

  const reset = () => {
    setTestState('IDLE');
    setPhase('none');
    setStatusText('System Ready');
    setResults({ dl: 0, ul: 0, ping: 0, jitter: 0, packetLoss: 0 });
    resetGraph();
  };

  const currentSpeed = phase === 'upload' ? results.ul : results.dl;

  return (
    <div className={`w-full bg-white text-[#0F172A] rounded-3xl md:rounded-[3rem] border-2 border-slate-100 shadow-2xl relative overflow-hidden transition-all duration-500 flex flex-col xl:flex-row ${isModal ? 'max-h-[90vh] overflow-y-auto' : ''} ${className}`}>
      
      <div className="h-1.5 md:h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 absolute top-0 left-0 right-0 z-50"></div>

      <div className="p-5 md:p-12 space-y-8 md:space-y-10 flex-1">
        
        {/* Header Infrastructure */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] bg-slate-900 text-blue-500 flex items-center justify-center shadow-2xl">
                <Globe size={24} />
             </div>
             <div>
                <h3 className="text-slate-900 font-black text-[10px] md:text-xs uppercase italic tracking-tight">Access Point Verification</h3>
                <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mt-1">{networkInfo?.isp || 'Resolving ISP Matrix...'}</p>
             </div>
          </div>

          <div className="relative group w-full sm:w-auto">
             <button 
               onClick={() => setShowServerList(!showServerList)}
               className="flex items-center justify-between sm:justify-start gap-4 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-blue-500 transition-all shadow-sm w-full"
             >
                <div className="flex items-center gap-4">
                  <Server size={16} className="text-blue-500" />
                  {activeServer.name}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${showServerList ? 'rotate-180' : ''}`} />
             </button>
             {showServerList && (
               <div className="absolute top-full right-0 mt-4 w-full sm:w-72 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[100] animate-in zoom-in-95 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Signal Node</p></div>
                  {SPEED_TEST_SERVERS.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setActiveServer(s); setShowServerList(false); }}
                      className="w-full px-6 py-5 text-left text-xs font-black text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all border-b border-slate-50 last:border-0 flex items-center justify-between uppercase italic"
                    >
                      <span>{s.name}</span> <span className="text-[9px] text-slate-400 font-bold">{s.distance}</span>
                    </button>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* Core Gauge */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-center">
           <div className="xl:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[280px] md:max-w-[340px] aspect-square flex items-center justify-center">
                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="6" />
                    <circle 
                      cx="50" cy="50" r="42" 
                      fill="none" stroke="url(#co-speed-gradient)" strokeWidth="6" strokeLinecap="round"
                      style={{ 
                        strokeDasharray: '264', 
                        strokeDashoffset: 264 - (264 * (Math.min(currentSpeed, 100) / 100)),
                        transition: 'stroke-dashoffset 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                        filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.5))'
                      }}
                    />
                    {/* Gauge Needle */}
                    <line 
                      x1="50" y1="50" x2="50" y2="10" 
                      stroke="#2563EB" strokeWidth="2" strokeLinecap="round"
                      style={{ 
                        transformOrigin: '50% 50%',
                        transform: `rotate(${ (currentSpeed / 100) * 360 }deg)`,
                        transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
                      }} 
                    />
                    <circle cx="50" cy="50" r="3" fill="#2563EB" />
                    
                    <defs>
                       <linearGradient id="co-speed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#10B981" />
                       </linearGradient>
                    </defs>
                 </svg>

                 <div className="flex flex-col items-center text-center">
                    <span className="text-6xl md:text-8xl font-black text-slate-900 italic tracking-tighter leading-none">
                       {currentSpeed.toFixed(1)}
                    </span>
                    <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4">
                       {phase === 'none' ? 'READY' : phase.toUpperCase()} <span className="text-slate-900 italic">Mbps</span>
                    </span>
                 </div>

                 <div className="absolute -bottom-2 md:-bottom-4 flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-full shadow-2xl border border-slate-100">
                    <div className={`w-2 h-2 rounded-full ${testState === 'TESTING' ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap">{statusText}</span>
                 </div>
              </div>
           </div>

           <div className="xl:col-span-7 h-48 md:h-80 w-full bg-slate-950 rounded-[2rem] md:rounded-[3rem] border-2 border-slate-900 p-4 md:p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-3 z-10">
                 <CloudLightning size={16} className="text-blue-500 animate-pulse" />
                 <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Stability Matrix</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={graphData}>
                    <defs>
                       <linearGradient id="co-graph-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#co-graph-fill)" 
                      animationDuration={500}
                    />
                 </AreaChart>
              </ResponsiveContainer>
              {testState === 'IDLE' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-950/80 backdrop-blur-sm p-4">
                   <Activity size={40} className="text-slate-800 mb-4" />
                   <p className="text-[8px] md:text-xs font-black text-slate-600 uppercase tracking-[0.5em]">Waiting for Protocol Ignition</p>
                </div>
              )}
           </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
           <DiagnosticMetric label="Latency" value={`${results.ping} ms`} icon={Zap} color="text-blue-500" />
           <DiagnosticMetric label="Jitter" value={`${results.jitter} ms`} icon={RotateCw} color="text-amber-500" />
           <DiagnosticMetric label="Integrity" value={`${100 - results.packetLoss}%`} icon={ShieldCheck} color="text-emerald-500" />
           <DiagnosticMetric label="Signal" value="-18 dBm" icon={Signal} color="text-indigo-500" />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-8 md:pt-10 border-t border-slate-100">
           <button 
             onClick={testState === 'SUCCESS' || testState === 'ERROR' ? startTest : startTest}
             disabled={testState === 'TESTING'}
             className={`flex-[2] py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.4em] italic shadow-2xl transition-all flex items-center justify-center gap-3 md:gap-5 active:scale-95 disabled:opacity-50 ${
                testState === 'SUCCESS' ? 'bg-slate-900 text-white' : 
                testState === 'ERROR' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
             }`}
           >
              {testState === 'TESTING' ? <Mini5GMicroLoader size={20} color="white" /> : <Play size={20} fill="currentColor" />}
              {testState === 'TESTING' ? 'Sampling Node' : testState === 'SUCCESS' ? 'Relaunch' : testState === 'ERROR' ? 'Retry Protocol' : 'Ignite Engine'}
           </button>
           
           {(testState === 'SUCCESS' || testState === 'ERROR') && (
             <button 
               onClick={reset}
               className="flex-1 py-4 md:py-6 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.4em] italic transition-all flex items-center justify-center gap-3 active:scale-95"
             >
               <RotateCw size={18} /> Release Node
             </button>
           )}
           
           {testState === 'SUCCESS' && onClose && (
             <button onClick={onClose} className="flex-1 py-4 md:py-6 bg-slate-100 text-slate-900 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-[0.4em] italic shadow-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-4">
               <CheckCircle2 size={20} className="text-emerald-500" /> Commit Results
             </button>
           )}
        </div>
      </div>

      {/* History Sidebar */}
      <div className="xl:w-96 bg-slate-50 border-t xl:border-t-0 xl:border-l border-slate-100 p-10 flex flex-col shrink-0">
          <h4 className="text-lg font-black uppercase text-slate-900 tracking-tighter mb-10 flex items-center gap-3 italic">
            <HistoryIcon size={24} className="text-blue-500"/> Sequence Log
          </h4>
          <div className="space-y-4 overflow-y-auto max-h-[500px] xl:max-h-none pr-4 custom-scrollbar">
            {history.length === 0 ? (
                <div className="text-center py-20 opacity-30 space-y-4">
                    <Database size={48} className="mx-auto" />
                    <p className="text-[10px] uppercase font-black tracking-widest">No Historical Telemetry</p>
                </div>
            ) : history.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center mb-5">
                        <span className="text-[10px] font-black uppercase text-slate-400">{new Date(item.id).toLocaleTimeString()}</span>
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            <Zap size={12}/> {item.ping}ms
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Downlink</span>
                            <div className="flex items-center gap-2"><ArrowDownCircle size={18} className="text-blue-500"/> <span className="font-black text-2xl text-slate-900 italic tracking-tighter">{item.dl.toFixed(1)}</span></div>
                         </div>
                         <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Uplink</span>
                            <div className="flex items-center justify-end gap-2"><ArrowUpCircle size={18} className="text-emerald-500"/> <span className="font-black text-2xl text-slate-900 italic tracking-tighter">{item.ul.toFixed(1)}</span></div>
                         </div>
                    </div>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};

const DiagnosticMetric = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] flex flex-col items-center text-center transition-all hover:bg-white hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 group">
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 duration-500 bg-white shadow-sm ${color}`}>
        <Icon size={20} />
     </div>
     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</span>
     <span className="text-xl font-black text-slate-900 italic tracking-tight">{value}</span>
  </div>
);

export default PremiumSpeedTest;


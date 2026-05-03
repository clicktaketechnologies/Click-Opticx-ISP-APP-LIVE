import React, { useState, useMemo } from 'react';
import { 
  Network, Server, Database, Zap, 
  Activity, ShieldCheck, ShieldAlert, 
  Search, Plus, RotateCw, BarChart3,
  ArrowRight, Settings, Signal, 
  Cpu, HardDrive, Thermometer,
  Cloud, Globe, Wifi, Radio,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Monitor, Play, Power, HelpCircle, XCircle, Clock
} from 'lucide-react';
import { AppState, NAS, OLT } from '../../types';
import { V2Badge, V2Button, V2Card } from '../../components/v2/UIAtoms';
import { V2SmartTable, V2SlideOver, V2TableRow, V2TableCell } from '../../components/v2/TableAndSlide';
import { usePermissions } from '../../src/hooks/usePermissions';
import { enterpriseApi } from '../../api/client';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is available based on previous work

const NetworkPlaneV2: React.FC<{ state: AppState }> = ({ state }) => {
  const { canEdit } = usePermissions(state);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [nodeType, setNodeType] = useState<'all' | 'NAS' | 'OLT'>('all');
  const [isTesting, setIsTesting] = useState(false);

  // 1. Data Consolidation
  const allNodes = useMemo(() => {
    const nodes = [
      ...(state.nas || []).map(n => ({ ...n, type: 'NAS' as const })),
      ...(state.oltNodes || []).map(o => ({ ...o, type: 'OLT' as const }))
    ];
    return nodes.filter(n => nodeType === 'all' || n.type === nodeType);
  }, [state.nas, state.oltNodes, nodeType]);

  const stats = {
    online: allNodes.filter(n => n.status === 'Connected' || n.status === 'Active').length,
    offline: allNodes.filter(n => n.status === 'Disconnected').length,
    alerts: state.emergencyCount,
    load: state.networkStats?.avgLoad || 0
  };

  return (
    <div className="space-y-10">
      {/* Infrastructure Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <V2Card className="bg-slate-950 text-white shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Activity size={24} />
                </div>
                <V2Badge label="Healthy" color="emerald" variant="solid" icon={ShieldCheck} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Node Status</p>
            <h4 className="text-2xl font-black italic tracking-tighter">{stats.online} / {allNodes.length} Online</h4>
        </V2Card>
        <MiniNetworkStat label="System Latency" value="12ms" sub="Optimal Range" color="emerald" icon={Zap} />
        <MiniNetworkStat label="Infrastructure Load" value={`${stats.load}%`} sub="Avg Cluster Yield" color="blue" icon={Cpu} />
        <MiniNetworkStat label="Active Emergencies" value={stats.alerts} sub="Requires Reset" color="rose" icon={ShieldAlert} />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full max-w-xl">
           <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl shrink-0">
              {(['all', 'NAS', 'OLT'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setNodeType(t)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    nodeType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
           </div>
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search matrix by ID, IP or Name..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
              />
           </div>
        </div>
        <div className="flex gap-3">
            {canEdit('olt-management') && <V2Button label="Poll All Nodes" variant="secondary" icon={RotateCw} />}
            {canEdit('olt-management') && <V2Button label="Provision Node" icon={Plus} />}
        </div>
      </div>

      {/* Topology Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {allNodes.map((node: any) => (
            <V2Card 
                key={node.id} 
                className="hover:-translate-y-2 cursor-pointer"
                onClick={() => { setSelectedNode(node); setIsDetailOpen(true); }}
            >
                <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        node.status === 'Connected' || node.status === 'Active' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-300'
                    }`}>
                        {node.type === 'NAS' ? <Server size={24} /> : <Database size={24} />}
                    </div>
                    <div className="flex items-center gap-2">
                        {node.status === 'Connected' || node.status === 'Active' ? (
                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Online
                            </span>
                        ) : (
                            <V2Badge label="Offline" color="rose" icon={XCircle} />
                        )}
                    </div>
                </div>
                <div className="mb-6">
                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-1 leading-none">{node.name || node.alias}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={10} /> {node.ip || node.host}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Load Factor</p>
                        <p className="text-sm font-black text-slate-900 italic">{node.cpu || '12%'}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Temperature</p>
                        <p className="text-sm font-black text-emerald-600 italic">{node.temp || '38°C'}</p>
                    </div>
                </div>
            </V2Card>
         ))}
      </div>

      {/* Node Detail Slide-Over */}
      <V2SlideOver
        isOpen={isDetailOpen && !!selectedNode}
        onClose={() => setIsDetailOpen(false)}
        title={selectedNode?.name || selectedNode?.alias || ''}
        subtitle={`${selectedNode?.type} Node Transmission Plane`}
        footer={
            canEdit('olt-management') ? (
                <div className="flex gap-4">
                    <V2Button 
                        label={isTesting ? "Testing..." : "Test Connectivity"} 
                        variant="secondary" 
                        className="flex-1" 
                        icon={isTesting ? RotateCw : Zap} 
                        onClick={async () => {
                            if (!selectedNode) return;
                            setIsTesting(true);
                            try {
                                const protocol = selectedNode.type === 'NAS' ? 'MIKROTIK' : 'SNMP';
                                const res = await enterpriseApi.testDevice(
                                    selectedNode.ip || selectedNode.host,
                                    protocol,
                                    { 
                                        username: selectedNode.username || 'admin', 
                                        password: selectedNode.password || '',
                                        community: 'public'
                                    }
                                );
                                if (res.success) {
                                    alert('Diagnostic Handshake Successful: ' + JSON.stringify(res.data));
                                } else {
                                    alert('Diagnostic Failure: ' + res.message);
                                }
                            } catch (e: any) {
                                alert('Network Fault: ' + e.message);
                            } finally {
                                setIsTesting(false);
                            }
                        }}
                    />
                    <V2Button label="Reset Node" variant="danger" className="flex-1" icon={Power} />
                </div>
            ) : undefined
        }
      >
        {selectedNode && (
            <div className="space-y-10">
                {/* Visual Status Indicator */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase italic tracking-widest">REAL-TIME TELEMETRY</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live stream from node: {selectedNode.id}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                             <TelemetryBit icon={Signal} label="Signal Yield" value="98.2%" color="emerald" />
                             <TelemetryBit icon={Cpu} label="Core Usage" value={`${selectedNode.cpu || '14%'}`} color="blue" />
                             <TelemetryBit icon={Thermometer} label="Thermal Status" value={`${selectedNode.temp || '39°C'}`} color="amber" />
                        </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                </div>

                {/* Info Matrix */}
                <div className="grid grid-cols-2 gap-6">
                    <InfoCard icon={Globe} label="Access IP" value={selectedNode.ip || selectedNode.host} />
                    <InfoCard icon={Settings} label="Firmware" value="v6.49.10" />
                    <InfoCard icon={Clock} label="Uptime Duration" value="14d 06h 12m" />
                    <InfoCard icon={Network} label="Interface Protocol" value={selectedNode.type === 'NAS' ? 'API / SSH' : 'SNMP v2c'} />
                </div>

                {/* Sub-Nodes / Ports (Example for OLT) */}
                {selectedNode.type === 'OLT' && (
                    <V2Card title="Port Matrix (PON)" className="bg-slate-50/50">
                        <div className="grid grid-cols-4 gap-4 mt-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                                <div key={p} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">P-{p}</span>
                                    <div className={`w-3 h-3 rounded-full ${p < 7 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                </div>
                            ))}
                        </div>
                    </V2Card>
                )}

                {/* Diagnostic Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <V2Button label="Trace Route" variant="secondary" icon={ArrowUpRight} className="w-full" />
                    <V2Button label="Port Scan" variant="secondary" icon={ShieldAlert} className="w-full" />
                </div>
            </div>
        )}
      </V2SlideOver>
    </div>
  );
};

const MiniNetworkStat = ({ label, value, sub, color, icon: Icon }: any) => {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-500 bg-blue-50 border-blue-100',
        rose: 'text-rose-500 bg-rose-50 border-rose-100',
    };
    return (
        <V2Card className="p-6">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <Activity size={16} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{sub}</p>
            </div>
        </V2Card>
    );
};

const InfoCard = ({ icon: Icon, label, value }: any) => (
    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
        <div className="flex items-center gap-3 mb-3">
            <Icon size={14} className="text-blue-500" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
    </div>
);

const TelemetryBit = ({ icon: Icon, label, value, color }: any) => {
    const colors: any = {
        emerald: 'text-emerald-400',
        blue: 'text-blue-400',
        amber: 'text-amber-400',
    };
    return (
        <div className="flex flex-col items-center text-center">
            <Icon size={20} className={`${colors[color]} mb-3`} />
            <p className="text-lg font-black italic">{value}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
};

const XCircle = ({ className, size }: any) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

export default NetworkPlaneV2;

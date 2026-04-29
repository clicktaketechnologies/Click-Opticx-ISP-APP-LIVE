import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ShieldCheck, ShieldAlert, Globe, Zap, 
  Clock, ArrowRightLeft, CheckCircle2, XCircle, 
  Terminal, RefreshCcw, Search, Filter, 
  CreditCard, Smartphone, Banknote, Landmark
} from 'lucide-react';
import { AppState, PaymentGateway } from '../types';
import { db } from '../db';
import { io, Socket } from 'socket.io-client';

const FiscalMonitor: React.FC<{ state: AppState }> = ({ state }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);

  useEffect(() => {
    // 1. Fetch current gateway health
    fetchGateways();

    // 2. Connect to real-time socket
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
    
    socket.on('connect', () => {
        socket.emit('authenticate', { role: 'admin' });
    });

    socket.on('payment_update', (data) => {
        if (isLive) setEvents(prev => [{ type: 'SUCCESS', ...data }, ...prev].slice(0, 50));
    });

    socket.on('payment_failed', (data) => {
        if (isLive) setEvents(prev => [{ type: 'FAILURE', ...data }, ...prev].slice(0, 50));
    });

    socket.on('webhook_event', (data) => {
        if (isLive) setEvents(prev => [{ type: 'WEBHOOK', ...data }, ...prev].slice(0, 50));
    });

    return () => {
        socket.disconnect();
    };
  }, [isLive]);

  const fetchGateways = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/provider-mgmt/gateways`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) setGateways(data.gateways);
    } catch (e) {
        console.error('Failed to fetch gateway status');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
        !searchTerm || 
        (e.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.method?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [events, searchTerm]);

  const getGatewayIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('stripe')) return <Globe className="text-blue-500" size={20} />;
    if (m.includes('jazz')) return <Smartphone className="text-rose-500" size={20} />;
    if (m.includes('paisa')) return <Smartphone className="text-green-500" size={20} />;
    if (m.includes('cash')) return <Banknote className="text-slate-500" size={20} />;
    return <CreditCard className="text-slate-400" size={20} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Activity className="text-blue-600" size={32} />
            Fiscal Pulse Monitor
          </h2>
          <p className="text-slate-500 font-medium">Real-time gateway telemetry and transaction handshake audit.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[10px] font-black uppercase text-slate-700">{isLive ? 'Live Stream: ACTIVE' : 'Stream Paused'}</span>
            </div>
            <button 
                onClick={() => setIsLive(!isLive)}
                className={`p-3 rounded-xl border transition-all ${isLive ? 'bg-white text-slate-400 border-slate-200' : 'bg-blue-600 text-white border-blue-500'}`}
            >
                <Zap size={20} className={isLive ? '' : 'fill-white'} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* STAT CARDS */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Healthy Nodes</p>
                      <h3 className="text-4xl font-black italic">{gateways.filter(g => g.status === 'Connected').length} / {gateways.length}</h3>
                  </div>
                  <ShieldCheck className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform" size={140} />
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Stream Events</p>
                      <h3 className="text-4xl font-black text-slate-900 italic">{events.length}</h3>
                  </div>
                  <Terminal className="absolute -right-6 -bottom-6 opacity-5 text-slate-900 group-hover:scale-110 transition-transform" size={140} />
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">NOC Status</p>
                      <h3 className="text-4xl font-black text-green-500 italic uppercase">OPTIMAL</h3>
                  </div>
                  <CheckCircle2 className="absolute -right-6 -bottom-6 opacity-5 text-green-500 group-hover:scale-110 transition-transform" size={140} />
              </div>
          </div>

          {/* GATEWAY HEALTH LIST */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-500 flex items-center justify-between">
                  Gateway Health 
                  <RefreshCcw size={12} className="cursor-pointer hover:rotate-180 transition-all" onClick={fetchGateways} />
              </h4>
              <div className="space-y-4">
                  {gateways.length === 0 ? (
                      <p className="text-[10px] text-slate-600 font-bold uppercase italic">Syncing nodes...</p>
                  ) : gateways.map(g => (
                      <div key={g.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${g.enabled ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                              <span className="text-[10px] font-black uppercase text-slate-300">{g.name}</span>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${g.status === 'Connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {g.status || 'OFFLINE'}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-widest"
                      placeholder="Search live stream..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  <button className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">All Traffic</button>
                  <button className="px-6 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Success Only</button>
                  <button className="px-6 py-3 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Webhooks</button>
              </div>
          </div>

          <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[600px] custom-scrollbar bg-slate-50/50">
              {filteredEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 text-center">
                      <Terminal size={64} className="mb-4 text-slate-400" />
                      <p className="text-sm font-black uppercase tracking-widest italic">Waiting for fiscal telemetry...</p>
                      <p className="text-[10px] mt-2">Active handshake listeners established on port 5000.</p>
                  </div>
              ) : (
                  filteredEvents.map((event, idx) => (
                      <div key={idx} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                          event.type === 'SUCCESS' ? 'bg-white border-green-50 shadow-green-100/50 shadow-lg' : 
                          event.type === 'FAILURE' ? 'bg-white border-red-50 shadow-red-100/50 shadow-lg' : 
                          'bg-white border-blue-50 shadow-blue-100/50 shadow-lg'
                      }`}>
                          <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                                  event.type === 'SUCCESS' ? 'bg-green-500 text-white' : 
                                  event.type === 'FAILURE' ? 'bg-red-500 text-white' : 
                                  'bg-blue-600 text-white'
                              }`}>
                                  {event.type === 'SUCCESS' ? <CheckCircle2 size={24} /> : 
                                   event.type === 'FAILURE' ? <XCircle size={24} /> : 
                                   <ArrowRightLeft size={24} />}
                              </div>
                              <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                          event.type === 'SUCCESS' ? 'bg-green-50 text-green-600' : 
                                          event.type === 'FAILURE' ? 'bg-red-50 text-red-600' : 
                                          'bg-blue-50 text-blue-600'
                                      }`}>{event.type}</span>
                                      <h5 className="text-sm font-black text-slate-900 uppercase italic">{event.user_name || 'System Operator'}</h5>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                          {getGatewayIcon(event.method || event.gatewayId || '')}
                                          <span className="text-[10px] font-bold text-slate-500 uppercase">{event.method || event.gatewayId}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Clock size={12} className="text-slate-300" />
                                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="text-right space-y-1">
                              <p className={`text-xl font-black italic ${event.type === 'FAILURE' ? 'text-red-600' : 'text-slate-900'}`}>
                                  {event.type === 'WEBHOOK' ? 'EVENT' : `Rs. ${event.amount?.toLocaleString()}`}
                              </p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{event.id || event.error || 'Handshake Complete'}</p>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};

export default FiscalMonitor;

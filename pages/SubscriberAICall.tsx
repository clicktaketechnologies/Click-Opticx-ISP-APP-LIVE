
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db';
import { ISPUser, AppState, ConnectionStatus, TicketStatus } from '../types';
import { 
  Mic, MicOff, PhoneOff, ArrowLeft, RefreshCw, 
  ShieldCheck, AlertTriangle, Activity, Headphones, 
  Sparkles, History, Volume2, Globe, Clock, Zap, 
  CheckCircle, ShieldAlert, CreditCard, Gauge, 
  User as UserIcon, X, Phone, Star, MessageSquare,
  Network, AlertCircle, ChevronRight, HeadphonesIcon, VolumeX, Bot, Terminal
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

type CallPhase = 'landing' | 'connecting' | 'active' | 'summary' | 'closed';

const SubscriberAICall: React.FC<Props> = ({ user, state, onBack }) => {
  const [phase, setPhase] = useState<CallPhase>('landing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(15).fill(5));
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [orchestratorLogs, setOrchestratorLogs] = useState<string[]>(['Operational node standing by...']);
  
  const callConfig = state.settings.aiCallConfig;

  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): any => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const isWithinOfficeHours = () => {
    if (!callConfig.officeHours.enabled) return true;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    return time >= callConfig.officeHours.start && time <= callConfig.officeHours.end;
  };

  const initializeCallOrchestrator = useCallback(async () => {
    setPhase('connecting');
    setOrchestratorLogs(['Initializing heuristic relay...', 'Scanning regional NOC state...']);

    if (!isWithinOfficeHours()) {
        setOrchestratorLogs(prev => [...prev, 'CRITICAL: Support hours restricted.']);
        setTimeout(() => setPhase('closed'), 2000);
        return;
    }
    
    try {
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
      inputAudioContextRef.current = inputAudioContext;

      const currentPkg = state.packages.find(p => p.id === user.packageId);
      const activeOutage = state.nocEvents.find(e => e.area === user.area && e.status === 'Active');
      const activeEL = state.emergencyLoads.find(l => l.userId === user.id && !l.repaid);
      
      const context = {
         subscriberTier: currentPkg?.name || 'Unassigned',
         expiryDate: user.expiryDate || 'N/A',
         balance: user.balance,
         elStatus: activeEL ? 'Active Debt' : 'Clean',
         nodeHealth: activeOutage ? 'DEGRADED_OUTAGE' : 'OPTIMAL',
         area: user.area,
         creditScore: user.creditScore,
         language: callConfig.language,
         persona: callConfig.persona
      };

      setOrchestratorLogs(prev => [...prev, 'Identity Synthesized.', 'Binding Heuristic Decision Tree...']);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are a high-performance AI Support Orchestrator for ${state.settings.branding.businessName}.
      PERSONALITY: ${context.persona}. Tone: Precise, Industrial, Helpful.
      LANGUAGE: ${context.language}.
      
      SUBSCRIBER REGISTRY:
      Name: ${user.name} (${user.connectionId}).
      Node Area: ${context.area}.
      Network Status: ${context.nodeHealth}.
      Fiscal: Balance Rs. ${context.balance}, Credit Score ${context.creditScore}.
      
      HEURISTIC DECISION TREES (MANDATORY):
      
      TRE_1: INTERNET FAULT
      - Check Outage: If ${context.nodeHealth} == DEGRADED, inform user and END call politely.
      - Device Check: If NO outage, ASK: "Is the PON light red or blinking?"
      - Fiber Issue: If RED, suggest "Create Technical Ticket".
      - Power Check: If GREEN, ASK: "Is power light off?". Suggest REBOOT if OFF.
      
      TRE_2: BILLING DISPUTE
      - Check Balance: If ${context.balance} > 0, explain the outstanding amount.
      - Agitation Logic: If user is angry, ESCALATE to human.
      
      TRE_3: EMERGENCY RESCUE (EL)
      - Check Score: If ${context.creditScore} < 600, explain "Node Ineligible".
      - Provision: If Eligible, explain 72-hour grace and ACTIVATE.
      
      MANDATORY VOICE RULES:
      - Use short, voice-ready responses. No lists.
      - Act as the official Registry Voice Node. Never mention you are AI.`;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setPhase('active');
            setDuration(0);
            timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
              if (isMuted) return;
              const inputData = event.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              
              const avg = inputData.reduce((a,b) => a + Math.abs(b), 0) / inputData.length;
              setVisualizerBars(prev => prev.map(() => 10 + Math.random() * (avg * 1200)));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setAiIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setAiIsSpeaking(false);
              };
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live AI Node Error:", e);
            setPhase('landing');
          },
          onclose: () => setPhase('summary')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: callConfig.voiceName } } },
          systemInstruction
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setPhase('landing');
    }
  }, [user, state, callConfig, isMuted]);

  const endCall = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    
    if (duration > 2) {
      db.addCallLog({
        userId: user.id, userName: user.name, duration,
        timestamp: new Date().toISOString(), topics: ['Heuristic Troubleshooting'],
        confidence: 0.96, escalationNeeded: duration > 300,
        sentimentStart: 'Neutral', sentimentEnd: 'Satisfied',
        resolutionType: 'Self-Fix', subarea: user.area
      });
    }
    setPhase('summary');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-20 space-y-6">
      {phase === 'landing' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <header className="flex items-center gap-4 px-2">
              <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm active:scale-90 transition-all">
                 <ArrowLeft size={20} />
              </button>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Voice AI Hub</h2>
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Shared Intelligence Link</p>
              </div>
           </header>

           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border-2 border-indigo-100 shadow-inner">
                    <Headphones size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase">Unified Voice Support</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed max-w-xs mx-auto">
                    Registry-synced troubleshooting. Speak naturally to diagnose link faults or billing disputes.
                 </p>
              </div>

              <button 
                onClick={initializeCallOrchestrator}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                 <Phone size={22} fill="currentColor" /> Initialize Link
              </button>
           </div>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500 h-full">
           <div className="w-48 h-48 bg-amber-50 rounded-[3.5rem] border-[10px] border-white shadow-2xl flex items-center justify-center relative">
              <RefreshCw size={80} className="text-amber-500 animate-spin" />
              <div className="absolute inset-0 rounded-[3rem] border-4 border-amber-500/20 animate-ping"></div>
           </div>
           <div className="text-center space-y-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Establishing Relay...</h3>
              <div className="w-full max-w-xs space-y-2">
                 {orchestratorLogs.slice(-2).map((log, i) => (
                    <p key={i} className="text-[8px] text-indigo-600 font-black uppercase tracking-[0.4em] animate-pulse">» {log}</p>
                 ))}
              </div>
           </div>
        </div>
      )}

      {phase === 'active' && (
        <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-right duration-500 h-full">
           <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white flex items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md shrink-0">
                 <UserIcon size={32} />
              </div>
              <div className="flex-1 min-w-0">
                 <h4 className="text-lg font-black italic tracking-tighter uppercase leading-none mb-1">{user.name.split(' ')[0]} 👋</h4>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">Heuristic Loop: Active</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-emerald-400 italic mb-1">{formatTime(duration)}</p>
                 <div className="flex items-center gap-1 justify-end">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[7px] font-black uppercase text-slate-500">Live Relay</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                 <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-500 ${aiIsSpeaking ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110' : 'bg-slate-50 text-slate-300'}`}>
                    <Volume2 size={48} className={aiIsSpeaking ? 'animate-pulse' : ''} />
                 </div>
                 <h5 className={`text-sm font-black uppercase tracking-widest ${aiIsSpeaking ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {aiIsSpeaking ? 'Registry Response Active' : 'Listening to Node...'}
                 </h5>
              </div>

              <div className="flex items-end gap-1.5 h-20 relative z-10">
                 {visualizerBars.map((h, i) => (
                   <div key={i} className={`w-1.5 rounded-full transition-all duration-150 ${aiIsSpeaking ? 'bg-indigo-500/40' : 'bg-indigo-600'}`} style={{ height: `${h}%` }}></div>
                 ))}
              </div>
              <Activity className="absolute -right-20 -bottom-20 opacity-[0.02] scale-[3]" size={200} />
           </div>

           <div className="grid grid-cols-2 gap-4 pb-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center justify-center gap-2 py-6 rounded-[2rem] transition-all border-2 ${isMuted ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                 {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                 <span className="text-[8px] font-black uppercase">Mute</span>
              </button>
              <button onClick={endCall} className="flex flex-col items-center justify-center gap-2 py-6 bg-rose-600 text-white rounded-[2rem] shadow-xl shadow-rose-100 active:scale-95 transition-all">
                 <PhoneOff size={24} fill="currentColor"/>
                 <span className="text-[8px] font-black uppercase">End Protocol</span>
              </button>
           </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-sm shadow-2xl p-10 text-center space-y-8 animate-in zoom-in duration-300 border-[8px] border-slate-50">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border-4 border-emerald-100 animate-bounce">
                 <CheckCircle size={56} strokeWidth={3}/>
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Session Closed</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Handshake History Logged</p>
              </div>
              <button onClick={onBack} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">Return to Hub</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SubscriberAICall;

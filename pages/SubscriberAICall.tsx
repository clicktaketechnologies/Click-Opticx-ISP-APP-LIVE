import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db';
import { ISPUser, AppState } from '../types';
import {
  Mic, MicOff, PhoneOff, ArrowLeft, RefreshCw,
  Activity, Headphones, Volume2, Globe, Zap,
  CheckCircle, User as UserIcon, X, Phone,
  AlertCircle, Bot, Loader2
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

type CallPhase = 'landing' | 'connecting' | 'active' | 'summary';

const SubscriberAICall: React.FC<Props> = ({ user, state, onBack }) => {
  const [phase, setPhase] = useState<CallPhase>('landing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(15).fill(10));
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const initializeCall = useCallback(async () => {
    setErrorMessage(null);
    setPhase('connecting');

    try {
      if (!process.env.API_KEY) throw new Error("AI Service is currently unavailable. (API_KEY_MISSING)");

      // Setup Output Context (24kHz for Gemini TTS)
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await outputAudioContext.resume();
      audioContextRef.current = outputAudioContext;

      // Setup Input Context (16kHz for Gemini STT)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await inputAudioContext.resume();
      inputAudioContextRef.current = inputAudioContext;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are the Support AI for ${state.settings.branding.businessName}. 
      Subscriber: ${user.name} (${user.connectionId}). Balance: ${user.balance}. 
      Persona: ${callConfig.persona}. Speak naturally.`;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setPhase('active');
            timerRef.current = window.setInterval(() => setDuration(d => d + 1), 1000);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (event) => {
              if (isMuted) return;
              const inputData = event.inputBuffer.getChannelData(0);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createBlob(inputData) }));

              // Pulsing Visualizer
              const avg = inputData.reduce((a, b) => a + Math.abs(b), 0) / inputData.length;
              setVisualizerBars(prev => prev.map(() => Math.max(10, avg * 800 + Math.random() * 15)));
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
          },
          onerror: () => setErrorMessage("AI service is currently unavailable. Please try again later."),
          onclose: () => setPhase('summary')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: callConfig.voiceName } } },
          systemInstruction
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setErrorMessage("Microphone access or AI link failed.");
      setPhase('landing');
    }
  }, [user, state, callConfig, isMuted]);

  const endCall = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) { }
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch (e) { }
      inputAudioContextRef.current = null;
    }
    setPhase('summary');
  }, []);

  // Lifecycle Cleanup
  useEffect(() => {
    return () => {
      if (sessionRef.current || audioContextRef.current || inputAudioContextRef.current) {
        if (sessionRef.current) try { sessionRef.current.close(); } catch (e) { }
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioContextRef.current) try { audioContextRef.current.close(); } catch (e) { }
        if (inputAudioContextRef.current) try { inputAudioContextRef.current.close(); } catch (e) { }
      }
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-20">
      {phase === 'landing' && (
        <div className="space-y-8">
          <header className="flex items-center gap-4 px-2 pt-4">
            <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">AI Voice Call</h2>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Status: Ready</p>
            </div>
          </header>

          {errorMessage && (
            <div className="mx-2 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in shake">
              <AlertCircle size={20} />
              <p className="text-[10px] font-black uppercase">{errorMessage}</p>
            </div>
          )}

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-indigo-100 shadow-inner">
              <Headphones size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Start a conversation</h3>
            <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed max-w-xs mx-auto">
              Speak naturally to troubleshoot your connection or check your billing status.
            </p>
            <button
              onClick={initializeCall}
              className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Phone size={20} fill="currentColor" /> Initialize Call
            </button>
          </div>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in h-full">
          <Mini5GMicroLoader size={80} />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Syncing AI Node...</p>
        </div>
      )}

      {phase === 'active' && (
        <div className="flex-1 flex flex-col space-y-6 h-full animate-in slide-in-from-right duration-500">
          <div className="bg-slate-950 rounded-[2.5rem] p-6 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                <UserIcon size={24} />
              </div>
              <div>
                <h4 className="font-black uppercase italic tracking-tighter">{user.name}</h4>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active Connection • {user.connectionId}</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-xl font-black text-emerald-400 italic tabular-nums">{formatTime(duration)}</p>
            </div>
            <Activity className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={140} />
          </div>

          <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
            <div className="relative z-10">
              <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto transition-all duration-500 ${aiIsSpeaking ? 'bg-indigo-600 text-white scale-110 shadow-2xl shadow-indigo-100' : 'bg-slate-50 text-slate-300'}`}>
                {aiIsSpeaking ? <Volume2 size={56} className="animate-pulse" /> : <Bot size={56} />}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-6 transition-colors ${aiIsSpeaking ? 'text-indigo-600' : 'text-slate-400'}`}>
                {aiIsSpeaking ? 'AI Responding' : 'Listening...'}
              </p>
            </div>

            <div className="flex items-end gap-2 h-32">
              {visualizerBars.map((h, i) => (
                <div key={i} className={`w-2 rounded-full transition-all duration-150 ${aiIsSpeaking ? 'bg-indigo-500/20' : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center justify-center gap-2 py-6 rounded-[2.5rem] transition-all border-2 ${isMuted ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
              <span className="text-[9px] font-black uppercase tracking-widest">{isMuted ? 'Mic Muted' : 'Mic Active'}</span>
            </button>
            <button onClick={endCall} className="flex flex-col items-center justify-center gap-2 py-6 bg-rose-600 text-white rounded-[2.5rem] shadow-xl active:scale-95 transition-all">
              <PhoneOff size={28} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-widest">End Call</span>
            </button>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[2000] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-sm shadow-2xl p-12 text-center space-y-10 animate-in zoom-in border-[8px] border-slate-50">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce border-4 border-white">
              <CheckCircle size={56} strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Session Complete</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4">Registry Timeline Action Recorded</p>
            </div>
            <button onClick={onBack} className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Exit Module</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriberAICall;

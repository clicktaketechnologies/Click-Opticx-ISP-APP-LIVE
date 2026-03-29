import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState, ISPUser, TicketStatus } from '../../types';
import { Send, Bot, User, Loader2, Sparkles, X, History, MessageSquare, Headphones, AlertTriangle, Phone, ExternalLink } from 'lucide-react';

const SubscriberAIChat: React.FC<{ user: ISPUser, state: AppState }> = ({ user, state }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, type?: 'action' | 'standard' }[]>([
    { role: 'model', text: `As-salamu alaykum ${user.name.split(' ')[0]}! I am your Unified Support Engine. How can I assist you with your link today?`, type: 'standard' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    setAiError(null);

    try {
      if (!process.env.API_KEY) throw new Error("API_KEY_MISSING");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const activeOutage = state.nocEvents.find(e => e.area === user.area && e.status === 'Active');
      const currentPkg = state.packages.find(p => p.id === user.packageId);
      
      const context = `You are the Unified AI Brain for ${state.settings.branding.businessName}.
      This subscriber is chatting via the Digital Hub.
      IDENTITY: ${user.name} (${user.connectionId}).
      AREA: ${user.area} (Infrastructure Health: ${activeOutage ? 'DEGRADED' : 'OPTIMAL'}).
      FISCAL: Balance Rs. ${user.balance}.
      PLAN: ${currentPkg?.name || 'NOT ASSIGNED'}.
      
      SHARED INTELLIGENCE PROTOCOLS:
      1. If the area has an active NOC incident, mention it immediately as the probable cause.
      2. If balance is > 0, politely explain that service requires settlement.
      3. For complex technical issues, offer to transition to an "AI Voice Call" or "Open a Support Ticket".
      
      STYLE: Industrial, professional, uppercase where appropriate.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction: context }
      });

      const aiText = response.text || "AI Service is currently unavailable. Please try again later.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      
      // Heuristic action suggestion logic
      if (aiText.toLowerCase().includes('call') || aiText.toLowerCase().includes('ticket')) {
         setMessages(prev => [...prev, { 
            role: 'model', 
            text: "Would you like to initialize a Voice Handshake or open a Ticket node now?", 
            type: 'action' 
         }]);
      }

    } catch (err: any) {
      console.error("AI Node Error:", err);
      const errorMsg = "AI Service is currently unavailable. Please try again later.";
      setAiError(errorMsg);
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, state.settings.branding.businessName, user, state.packages, state.nocEvents]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      <header className="p-4 sm:p-8 bg-slate-900 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
         <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
               <Bot size={28} />
            </div>
            <div>
               <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight italic leading-none">Strategic QNA Protocol</h3>
               <p className="text-[9px] text-green-400 font-black uppercase tracking-[0.4em] mt-1">Autonomous Knowledge Node</p>
            </div>
         </div>
         <button className="relative z-10 p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24}/></button>
         <Sparkles className="absolute -right-4 -bottom-4 opacity-5" size={140} />
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-slate-50/50" ref={scrollRef}>
         {messages.map((m, i) => (
           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm border ${m.role === 'user' ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'}`}>
                 <div className="flex items-center gap-2 mb-2 opacity-40">
                    {m.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                    <span className="text-[8px] font-black uppercase tracking-widest">{m.role}</span>
                 </div>
                 <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{m.text}</p>
                 
                 {m.type === 'action' && (
                   <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button className="flex-1 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-xl text-[10px] sm:text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                         <Phone size={14}/> AI Call
                      </button>
                      <button className="flex-1 px-4 py-3 sm:py-2 bg-slate-900 text-white rounded-xl text-[10px] sm:text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                         <ExternalLink size={14}/> Ticket
                      </button>
                   </div>
                 )}
              </div>
           </div>
         ))}
         {isLoading && (
           <div className="flex justify-start">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <Mini5GMicroLoader size={16} />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Synthesizing Logic...</span>
              </div>
           </div>
         )}
         {aiError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake">
               <AlertTriangle size={16} />
               <p className="text-[9px] font-black uppercase tracking-widest">{aiError}</p>
            </div>
         )}
      </div>

      <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
         <div className="relative flex items-center gap-3">
            <input 
              className="flex-1 pl-4 sm:pl-6 pr-14 py-4 sm:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm uppercase placeholder:lowercase"
              placeholder="Query the hybrid node..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-4 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-50"
            >
               <Send size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default SubscriberAIChat;


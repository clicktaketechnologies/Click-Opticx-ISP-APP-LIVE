import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { db } from '../../db';
import { TicketPriority, TicketStatus } from '../../types';
import { 
  Headphones, MessageSquare, Plus, ChevronRight, Phone, Mail, Globe, 
  ShieldCheck, Activity, LifeBuoy, X, Send, Clock, AlertTriangle, RotateCw
} from 'lucide-react';
import Modal from '../shared/Modal';

const SubscriberSupport: React.FC = () => {
  const state = db.getState();
  const user = state.currentUser;
  const cfg = state.settings.support;
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical' as any,
    priority: TicketPriority.MEDIUM,
    description: ''
  });

  const userTickets = state.tickets.filter(t => t.userId === user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) return;
    
    setIsSubmitting(true);
    await db.submitTicket({
      userId: user.id,
      userName: user.name,
      ...formData
    });
    setIsSubmitting(false);
    setShowTicketForm(false);
    setFormData({ subject: '', category: 'Technical', priority: TicketPriority.MEDIUM, description: '' });
    // Fixed: Expected 4 arguments, but got 3. Added user.id as targetId.
    db.logNotification(user.id, 'success', 'Ticket Submitted', 'Your support request has been submitted.');
  };

  const getStatusColor = (s: TicketStatus) => {
    switch(s) {
      case TicketStatus.OPEN: return 'bg-blue-600 text-white';
      case TicketStatus.RESOLVED: return 'bg-green-600 text-white';
      case TicketStatus.CLOSED: return 'bg-slate-200 text-slate-500';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white border border-white/5 shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="space-y-4 max-w-md">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Help & Support</h2>
              <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase pt-2">Our support team is available during {cfg.workingHoursWeekdays} (Weekdays) and {cfg.workingHoursWeekends} (Weekends). Connect with a human agent for any internet related queries.</p>
              <div className="flex items-center gap-3 text-green-400">
                 <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)] ${cfg.emergencySupport ? 'bg-green-400' : 'bg-rose-50'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Support Status: {cfg.emergencySupport ? 'Available' : 'Offline'}</span>
              </div>
           </div>
           <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center text-blue-400 shadow-2xl relative border border-white/10 backdrop-blur-md">
              <Headphones size={80} className="group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/20 animate-spin-slow"></div>
           </div>
        </div>
        <Activity className="absolute -right-8 -bottom-8 opacity-5 scale-150 pointer-events-none" size={240} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <MessageSquare size={16} className="text-blue-600"/> Contact Options
            </h3>
            <div className="space-y-4">
               {[
                 { label: 'WhatsApp', icon: MessageSquare, sub: cfg.whatsapp, color: 'text-green-500', bg: 'bg-green-50' },
                 { label: 'Phone', icon: Phone, sub: cfg.phone, color: 'text-blue-500', bg: 'bg-blue-50' },
                 { label: 'Email', icon: Mail, sub: cfg.email, color: 'text-rose-500', bg: 'bg-rose-50' }
               ].map(chan => (
                 <button key={chan.label} className="w-full p-6 bg-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-600">
                    <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 ${chan.bg} ${chan.color} rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform`}><chan.icon size={24}/></div>
                       <div className="text-left">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{chan.label}</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{chan.sub}</p>
                       </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" size={18} />
                 </button>
               ))}
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <LifeBuoy size={16} className="text-blue-600"/> Support Tickets
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar max-h-[300px] pr-2">
               {userTickets.map(t => (
                 <div key={t.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-600 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.id}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${getStatusColor(t.status)}`}>{t.status}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase truncate leading-none">{t.subject}</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-2">{new Date(t.createdAt).toLocaleDateString()} • {t.category}</p>
                 </div>
               ))}
               {userTickets.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                    <Clock size={32} className="text-slate-300 mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest">No active tickets</p>
                 </div>
               )}
            </div>

            <button 
              onClick={() => setShowTicketForm(true)}
              className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
            >
               <Plus size={18} /> Create Support Ticket
            </button>
         </div>
      </div>

      <Modal
        isOpen={showTicketForm}
        onClose={() => setShowTicketForm(false)}
        title="Open Ticket"
        type="form"
        icon={<Plus size={24} className="text-blue-500" />}
        footer={
           <div className="flex gap-4 w-full">
              <button 
                onClick={() => setShowTicketForm(false)} 
                className="flex-1 py-4 font-black text-slate-500 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.subject || !formData.description}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                 {isSubmitting ? <Mini5GMicroLoader size={18} /> : <Send size={18}/>}
                 Send Ticket
              </button>
           </div>
        }
      >
         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Category</label>
               <div className="grid grid-cols-2 gap-3">
                  {['Technical', 'Billing', 'Sales', 'Upgrade'].map(cat => (
                    <button 
                      key={cat} 
                      type="button"
                      onClick={() => setFormData({...formData, category: cat as any})}
                      className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-100'}`}
                    >
                       {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Subject</label>
               <input 
                 className="w-full p-5 bg-slate-100 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 uppercase placeholder:lowercase"
                 placeholder="Brief summary of your issue..."
                 value={formData.subject}
                 onChange={e => setFormData({...formData, subject: e.target.value})}
                 required
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
               <select 
                 className="w-full p-4 bg-slate-100 border-none rounded-2xl font-black text-slate-700 outline-none uppercase text-xs"
                 value={formData.priority}
                 onChange={e => setFormData({...formData, priority: e.target.value as any})}
               >
                  {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p} Severity</option>)}
               </select>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
               <textarea 
                 className="w-full p-5 bg-slate-100 border-none rounded-2xl font-bold text-xs h-32 resize-none outline-none focus:ring-4 focus:ring-blue-500/10 uppercase"
                 placeholder="Please describe your issue in detail..."
                 value={formData.description}
                 onChange={e => setFormData({...formData, description: e.target.value})}
                 required
               />
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
               <AlertTriangle size={24} className="text-blue-600 shrink-0 mt-1" />
               <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                  Standard response time is within 4-6 business hours. High priority issues are addressed as soon as possible.
               </p>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default SubscriberSupport;


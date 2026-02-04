
import React, { useState, useMemo } from 'react';
import { AppState, SupportTicket, TicketStatus, TicketPriority, Role, NOCEvent } from '../types';
import { db } from '../db';
import { 
  LifeBuoy, Search, Filter, MessageSquare, Clock, CheckCircle, 
  XCircle, AlertTriangle, User, ArrowRight, ChevronRight, X,
  Send, ShieldAlert, Activity, Hash, Layers, Monitor, HardDrive,
  Plus, UserPlus, Calendar, ShieldCheck, RefreshCw, Trash2
} from 'lucide-react';

const TicketManagementAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'noc'>('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [dateStartFilter, setDateStartFilter] = useState<string>('');
  const [dateEndFilter, setDateEndFilter] = useState<string>('');

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isAddNOCModalOpen, setIsAddNOCModalOpen] = useState(false);

  const [nocFormData, setNocFormData] = useState<Partial<NOCEvent>>({
    title: '',
    description: '',
    area: '',
    severity: 'Info'
  });

  const selectedTicket = useMemo(() => 
    state.tickets.find(t => t.id === selectedTicketId),
  [state.tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    return state.tickets.filter(t => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = t.subject.toLowerCase().includes(term) || 
                           t.userName.toLowerCase().includes(term) ||
                           t.id.toLowerCase().includes(term);
      
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'All' || t.assignedTo === assigneeFilter;
      
      let matchesDate = true;
      if (dateStartFilter) matchesDate = matchesDate && new Date(t.createdAt) >= new Date(dateStartFilter);
      if (dateEndFilter) {
        const end = new Date(dateEndFilter);
        end.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(t.createdAt) <= end;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesDate;
    });
  }, [state.tickets, searchTerm, statusFilter, priorityFilter, assigneeFilter, dateStartFilter, dateEndFilter]);

  const handleStatusUpdate = async (id: string, status: TicketStatus) => {
    await db.updateTicketStatus(id, status);
  };

  const handleAssignTicket = async (id: string, email: string) => {
    await db.assignTicket(id, email);
    db.logNotification(state.currentUser?.email || 'admin', 'info', 'Registry Assignment', `Ticket ${id} assigned to ${email}`);
  };

  const handleAddComment = async () => {
    if (!selectedTicketId || !commentText.trim()) return;
    await db.addTicketComment(selectedTicketId, commentText, false);
    setCommentText('');
  };

  const handleAddNOC = async () => {
    if (!nocFormData.title || !nocFormData.description) return;
    await db.addNOCEvent(nocFormData);
    setIsAddNOCModalOpen(false);
    setNocFormData({ title: '', description: '', area: '', severity: 'Info' });
    db.logNotification('all', 'warning', 'NOC Advisory', `New incident broadcasted: ${nocFormData.title}`);
  };

  const getPriorityColor = (p: TicketPriority) => {
    switch(p) {
      case TicketPriority.CRITICAL: return 'bg-rose-600 text-white shadow-rose-200';
      case TicketPriority.HIGH: return 'bg-orange-500 text-white shadow-orange-100';
      case TicketPriority.MEDIUM: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getStatusColor = (s: TicketStatus) => {
    switch(s) {
      case TicketStatus.OPEN: return 'bg-indigo-600 text-white';
      case TicketStatus.RESOLVED: return 'bg-emerald-600 text-white';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-600 text-white';
      case TicketStatus.CLOSED: return 'bg-slate-200 text-slate-500';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3 italic leading-none">
            <LifeBuoy className="text-indigo-600" size={32} />
            Service Desk Authority
          </h2>
          <p className="text-slate-600 font-medium uppercase text-[10px] tracking-widest">Infrastructure Incident & Support Orchestration</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
           <button 
             onClick={() => setActiveTab('tickets')}
             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              <MessageSquare size={16}/> Tickets
           </button>
           <button 
             onClick={() => setActiveTab('noc')}
             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'noc' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
              <Activity size={16}/> NOC Events
           </button>
        </div>
      </div>

      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  className="w-full pl-11 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
                  placeholder="Audit tickets by keyword..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <select 
                   className="p-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none"
                   value={statusFilter}
                   onChange={e => setStatusFilter(e.target.value)}
                 >
                    <option value="All">All Status</option>
                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <select 
                   className="p-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none"
                   value={priorityFilter}
                   onChange={e => setPriorityFilter(e.target.value)}
                 >
                    <option value="All">All Priority</option>
                    {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                <select 
                   className="w-full p-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none"
                   value={assigneeFilter}
                   onChange={e => setAssigneeFilter(e.target.value)}
                 >
                    <option value="All">All Assignees</option>
                    {state.staff.map(s => <option key={s.email} value={s.email}>{s.name}</option>)}
                 </select>
                 <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={dateStartFilter} onChange={e => setDateStartFilter(e.target.value)} className="p-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none" title="Start Date" />
                    <input type="date" value={dateEndFilter} onChange={e => setDateEndFilter(e.target.value)} className="p-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none" title="End Date" />
                 </div>
              </div>
              <button 
                onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setAssigneeFilter('All'); setDateStartFilter(''); setDateEndFilter(''); setSearchTerm(''); }}
                className="w-full py-2 text-[8px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Clear Audit Filters
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
               <div className="p-6 bg-slate-950 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Incident Registry</h3>
                  <span className="text-[9px] font-black text-indigo-400 bg-white/5 px-2 py-0.5 rounded uppercase">Synced</span>
               </div>
               <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1 bg-white">
                  {filteredTickets.map(ticket => {
                    const isHigh = ticket.priority === TicketPriority.HIGH || ticket.priority === TicketPriority.CRITICAL;
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`w-full p-6 text-left transition-all flex flex-col gap-4 cursor-pointer group relative ${selectedTicketId === ticket.id ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${isHigh ? 'border-l-4 border-rose-500' : ''}`}
                      >
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${ticket.status === TicketStatus.OPEN ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.id}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                         </div>
                         <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{ticket.subject}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">{ticket.userName}</p>
                         </div>
                         <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center gap-2">
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(ticket.status)}`}>{ticket.status}</div>
                               {ticket.assignedTo && <div className="p-1 bg-slate-100 rounded-lg text-[7px] font-black uppercase text-slate-500 border border-slate-200">A: {ticket.assignedTo.split('@')[0]}</div>}
                            </div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <CheckCircle size={48} className="text-slate-100" />
                       <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Queue Pristine</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            {!selectedTicket ? (
              <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-200 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20">
                 <LifeBuoy className="text-slate-100 mb-8" size={80} />
                 <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic">Select Incident Dossier</h3>
                 <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2 leading-relaxed">
                    Choose a support request from the registry node to begin resolution sequence.
                 </p>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl flex flex-col h-[750px] overflow-hidden animate-in slide-in-from-right-4 duration-500">
                 <div className="p-8 bg-slate-950 text-white flex justify-between items-start shrink-0">
                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority} Priority</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol: {selectedTicket.category}</span>
                       </div>
                       <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedTicket.subject}</h3>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <User size={14} className="text-indigo-400" />
                             <span className="text-xs font-black uppercase">{selectedTicket.userName}</span>
                          </div>
                          <span className="text-slate-700">•</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{selectedTicket.userId}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                          <p className="text-[8px] font-black uppercase text-slate-500">Assign Authority</p>
                          <select 
                            className="bg-transparent text-xs font-black uppercase outline-none text-indigo-400"
                            value={selectedTicket.assignedTo || ''}
                            onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                          >
                             <option value="" className="bg-slate-900 text-white">Unassigned</option>
                             {state.staff.map(s => <option key={s.email} value={s.email} className="bg-slate-900 text-white">{s.name}</option>)}
                          </select>
                       </div>
                       <button onClick={() => setSelectedTicketId(null)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={32}/></button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/50">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Original Incident Log</h4>
                       <p className="text-sm font-bold text-slate-950 leading-relaxed uppercase whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                          <Layers size={14} className="text-indigo-600" /> Correspondence Chain
                       </h4>
                       <div className="space-y-4">
                          {selectedTicket.comments.map(comment => (
                            <div key={comment.id} className={`flex ${comment.authorRole === 'Customer' ? 'justify-start' : 'justify-end'}`}>
                               <div className={`max-w-[80%] p-6 rounded-[2rem] shadow-sm border ${comment.authorRole === 'Customer' ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none' : 'bg-slate-900 border-slate-800 text-white rounded-tr-none'}`}>
                                  <div className="flex justify-between items-center mb-3 opacity-60">
                                     <span className="text-[8px] font-black uppercase tracking-widest">{comment.authorName} • {comment.authorRole}</span>
                                     <span className="text-[8px] font-bold uppercase">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-xs font-bold leading-relaxed uppercase">{comment.text}</p>
                               </div>
                            </div>
                          ))}
                          {selectedTicket.comments.length === 0 && (
                            <p className="text-center py-10 text-slate-400 italic font-black uppercase text-[10px] tracking-widest">Awaiting internal response initialization.</p>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-white border-t border-slate-200 space-y-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                    <div className="flex gap-4">
                       <select 
                         className="flex-1 p-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 border-none"
                         value={selectedTicket.status}
                         onChange={e => handleStatusUpdate(selectedTicket.id, e.target.value as TicketStatus)}
                       >
                          {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <button className="px-6 py-4 bg-slate-950 text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Internal Note</button>
                    </div>
                    <div className="relative flex items-center gap-4">
                       <textarea 
                         className="flex-1 pl-6 pr-16 py-5 bg-slate-100 border-none rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm h-16 resize-none uppercase"
                         placeholder="Dispatch resolution protocol..."
                         value={commentText}
                         onChange={e => setCommentText(e.target.value)}
                       />
                       <button 
                         onClick={handleAddComment}
                         disabled={!commentText.trim()}
                         className="absolute right-2 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                       >
                          <Send size={20}/>
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">NOC Operational Advisories</h3>
              <button 
                onClick={() => setIsAddNOCModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
              >
                <Plus size={18}/> Broadcast Incident
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {state.nocEvents.map(event => (
                <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${event.severity === 'Critical' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : event.severity === 'Warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {event.severity}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${event.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {event.status}
                      </div>
                   </div>
                   <div className="relative z-10 space-y-4">
                      <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors leading-none">{event.title}</h4>
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <Hash size={12}/> {event.area}
                      </div>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">{event.description}</p>
                      <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                         <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={14}/>
                            <span className="text-[9px] font-black uppercase">{new Date(event.startTime).toLocaleString()}</span>
                         </div>
                         {event.status === 'Active' && (
                           <button onClick={() => db.resolveNOCEvent(event.id)} className="text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">Mark Resolved</button>
                         )}
                      </div>
                   </div>
                   <Activity className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-indigo-900" size={180} />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* ADD NOC EVENT MODAL */}
      {isAddNOCModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-rose-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                       <Activity size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">NOC Broadcast</h3>
                       <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest">New Incident Advisory</p>
                    </div>
                 </div>
                 <button onClick={() => setIsAddNOCModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-rose-100 hover:text-white transition-all"><X size={32} /></button>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incident Title</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-rose-500/10 uppercase"
                      placeholder="e.g. Fiber Cut - Bypass Node..."
                      value={nocFormData.title}
                      onChange={e => setNocFormData({...nocFormData, title: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Affected Region</label>
                       <input 
                         className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-slate-900 outline-none uppercase"
                         placeholder="e.g. North Zone..."
                         value={nocFormData.area}
                         onChange={e => setNocFormData({...nocFormData, area: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severity Node</label>
                       <select 
                         className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-slate-900 outline-none uppercase text-xs"
                         value={nocFormData.severity}
                         onChange={e => setNocFormData({...nocFormData, severity: e.target.value as any})}
                       >
                          <option value="Info">Low (Info)</option>
                          <option value="Warning">Medium (Warning)</option>
                          <option value="Critical">High (Critical)</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Briefing</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border rounded-2xl font-bold text-xs h-32 resize-none outline-none focus:ring-4 focus:ring-rose-500/10 uppercase"
                      placeholder="Detailed incident description..."
                      value={nocFormData.description}
                      onChange={e => setNocFormData({...nocFormData, description: e.target.value})}
                    />
                 </div>
                 <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4">
                    <ShieldAlert size={24} className="text-rose-600 shrink-0 mt-1" />
                    <p className="text-[9px] text-rose-700 font-bold uppercase leading-relaxed tracking-tighter">
                       Publishing this advisory will instantly relay the notification to all active subscribers in the registry node. Use only for confirmed infrastructure faults.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsAddNOCModalOpen(false)} className="flex-1 py-5 font-black text-slate-500 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abandon</button>
                 <button 
                   onClick={handleAddNOC}
                   className="flex-[2] py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    <Send size={18}/> Authorize Broadcast
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagementAdmin;

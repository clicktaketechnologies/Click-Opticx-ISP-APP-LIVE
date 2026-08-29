import React, { useState, useMemo } from 'react';
import { AppState, InternalTask, Role } from '../types';
import { db } from '../db';
import { 
  CheckCircle2, Circle, GripVertical, Trash2, Plus, 
  Calendar, Clock, AlertCircle, Sparkles, Filter, 
  Search, ListTodo, ShieldCheck, ChevronRight,
  Activity, X, CheckCircle, UserPlus, UserCircle, Shield, ArrowRight, Layers,
  ShieldAlert, TrendingUp, Zap, Briefcase
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

const TaskManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<InternalTask['priority']>('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const sortedTasks = useMemo(() => {
    return [...state.tasks].sort((a, b) => a.order - b.order);
  }, [state.tasks]);

  const stats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const high = state.tasks.filter(t => t.priority === 'High' && !t.completed).length;
    const pending = total - completed;
    return { total, completed, high, pending };
  }, [state.tasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await db.addTask(newTaskText, priority, assignedTo || undefined, dueDate || undefined);
    setNewTaskText('');
    setAssignedTo('');
    setDueDate('');
    setIsAdding(false);
  };

  const handleToggle = async (id: string) => {
    await db.toggleTask(id);
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this operational task?")) {
      await db.deleteTask(id);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (id: string) => {
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const currentTasks = [...sortedTasks];
    const draggedIdx = currentTasks.findIndex(t => t.id === draggedTaskId);
    const targetIdx = currentTasks.findIndex(t => t.id === targetId);

    const [removed] = currentTasks.splice(draggedIdx, 1);
    currentTasks.splice(targetIdx, 0, removed);

    await db.reorderTasks(currentTasks);
    setDraggedTaskId(null);
  };

  const getPriorityData = (p: string) => {
    switch(p) {
      case 'High': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: AlertCircle };
      case 'Medium': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Activity };
      default: return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: CheckCircle };
    }
  };

  const getStaffInfo = (email?: string) => {
    if (!email) return { name: 'Registry Waitlist', role: 'System Queue' };
    const staff = state.staff.find(s => s.email === email);
    return { name: staff?.name || email, role: staff?.role || 'External Assignee' };
  };

  return (
    <div className="flex flex-col gap-8 overflow-hidden relative pb-12 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1 shrink-0">
        <div>
           <h2 className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-4">
             <Briefcase className="text-indigo-600" size={32} />
             Operations Control
           </h2>
           <p className="text-[clamp(0.6rem,2vw,0.75rem)] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 italic">
             Manage organization-wide tasks & mission critical priorities
           </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>New Mission Entry</span>
        </button>
      </div>

      {/* 2. Ops Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         {[
           { label: 'Live Missions', count: stats.pending, icon: ListTodo, grad: 'var(--grad-primary)', sub: 'Open Queue' },
           { label: 'Priority Alerts', count: stats.high, icon: ShieldAlert, grad: 'var(--grad-error)', sub: 'Response Required' },
           { label: 'Handled Today', count: stats.completed, icon: CheckCircle2, grad: 'var(--grad-success)', sub: 'Successful Ops' },
           { label: 'Node Health', count: '98%', icon: Zap, grad: 'var(--grad-info)', sub: 'Network Stability' },
         ].map((kpi, idx) => (
           <div key={idx} className="card relative transition-all overflow-hidden border-none shadow-2xl p-6 group hover:scale-[1.02] active:scale-95" style={{ backgroundImage: kpi.grad }}>
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 text-white flex flex-col gap-4">
               <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{kpi.label}</p>
                 <div className="p-2 rounded-xl bg-white/25 backdrop-blur-md">
                    <kpi.icon size={18} strokeWidth={2.5} />
                 </div>
               </div>
               <h3 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black italic tracking-tighter leading-none">{kpi.count}</h3>
               <p className="text-[9px] font-black uppercase opacity-70 mt-1 tracking-widest">{kpi.sub}</p>
             </div>
          </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* Main Task List */}
        <div className="xl:col-span-3 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
            {sortedTasks.length === 0 ? (
              <div className="card !p-32 text-center flex flex-col items-center justify-center bg-white border-none shadow-2xl">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8">
                   <ShieldCheck size={64} className="text-indigo-200" />
                </div>
                <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Ops Registry Clear</p>
                <p className="text-[10px] font-black text-slate-300 uppercase mt-2 tracking-[0.3em]">No pending missions detected in grid</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTasks.map((task) => {
                  const assignee = getStaffInfo(task.assignedTo);
                  const pData = getPriorityData(task.priority);
                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(task.id)}
                      className={`group relative p-8 bg-white border-none rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center gap-10 transition-all duration-500 ${
                        draggedTaskId === task.id ? 'opacity-30 scale-95' : 'hover:scale-[1.01]'
                      } ${task.completed ? 'grayscale opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-6 shrink-0">
                         <div className="cursor-grab active:cursor-grabbing text-slate-100 group-hover:text-indigo-600 transition-colors hidden md:block">
                            <GripVertical size={28} />
                         </div>
                         <button 
                            onClick={() => handleToggle(task.id)}
                            className="relative w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 shadow-inner group-hover:shadow-indigo-600/30 overflow-hidden"
                         >
                            {task.completed ? (
                              <CheckCircle2 size={32} className="text-emerald-500 group-hover:text-white" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-4 border-slate-200 group-hover:border-white transition-all"></div>
                            )}
                         </button>
                      </div>

                      <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
                        <div className="relative inline-block">
                          <p className={`text-xl font-black uppercase tracking-tight transition-all duration-500 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                            {task.text}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${pData.bg} ${pData.color} ${pData.border}`}>
                            <div className="flex items-center gap-2">
                               <pData.icon size={12} />
                               {task.priority} Priority
                            </div>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                               <Calendar size={14} className="text-slate-300" />
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                 Deadline: {new Date(task.dueDate).toLocaleDateString()}
                               </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group-hover:bg-indigo-50 transition-all min-w-[240px]">
                         <div className="text-right flex-1">
                            <p className="text-[11px] font-black text-slate-900 uppercase italic group-hover:text-indigo-600 transition-colors leading-none">{assignee.name}</p>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2 italic group-hover:text-indigo-400">{assignee.role}</p>
                         </div>
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-100 border border-slate-100 shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <UserCircle size={28}/>
                         </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-4 bg-rose-50 text-rose-300 hover:bg-rose-600 hover:text-white rounded-[1.5rem] transition-all opacity-0 group-hover:opacity-100 active:scale-90 absolute -right-4 -top-4 md:static"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                <TrendingUp size={160} className="text-indigo-400" />
             </div>
             <div className="relative z-10 space-y-12">
                <div>
                   <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 italic">Efficiency Pulse</h4>
                   <h3 className="text-3xl font-black italic tracking-tighter leading-tight">NODE HEALTH OVERVIEW</h3>
                </div>
                
                <div className="space-y-4">
                   <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] group-hover:bg-white/10 transition-all">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Grid Completion</p>
                      <div className="flex items-end justify-between">
                         <span className="text-3xl font-black italic tracking-tighter text-emerald-400">92%</span>
                         <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Target 95%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      </div>
                   </div>
                   
                   <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] group-hover:bg-white/10 transition-all">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Queue Saturation</p>
                      <p className="text-2xl font-black italic tracking-tighter text-amber-500">OPTIMAL RANGE</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="card !p-10 bg-white border-none shadow-xl space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28} /></div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-800">Operational Integrity</h4>
             </div>
             <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed italic pr-4">
               All operational mission logs are synchronized across internal registries for transparency and fiscal audit trails.
             </p>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title="COMMENCE NEW MISSION"
        maxWidth="max-w-xl"
        scrollable
      >
        <form onSubmit={handleAddTask} className="space-y-10 p-2">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Operational Mission Description</label>
            <textarea
              className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] font-black text-xl outline-none focus:border-indigo-600 transition-all text-slate-950 placeholder:text-slate-200 resize-none min-h-[160px]"
              placeholder="Enter mission objectives..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Personnel Assignment</label>
            <div className="relative group">
              <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <select
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest outline-none focus:border-indigo-600 text-slate-950 appearance-none cursor-pointer"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
              >
                <option value="">Mission Queue (System)</option>
                {state.staff.map(s => (
                  <option key={s.email} value={s.email}>{s.name} — {s.role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Sector Priority</label>
              <div className="flex bg-slate-50 p-2 rounded-[2rem] border-2 border-slate-100">
                {['Low', 'Medium', 'High'].map((p: any) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      priority === p ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Time Interval</label>
              <input
                type="date"
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase outline-none focus:border-indigo-600 text-slate-950"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
             <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest transition-all"
             >
                Abort Protocol
             </button>
             <button 
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
                className="flex-[2] py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:bg-black active:scale-95 disabled:opacity-40"
             >
                Commence Mission
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskManagement;

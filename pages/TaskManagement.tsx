
import React, { useState, useMemo } from 'react';
import { AppState, InternalTask, Role } from '../types';
import { db } from '../db';
import { 
  CheckCircle2, Circle, GripVertical, Trash2, Plus, 
  Calendar, Clock, AlertCircle, Sparkles, Filter, 
  Search, ListTodo, ShieldCheck, ChevronRight,
  Activity, X, CheckCircle, UserPlus, UserCircle, Shield, ArrowRight, Layers,
  ShieldAlert
} from 'lucide-react';

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
    if (confirm("Are you sure you want to delete this task?")) {
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

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStaffInfo = (email?: string) => {
    if (!email) return { name: 'Unassigned', role: 'System' };
    const staff = state.staff.find(s => s.email === email);
    return { name: staff?.name || email, role: staff?.role || 'Staff' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none uppercase">
            <ListTodo className="text-indigo-600" size={32} />
            Internal Operations
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Manage tasks and team assignments</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Task List */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">
                  Task Board
                </h3>
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-100 px-4 py-1.5 rounded-full uppercase tracking-tighter">
                {sortedTasks.filter(t => !t.completed).length} Pending Tasks
              </span>
            </div>

            <div className="p-6 space-y-4">
              {sortedTasks.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center">
                  <ShieldCheck size={56} className="text-slate-100 mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No tasks found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sortedTasks.map((task) => {
                    const assignee = getStaffInfo(task.assignedTo);
                    return (
                      <div 
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(task.id)}
                        className={`group p-8 bg-white border-2 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 transition-all duration-500 ease-out ${
                          draggedTaskId === task.id ? 'opacity-40 scale-95 border-dashed' : 'border-slate-50 hover:border-indigo-100 hover:shadow-2xl'
                        } ${task.completed ? 'bg-emerald-50/10 border-emerald-100/50 grayscale' : ''}`}
                      >
                        <div className="flex items-center gap-6 w-full md:w-auto">
                           <div className="cursor-grab active:cursor-grabbing text-slate-200 group-hover:text-indigo-400 transition-colors hidden md:block">
                              <GripVertical size={20} />
                           </div>
                           <button 
                              onClick={() => handleToggle(task.id)}
                              className="relative shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 active:scale-75"
                           >
                              {task.completed ? (
                                <div className="animate-in zoom-in spin-in-180 duration-500">
                                   <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                              ) : (
                                <Circle size={40} className="text-slate-200 group-hover:text-indigo-400 transition-all duration-300 group-hover:scale-110" />
                              )}
                           </button>
                        </div>

                        <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
                          <div className="relative overflow-hidden inline-block pr-4">
                            <p className={`text-xl font-black uppercase tracking-tight transition-all duration-500 transform ${task.completed ? 'text-slate-400 translate-x-1 italic' : 'text-slate-900'}`}>
                              {task.text}
                            </p>
                            {task.completed && (
                              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-emerald-500/30 -translate-y-1/2 animate-in slide-in-from-left duration-700"></div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border transition-colors duration-500 shadow-sm ${task.completed ? 'bg-slate-100 text-slate-400 border-slate-100' : getPriorityColor(task.priority)}`}>
                              {task.priority} Priority
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar size={12} className={task.completed ? 'text-slate-300' : 'text-indigo-500'} />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 shrink-0 px-8 py-4 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-lg transition-all min-w-[180px]">
                           <div className="flex items-center gap-3">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{assignee.name}</p>
                                 <p className="text-[7px] text-indigo-500 font-black uppercase tracking-widest mt-1">{assignee.role}</p>
                              </div>
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                                 <UserCircle size={24}/>
                              </div>
                           </div>
                        </div>

                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-4 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all md:opacity-0 group-hover:opacity-100 active:scale-90"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Status Matrix */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-10">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
                     <Activity className="text-emerald-400" size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic tracking-tighter">Team Progress</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">Node Health Statistics</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">Completion Rate</p>
                    <p className="text-2xl font-black text-emerald-400 tracking-tighter italic">92% COMPLETED</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2 italic">Unassigned Tasks</p>
                    <p className="text-2xl font-black text-rose-400 tracking-tighter italic">{sortedTasks.filter(t => !t.assignedTo).length} NEEDS ATTENTION</p>
                  </div>
               </div>
            </div>
            <Sparkles className="absolute -right-16 -bottom-16 opacity-5 scale-[2.5]" size={300} />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-indigo-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Task Details</h4>
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
               All operational tasks are logged for internal auditing. Urgent items will trigger a priority relay to assigned staff members.
             </p>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300">
             <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                      <Plus size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">New Task</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Task Status</p>
                   </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-2xl">
                   <X size={32}/>
                </button>
             </div>

             <form onSubmit={handleAddTask} className="p-10 space-y-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Task Description</label>
                   <input 
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-xl outline-none focus:border-indigo-600 transition-all text-slate-900 shadow-inner placeholder:text-slate-200"
                    placeholder="Enter task name or description..."
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Assign To (Staff Member)</label>
                      <div className="relative">
                         <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                         <select 
                           className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-xs uppercase outline-none focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
                           value={assignedTo}
                           onChange={e => setAssignedTo(e.target.value)}
                         >
                            <option value="">Unassigned (System)</option>
                            {state.staff.map(s => (
                               <option key={s.email} value={s.email}>{s.name} ({s.role})</option>
                            ))}
                         </select>
                         <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" size={20}/>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Priority Level</label>
                         <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            {['Low', 'Medium', 'High'].map((p: any) => (
                              <button
                                type="button"
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${priority === p ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {p}
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Due Date</label>
                         <input 
                           type="date"
                           className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-indigo-500 shadow-sm"
                           value={dueDate}
                           onChange={e => setDueDate(e.target.value)}
                         />
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 shadow-inner">
                   <ShieldAlert size={28} className="text-blue-600 shrink-0 mt-1" />
                   <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                      Assigned personnel will receive an immediate notification for tasks marked as High priority.
                   </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-7 bg-slate-950 text-white font-black rounded-3xl shadow-2xl shadow-indigo-900/20 hover:bg-black transition-all active:scale-95 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4"
                >
                   <CheckCircle size={24} strokeWidth={3} />
                   Create Task
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;

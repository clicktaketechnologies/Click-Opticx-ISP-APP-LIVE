import React, { useState, useMemo } from 'react';
import { 
  Wallet, Receipt, TrendingUp, ShieldAlert,
  Search, Filter, Download, Plus,
  ArrowRight, MessageSquare, Phone, Mail,
  CheckCircle2, XCircle, Clock, AlertTriangle,
  CreditCard, BarChart3, Repeat, FileText,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Zap, History
} from 'lucide-react';
import { AppState, Invoice, User as UserType } from '../../types';
import { V2Badge, V2Button, V2Card } from '../../components/v2/UIAtoms';
import { V2SmartTable, V2SlideOver, V2TableRow, V2TableCell } from '../../components/v2/TableAndSlide';

const FiscalHubV2: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'Paid' | 'Unpaid' | 'Overdue'>('all');

  // 1. Data Filtration
  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(inv => {
      const user = state.users.find(u => u.id === inv.userId);
      const matchesSearch = 
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.invoices, state.users, searchQuery, filterStatus]);

  const stats = {
    revenue: state.stats.monthlyRevenue,
    unpaidCount: state.invoices.filter(i => i.status === 'Unpaid').length,
    overdueCount: state.invoices.filter(i => i.status === 'Overdue').length,
    recoveryRate: '92.4%'
  };

  return (
    <div className="space-y-10">
      {/* Fiscal Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <V2Card className="bg-slate-950 text-white shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <TrendingUp size={24} />
                </div>
                <V2Badge label="+8.4%" color="blue" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Ingestion</p>
            <h4 className="text-2xl font-black italic tracking-tighter">PKR {(stats.revenue || 0).toLocaleString()}</h4>
        </V2Card>
        <MiniFiscalStat label="Recovery Risk" value={stats.overdueCount} sub="Overdue Invoices" color="rose" icon={ShieldAlert} />
        <MiniFiscalStat label="Pending Yield" value={stats.unpaidCount} sub="Awaiting Payment" color="amber" icon={Clock} />
        <MiniFiscalStat label="Effort Efficiency" value={stats.recoveryRate} sub="Total Recovery" color="emerald" icon={ShieldCheck} />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full max-w-xl">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by Invoice ID or Subscriber..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl shrink-0">
              {(['all', 'Paid', 'Unpaid', 'Overdue'] as const).map(s => (
                <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
           </div>
        </div>
        <div className="flex gap-3">
            <V2Button label="Export Ledger" variant="secondary" icon={Download} />
            <V2Button label="New Dispatch" icon={Plus} />
        </div>
      </div>

      {/* Transaction Matrix */}
      <V2SmartTable headers={['Invoice Node', 'Fiscal Status', 'Transmission Date', 'Total Amount', 'Recovery']}>
        {filteredInvoices.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-10 py-20 text-center">
              <p className="text-sm font-black text-slate-300 uppercase italic tracking-[0.4em]">No financial nodes detected</p>
            </td>
          </tr>
        ) : filteredInvoices.map(inv => {
          const user = state.users.find(u => u.id === inv.userId);
          return (
            <V2TableRow key={inv.id} onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }}>
              <V2TableCell>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Receipt size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 uppercase italic leading-none mb-1">#{inv.id.slice(-6).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.name || 'Unknown User'}</p>
                   </div>
                </div>
              </V2TableCell>
              <V2TableCell>
                 <V2Badge 
                   label={inv.status} 
                   color={inv.status === 'Paid' ? 'emerald' : inv.status === 'Unpaid' ? 'amber' : 'rose'} 
                   variant="ghost" 
                   icon={inv.status === 'Paid' ? CheckCircle2 : inv.status === 'Unpaid' ? Clock : AlertTriangle}
                 />
              </V2TableCell>
              <V2TableCell>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </V2TableCell>
              <V2TableCell>
                 <p className="text-sm font-black text-slate-900 italic">PKR {(inv.total || 0).toLocaleString()}</p>
              </V2TableCell>
              <V2TableCell>
                 {inv.status !== 'Paid' ? (
                   <button className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                      RECOVER <ChevronRight size={12} />
                   </button>
                 ) : (
                   <V2Badge label="Settled" color="emerald" variant="solid" icon={ShieldCheck} />
                 )}
              </V2TableCell>
            </V2TableRow>
          );
        })}
      </V2SmartTable>

      {/* Recovery Slide-Over */}
      <V2SlideOver
        isOpen={isDetailOpen && !!selectedInvoice}
        onClose={() => setIsDetailOpen(false)}
        title={`Invoice Node: #${selectedInvoice?.id.slice(-6).toUpperCase()}`}
        subtitle={`Total Ingestion: PKR ${(selectedInvoice?.total || 0).toLocaleString()}`}
        footer={
            <div className="flex gap-4">
                <V2Button label="Mark as Settled" variant="primary" className="flex-1" icon={CheckCircle2} />
                <V2Button label="Void Dispatch" variant="danger" className="flex-1" icon={XCircle} />
            </div>
        }
      >
        {selectedInvoice && (
            <div className="space-y-10">
                {/* Status Dashboard */}
                <div className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${
                    selectedInvoice.status === 'Paid' ? 'bg-emerald-50 border-emerald-100' : 
                    selectedInvoice.status === 'Overdue' ? 'bg-rose-50 border-rose-100' : 
                    'bg-amber-50 border-amber-100'
                }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                            selectedInvoice.status === 'Paid' ? 'bg-emerald-500' : 
                            selectedInvoice.status === 'Overdue' ? 'bg-rose-500' : 
                            'bg-amber-500'
                        }`}>
                            <CreditCard size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-1">{selectedInvoice.status}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Transmission: {selectedInvoice.paymentMethod || 'Manual'}</p>
                        </div>
                    </div>
                    <V2Badge label="Live Signal" color="blue" variant="outline" icon={Zap} />
                </div>

                {/* Info Matrix */}
                <div className="grid grid-cols-2 gap-6">
                    <InfoCard icon={User} label="Subscriber" value={state.users.find(u => u.id === selectedInvoice.userId)?.name} />
                    <InfoCard icon={Calendar} label="Generation Date" value={new Date(selectedInvoice.createdAt).toLocaleString()} />
                    <InfoCard icon={FileText} label="Due Horizon" value={selectedInvoice.dueDate || 'Immediate'} />
                    <InfoCard icon={Wallet} label="Total Amount" value={`PKR ${(selectedInvoice.total || 0).toLocaleString()}`} />
                </div>

                {/* Recovery Actions (If Unpaid/Overdue) */}
                {selectedInvoice.status !== 'Paid' && (
                    <V2Card title="Intervention Engine" className="bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Select automated recovery protocol</p>
                        <div className="grid grid-cols-3 gap-4">
                            <ActionSquare icon={MessageSquare} label="SMS Protocol" color="blue" />
                            <ActionSquare icon={Mail} label="Email Relay" color="indigo" />
                            <ActionSquare icon={Phone} label="Voice Direct" color="slate" />
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-200">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Risk Level</span>
                                <V2Badge label="Moderate" color="amber" />
                             </div>
                             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-1/2" />
                             </div>
                        </div>
                    </V2Card>
                )}

                {/* Transaction History Trace */}
                <V2Card title="Protocol History Trace" className="bg-white">
                    <div className="space-y-6 mt-6">
                        <HistoryNode date="Apr 28, 10:45 AM" action="Invoice Dispatched" status="SENT" />
                        <HistoryNode date="Apr 29, 09:12 AM" action="Manual Check" status="PENDING" />
                        <HistoryNode date="Apr 29, 11:20 AM" action="SMS Reminder" status="DELIVERED" />
                    </div>
                </V2Card>
            </div>
        )}
      </V2SlideOver>
    </div>
  );
};

const MiniFiscalStat = ({ label, value, sub, color, icon: Icon }: any) => {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-500 bg-amber-50 border-amber-100',
        rose: 'text-rose-500 bg-rose-50 border-rose-100',
        blue: 'text-blue-500 bg-blue-50 border-blue-100',
    };
    return (
        <V2Card className="p-6">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <MoreHorizontal className="text-slate-300" size={16} />
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

const ActionSquare = ({ icon: Icon, label, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white',
        slate: 'bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white',
    };
    return (
        <button className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all group ${colors[color]}`}>
            <Icon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
};

const HistoryNode = ({ date, action, status }: any) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div>
                <p className="text-xs font-black text-slate-800 uppercase italic leading-none mb-1">{action}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{date}</p>
            </div>
        </div>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{status}</span>
    </div>
);

const MoreHorizontal = ({ className, size }: any) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);

export default FiscalHubV2;

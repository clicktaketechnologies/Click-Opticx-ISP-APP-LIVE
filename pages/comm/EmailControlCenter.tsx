
import React, { useState, useMemo } from 'react';
import { 
  Mail, Settings, History, Layout, Zap, 
  Plus, Search, Filter, Shield, 
  Send, AlertCircle, CheckCircle2, 
  Clock, Server, Globe as GlobeIcon, 
  ArrowRight, MoreVertical, Trash2, 
  Edit3, Copy, Eye, Power,
  BarChart3, User, Database,
  Repeat, Bell, Smartphone, Users,
  MailWarning, Activity, Key, 
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Monitor
} from 'lucide-react';
import { db } from '../../db';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useBranding } from '../../hooks/useBranding';
import { EmailTemplate, CommunicationLog, CommunicationAutomationRule, AppState } from '../../types';

interface EmailControlCenterProps {
  state: AppState;
  activePage?: string;
}

const EmailControlCenter: React.FC<EmailControlCenterProps> = ({ state, activePage }) => {

  const branding = useBranding();
  const config = state.settings.commConfig;
  const stats = state.commStats;
  
  const [activeTab, setActiveTab] = useState<'dashboard'|'logs'|'templates'|'controls'|'automation'|'push'|'audiences'|'setup'>('dashboard');

  React.useEffect(() => {
    if (!activePage) return;
    
    const mapping: Record<string, any> = {
      'notification-control': 'dashboard',
      'comm-templates': 'templates',
      'comm-campaigns': 'controls',
      'admin-user-devices': 'push',
      'comm-push': 'controls',
      'comm-rules': 'automation',
      'comm-segments': 'audiences',
      'comm-logs': 'logs',
      'comm-settings': 'setup'
    };

    if (mapping[activePage]) {
      setActiveTab(mapping[activePage]);
    }
  }, [activePage]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailModal, setTestEmailModal] = useState<string | null>(null); // templateId
  const [testTo, setTestTo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Tabs Definition
  const tabs = [
    { id: 'dashboard', label: 'Monitor', icon: BarChart3 },
    { id: 'logs', label: 'Delivery Logs', icon: Activity },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'controls', label: 'Dispatcher Hub', icon: Send },
    { id: 'automation', label: 'Smart Engine', icon: Zap },
    { id: 'push', label: 'Push Devices', icon: Smartphone },
    { id: 'audiences', label: 'Audiences', icon: Users },
    { id: 'setup', label: 'Comms Setup', icon: Settings },
  ];

  // Logic: Send Test Email
  const handleSendTest = async () => {
    if (!testEmailModal || !testTo) return;
    setIsProcessing(true);
    const res = await db.sendEmailHybrid(testTo, 'ClickOptix Protocol: Network Signal Test', testEmailModal);
    setIsProcessing(false);
    if (res.success) {
      setTestEmailModal(null);
      setTestTo('');
      // Notification handled by DB
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Mail className="text-white" size={20} />
             </div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email Control Center</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Hybrid SMTP & Cloud Relay Management System</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                 activeTab === tab.id 
                 ? 'bg-white text-blue-600 shadow-sm' 
                 : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
               }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Conditional Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Transmissions" value={stats.totalSent} sub="Last 30 Days" icon={Send} color="blue" />
              <StatCard title="Delivery Rate" value={`${((stats.delivered/stats.totalSent)*100).toFixed(1)}%`} sub={`${stats.delivered} successful`} icon={CheckCircle2} color="emerald" />
              <StatCard title="Hybrid Failovers" value={stats.providerUsage.backup} sub="Auto-shifted to Backup" icon={Shield} color="amber" />
              <StatCard title="Reputation" value="98.2" sub="Healthy Domain" icon={Activity} color="indigo" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Provider Health */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Provider Infrastructure</h3>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       Operational
                    </span>
                 </div>
                 
                 <div className="space-y-4">
                    <ProviderRow 
                       name="Primary SMTP Relay" 
                       host={config.smtpConfig.host} 
                       status="Online" 
                       usage={stats.providerUsage.smtp} 
                       total={stats.totalSent}
                       isPrimary
                    />
                    <ProviderRow 
                       name="Cloud Backup Relay" 
                       host={config.backupProvider} 
                       status={config.failoverEnabled ? "Ready" : "Disabled"} 
                       usage={stats.providerUsage.backup} 
                       total={stats.totalSent}
                    />
                 </div>
              </div>

              {/* Quick Actions / Metrics */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                 <div>
                    <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-4">Dispatcher Status</h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">Auto-Dispatcher</span>
                          <div className="w-10 h-5 bg-blue-600 rounded-full relative p-1 cursor-pointer">
                             <div className="w-3 h-3 bg-white rounded-full absolute right-1"></div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">Failover Engine</span>
                          <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Active</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">Log Retention</span>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">30 Days</span>
                       </div>
                    </div>
                 </div>
                 <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10">
                    Run Connectivity Test
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Real-Time Delivery Logs</h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search logs by email..." 
                   className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-all w-full md:w-64"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                       <th className="px-6 py-4">Recipient</th>
                       <th className="px-6 py-4">Subject & Protocol</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Provider</th>
                       <th className="px-6 py-4">Timestamp</th>
                       <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {state.commLogs.filter(l => (l.email || "").toLowerCase().includes((searchQuery || "").toLowerCase())).slice(0, 50).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-800">{log.userName}</span>
                               <span className="text-[11px] text-slate-500">{log.email}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-xs font-semibold text-slate-700">{log.subject}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                               {log.templateId || 'Direct Dispatch'}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                               log.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                               {log.status === 'Sent' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                               {log.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                               {log.provider === 'SMTP' ? <Server size={12} className="text-blue-500" /> : <GlobeIcon size={12} className="text-amber-500" />}
                               {log.provider}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-[11px] font-medium text-slate-500">
                            {new Date(log.sentAt).toLocaleString()}
                         </td>
                         <td className="px-6 py-4 text-right">
                             <button className="p-2 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                                <Eye size={16} />
                             </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'templates' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
               onClick={() => setIsAddingTemplate(true)}
               className="h-[220px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all group"
            >
               <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center transition-all">
                  <Plus size={24} />
               </div>
               <span className="font-black uppercase tracking-widest text-[10px]">Create Template</span>
            </button>
            
            {state.emailTemplates.map(template => (
               <div key={template.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group h-[220px]">
                  <div>
                     <div className="flex items-center justify-between mb-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                           {template.category}
                        </span>
                        <div className="flex items-center gap-1">
                           <button onClick={() => setTestEmailModal(template.id)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all" title="Test Template">
                              <Send size={14} />
                           </button>
                           <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-all">
                              <Edit3 size={14} />
                           </button>
                        </div>
                     </div>
                     <h4 className="text-lg font-bold text-slate-800 mb-2">{template.name}</h4>
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {template.content}
                     </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                     <span className="text-[10px] text-slate-400 font-medium">Last Modified: {new Date(template.lastUpdated).toLocaleDateString()}</span>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{template.id}</span>
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'controls' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                  <Monitor size={16} className="text-blue-500" />
                  Dispatcher Toggles
               </h3>
               
               <div className="space-y-6">
                  <ToggleItem 
                    title="Welcome Protocol" 
                    desc="Auto-send welcome sequence to new subscribers" 
                    active={config.toggles?.welcomeEmail}
                  />
                  <ToggleItem 
                    title="Auth Handshake" 
                    desc="Critical OTP and Password verification relay" 
                    active={config.toggles?.otpEmail}
                    isCritical
                  />
                  <ToggleItem 
                    title="Billing Notification" 
                    desc="Invoice availability and payment confirmations" 
                    active={config.toggles?.invoiceEmail}
                  />
                  <ToggleItem 
                    title="Lifecycle Reminders" 
                    desc="Expiry alerts (7-day, 3-day, 1-day protocols)" 
                    active={config.toggles?.expiryReminder}
                  />
                  <ToggleItem 
                    title="Admin Pulse" 
                    desc="Dispatch critical network events to admins" 
                    active={config.toggles?.adminAlerts}
                  />
               </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6">Sender Identity Node</h3>
                <div className="space-y-4 mb-8">
                   {config.senderIdentities.map(sender => (
                      <div key={sender.id} className={`p-4 rounded-2xl border transition-all ${sender.isDefault ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                  <User size={18} className="text-slate-500" />
                               </div>
                               <div>
                                  <h5 className="text-sm font-bold text-slate-800">{sender.name}</h5>
                                  <p className="text-[11px] text-slate-500">{sender.email}</p>
                               </div>
                            </div>
                            {sender.isVerified && <CheckCircle2 size={16} className="text-emerald-500" />}
                         </div>
                      </div>
                   ))}
                </div>
                <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform">
                   Manage Verified Senders <ArrowRight size={14} />
                </button>
            </div>
         </div>
      )}

      {activeTab === 'automation' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-600/20 text-white overflow-hidden relative">
               <div className="relative z-10">
                  <h3 className="text-xl font-black mb-1">Smart Engine Rule Hub</h3>
                  <p className="text-blue-100 text-xs font-medium">Define logic-based triggers for automated subscriber engagement.</p>
               </div>
               <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/10 -skew-x-12 translate-x-32 group-hover:translate-x-16 transition-transform duration-700"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {state.commAutomationRules.map(rule => (
                  <div key={rule.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-all flex items-start gap-4">
                     <div className={`p-3 rounded-2xl ${rule.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Zap size={20} />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="font-bold text-slate-800">{rule.name}</h4>
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              rule.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                           }`}>
                              {rule.enabled ? 'Running' : 'Paused'}
                           </span>
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Trigger:</span>
                              {rule.trigger}
                           </div>
                           <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Logic:</span>
                              <code>{rule.condition}</code>
                           </div>
                           <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">Action:</span>
                              {rule.actions[0].type} Dispatch
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'push' && (
         <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center animate-in zoom-in duration-300 shadow-sm">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Smartphone size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2 italic">Push Notification Management</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">Configure deep-link push notifications, manage device tokens, and monitor mobile app engagement metrics across iOS and Android ecosystems.</p>
            <div className="mt-8 flex justify-center gap-4">
               <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">FCM Node Connected</span>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'audiences' && (
         <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center animate-in zoom-in duration-300 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Users size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2 italic">Audience Segmentation</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">Create dynamic segments based on subscriber behavior, data usage patterns, and geographic location for granular targeted communication protocols.</p>
         </div>
      )}

      {activeTab === 'setup' && (
         <div className="bg-slate-900 rounded-[3rem] p-12 text-center animate-in zoom-in duration-300 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>
            <div className="w-20 h-20 bg-white/5 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
               <Settings size={40} className="animate-spin-slow" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Infrastructure Handshake</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm font-medium leading-relaxed mb-8">Manage SMTP relay credentials, cloud failover thresholds, domain authentication (SPF/DKIM), and system-wide dispatch throttles.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">Failover Threshold</h4>
                  <p className="text-white font-bold text-lg">2 Failed Re-tries</p>
               </div>
               <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1">DKIM Status</h4>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                     <CheckCircle2 size={16} className="text-emerald-400" /> Verified
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Test Email Modal */}
      <Modal
        isOpen={!!testEmailModal}
        onClose={() => setTestEmailModal(null)}
        title="Protocol Simulation [Test Relay]"
        type="confirm"
        icon={<Send className="text-blue-600" size={20} />}
      >
        <div className="space-y-4 p-2">
           <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium"> This will trigger a live payload via the currently active SMTP node. Used for verifying template parsing and delivery headers.</p>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Recipient Node Email</label>
              <input 
                type="email" 
                placeholder="subscriber@domain.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-slate-800"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
              />
           </div>
           <button 
             onClick={handleSendTest}
             disabled={isProcessing || !testTo}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-6 shadow-xl shadow-blue-500/20"
           >
             {isProcessing ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
             Dispatch Protocol
           </button>
        </div>
      </Modal>

    </div>
  );
};

// --- Helper Components ---

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 shadow-blue-100/50',
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50',
    amber: 'bg-amber-50 text-amber-600 shadow-amber-100/50',
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100/50',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm group hover:border-blue-300 transition-all">
       <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}>
          <Icon size={22} />
       </div>
       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
       <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-800">{value}</span>
          <span className="text-[10px] font-bold text-slate-400">{sub}</span>
       </div>
    </div>
  );
};

const ProviderRow = ({ name, host, status, usage, total, isPrimary }: any) => {
  const percentage = total > 0 ? (usage / total) * 100 : 0;
  
  return (
    <div className={`p-4 rounded-2xl border transition-all ${isPrimary ? 'bg-slate-50/50 border-slate-100' : 'bg-transparent border-slate-100 opacity-80'}`}>
       <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {isPrimary ? <Server size={14} /> : <GlobeIcon size={14} />}
             </div>
             <div>
                <h5 className="text-[13px] font-bold text-slate-800">{name}</h5>
                <p className="text-[10px] text-slate-400 font-medium font-mono">{host}</p>
             </div>
          </div>
          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
             status === 'Online' || status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
             {status}
          </span>
       </div>
       <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Usage</span>
             <span className="text-[10px] font-black text-slate-700">{usage} / {total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ${isPrimary ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-indigo-400'}`} 
               style={{ width: `${percentage}%` }}
             ></div>
          </div>
       </div>
    </div>
  );
};

const ToggleItem = ({ title, desc, active, isCritical }: any) => {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
             <h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{title}</h5>
             {isCritical && <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Critical Node</span>}
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">{desc}</p>
       </div>
       <div className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${active ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-200'}`}>
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${active ? 'right-1' : 'left-1'}`}></div>
       </div>
    </div>
  );
};

export default EmailControlCenter;


import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Role, PaymentMethod, UserStatus, PaymentStatus, ISPUser, RecoveryLog, BillingPaymentType, BillingCycle } from '../types';
import { db } from '../db';
import {
    Users, Receipt, Search, Filter, ShieldAlert, ShieldCheck,
    Clock, BadgeDollarSign, CreditCard, Landmark, HandCoins,
    History, FileText, Download, Printer, ChevronRight, X, AlertTriangle,
    MoreVertical, CheckSquare, Square, Lock, Unlock, Zap, MoreHorizontal,
    Mail, Phone, UserCheck, Activity
} from 'lucide-react';
import ModuleGuide from '../components/shared/ModuleGuide';

const Recovery: React.FC<{ state: AppState; searchTerm?: string; autoOpenAction?: string }> = ({ state, searchTerm: globalSearchTerm, autoOpenAction }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (globalSearchTerm !== undefined) {
            setSearchTerm(globalSearchTerm);
        }
    }, [globalSearchTerm]);

    const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');
    const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Half Paid' | 'Overdue'>('All');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('Unpaid Balance');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [activeUser, setActiveUser] = useState<ISPUser | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
    const [paymentType, setPaymentType] = useState<'Full' | 'Half' | 'Custom'>('Full');
    const [promiseDate, setPromiseDate] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Half' | 'Emergency'>('Paid');
    const [collectionDetails, setCollectionDetails] = useState({
        notes: '',
        collectorName: state.currentUser?.name || '',
        collectionDate: new Date().toISOString().split('T')[0],
        collectionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
    const [billingConfig, setBillingConfig] = useState<{
        paymentType: BillingPaymentType;
        cycle: BillingCycle;
        customExpiry?: string;
    }>({
        paymentType: 'Full Paid',
        cycle: '30 days'
    });
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBulkPromiseModalOpen, setIsBulkPromiseModalOpen] = useState(false);
    const [isBulkUnpaidModalOpen, setIsBulkUnpaidModalOpen] = useState(false);
    const [isBulkActivateModalOpen, setIsBulkActivateModalOpen] = useState(false);
    const [bulkUnpaidConfig, setBulkUnpaidConfig] = useState({
        months: 1,
        packageId: state.packages[0]?.id || '',
        paymentStatus: 'Unpaid' as 'Unpaid' | 'Half',
        notes: ''
    });
    const [bulkActivateConfig, setBulkActivateConfig] = useState({
        packageId: state.packages[0]?.id || '',
        paymentStatus: 'Paid' as 'Paid' | 'Unpaid' | 'Half',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    });
    const [bulkPromiseDate, setBulkPromiseDate] = useState('');
    const [dateFilter, setDateFilter] = useState<'All' | 'Today' | '3Days' | '7Days'>('All');
    const [collectorFilter, setCollectorFilter] = useState<string>('All');
    const [isBulkFlashModalOpen, setIsBulkFlashModalOpen] = useState(false);
    const [flashMonths, setFlashMonths] = useState(1);
    const [flashConfirmText, setFlashConfirmText] = useState('');
    const [isAssignCollectorModalOpen, setIsAssignCollectorModalOpen] = useState(false);
    const [selectedCollector, setSelectedCollector] = useState<{ email: string; name: string } | null>(null);

    const canBypassApproval = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.FINANCE_ADMIN].includes(state.currentUser?.role as Role);

    const filteredUsers = useMemo(() => {
        const s = searchTerm.trim().toLowerCase();
        const now = new Date();
        const results = state.users.filter(u => {
            const nameMatch = u.name.toLowerCase().includes(s);
            const idMatch = u.id.toLowerCase().includes(s);
            const matchesSearch = !s || nameMatch || idMatch;
            
            const isRecovery = u.status === UserStatus.RECOVERY_MODE || u.isRecoveryMode;
            const matchesStatus = statusFilter === 'All' || u.status === statusFilter || (statusFilter === UserStatus.RECOVERY_MODE && isRecovery);

            let matchesPayment = true;
            if (paymentFilter === 'Paid') matchesPayment = u.balance <= 0;
            else if (paymentFilter === 'Unpaid') matchesPayment = u.balance > 0;
            else if (paymentFilter === 'Half Paid') {
                const pkg = state.packages.find(p => p.id === u.packageId);
                matchesPayment = u.balance > 0 && pkg && u.balance < pkg.price;
            } else if (paymentFilter === 'Overdue') {
                const hasOverdue = state.invoices.some(i => i.userId === u.id && (i.status === PaymentStatus.OVERDUE || (i.status === PaymentStatus.UNPAID && new Date(i.dueDate) < new Date())));
                matchesPayment = hasOverdue;
            }

            let matchesDate = true;
            const refDate = u.expiry ? new Date(u.expiry) : null;
            if (refDate && dateFilter !== 'All') {
                const diffMs = now.getTime() - refDate.getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                if (dateFilter === 'Today') matchesDate = Math.abs(diffDays) <= 1;
                else if (dateFilter === '3Days') matchesDate = diffDays >= 0 && diffDays <= 3;
                else if (dateFilter === '7Days') matchesDate = diffDays >= 0 && diffDays <= 7;
            }

            const matchesCollector = collectorFilter === 'All' || u.collectedBy === collectorFilter;

            return matchesSearch && matchesStatus && matchesPayment && matchesDate && matchesCollector;
        });
        return results;
    }, [state.users, searchTerm, statusFilter, paymentFilter, state.packages, state.invoices, dateFilter, collectorFilter]);

    const selectionStats = useMemo(() => {
        const users = Array.from(selectedUsers).map(id => state.users.find(u => u.id === id)).filter(Boolean) as ISPUser[];
        return {
            unpaid: users.filter(u => u.balance > 0).length,
            suspended: users.filter(u => u.status === UserStatus.SUSPENDED).length,
            expired: users.filter(u => u.status === UserStatus.EXPIRED).length,
            na: users.filter(u => !u.packageId).length
        };
    }, [selectedUsers, state.users]);

    const toggleUserSelection = (id: string) => {
        const next = new Set(selectedUsers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedUsers(next);
    };

    const allFilteredSelected = useMemo(() => 
        filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id)),
    [filteredUsers, selectedUsers]);

    const toggleAllSelection = () => {
        const next = new Set(selectedUsers);
        if (allFilteredSelected) {
            filteredUsers.forEach(u => next.delete(u.id));
        } else {
            filteredUsers.forEach(u => next.add(u.id));
        }
        setSelectedUsers(next);
    };

    const handleSelectionShortcut = (type: 'Unpaid' | 'Suspended' | 'Expired' | 'NA' | 'Inverse' | 'Clear') => {
        const next = new Set<string>();
        if (type === 'Clear') {
            setSelectedUsers(new Set());
            return;
        }
        if (type === 'Inverse') {
            filteredUsers.forEach(u => {
                if (!selectedUsers.has(u.id)) next.add(u.id);
            });
        } else {
            filteredUsers.forEach(u => {
                if (type === 'Unpaid' && u.balance > 0) next.add(u.id);
                if (type === 'Suspended' && u.status === UserStatus.SUSPENDED) next.add(u.id);
                if (type === 'Expired' && u.status === UserStatus.EXPIRED) next.add(u.id);
                if (type === 'NA' && !u.packageId) next.add(u.id);
            });
        }
        setSelectedUsers(next);
    };

    const handleBatchSuspend = async () => {
        if (selectedUsers.size === 0) return;
        setIsProcessing(true);
        try {
            await db.batchSuspendUsers(Array.from(selectedUsers), suspendReason);
            setSelectedUsers(new Set());
            setIsSuspendModalOpen(false);
        } catch (error) {
            console.error('Suspension Protocol Failure:', error);
            alert('Failure in suspension protocol. Consult system logs.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchActivate = () => {
        if (selectedUsers.size === 0) return;
        setIsBulkActivateModalOpen(true);
    };

    const handleConfirmBulkActivate = async () => {
        if (selectedUsers.size === 0) return;
        setIsProcessing(true);
        try {
            if (!canBypassApproval) {
                // Submit approval request for each user
                for (const id of Array.from(selectedUsers)) {
                    await db.submitApprovalRequest('Plan_Activation', id as string, 0, 'Auto', bulkActivateConfig.notes, bulkActivateConfig);
                }
                alert(`✓ ${selectedUsers.size} activation requests submitted to the Approval Desk.`);
                setSelectedUsers(new Set());
                setIsBulkActivateModalOpen(false);
            } else {
                const res = await db.bulkActivateSubscribers(Array.from(selectedUsers), bulkActivateConfig);
                if (res.success) {
                    setSelectedUsers(new Set());
                    setIsBulkActivateModalOpen(false);
                    alert(`Mass Activation Protocol successful for ${selectedUsers.size} nodes.`);
                } else {
                    alert(res.message);
                }
            }
        } catch (error) {
            console.error('Activation Command Failure:', error);
            alert('Critical failure in activation sequence.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchReminder = async (type: 'WhatsApp' | 'Email') => {
        if (selectedUsers.size === 0) return;
        if (type === 'Email') {
            // Use the dedicated email reminder function
            if (confirm(`Send email payment reminders to ${selectedUsers.size} subscribers?`)) {
                setIsProcessing(true);
                try {
                    const adminId = state.currentUser?.email || 'system';
                    const res = await db.bulkSendEmailReminder(Array.from(selectedUsers), adminId);
                    alert(`✓ Email reminders queued for ${res.count} subscribers.`);
                } catch (error) {
                    console.error('Email Reminder Failure:', error);
                    alert('Email broadcast failed. Check communication logs.');
                } finally {
                    setIsProcessing(false);
                }
            }
        } else {
            if (confirm(`Broadcast ${type} recovery reminders to ${selectedUsers.size} subscribers?`)) {
                setIsProcessing(true);
                try {
                    await db.bulkSendReminders(Array.from(selectedUsers), type);
                    alert(`Batch ${type} broadcast initiated.`);
                } catch (error) {
                    console.error('Reminder Broadcast Failure:', error);
                    alert('Communication layer failure during broadcast.');
                } finally {
                    setIsProcessing(false);
                }
            }
        }
    };

    const handleBulkFlash = async () => {
        if (flashConfirmText !== 'CONFIRM') {
            alert('Type CONFIRM to proceed.');
            return;
        }
        setIsProcessing(true);
        try {
            const adminId = state.currentUser?.email || 'system';
            if (!canBypassApproval) {
                for (const id of Array.from(selectedUsers)) {
                    await db.submitApprovalRequest('Clear_Dues', id as string, 0, 'Auto', `Flash Reset: ${flashMonths} months requested by ${adminId}`, { flashMonths });
                }
                alert(`✓ ${selectedUsers.size} flash reset requests submitted to the Approval Desk.`);
                setSelectedUsers(new Set());
                setIsBulkFlashModalOpen(false);
            } else {
                const res = await db.bulkFlashUsers(Array.from(selectedUsers), flashMonths, adminId);
                alert(`✓ Account Flash complete — ${res.count} accounts reset (${flashMonths} month(s) cleared).`);
                setSelectedUsers(new Set());
                setIsBulkFlashModalOpen(false);
                setFlashConfirmText('');
                setFlashMonths(1);
            }
        } catch (error) {
            console.error('Flash failure:', error);
            alert('Account flash failed. Check logs.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssignCollector = async () => {
        if (!selectedCollector) {
            alert('Please select a team member.');
            return;
        }
        setIsProcessing(true);
        try {
            const adminId = state.currentUser?.email || 'system';
            const res = await db.bulkAssignCollector(
                Array.from(selectedUsers),
                selectedCollector.email,
                selectedCollector.name,
                adminId
            );
            alert(`✓ Assigned ${selectedCollector.name} as collector for ${res.count} accounts.`);
            setIsAssignCollectorModalOpen(false);
            setSelectedCollector(null);
        } catch (error) {
            console.error('Collector assignment failure:', error);
            alert('Collector assignment failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchClearDues = async () => {
        if (selectedUsers.size === 0) return;
        if (confirm(`ADMIN_PROTOCOL: Permanently clear ALL arrears for ${selectedUsers.size} selected identities?`)) {
            setIsProcessing(true);
            try {
                if (!canBypassApproval) {
                    for (const id of Array.from(selectedUsers)) {
                        await db.submitApprovalRequest('Clear_Dues', id as string, 0, 'Auto', 'Batch administrative clearance', {});
                    }
                    alert(`✓ ${selectedUsers.size} dues clearance requests submitted to the Approval Desk.`);
                    setSelectedUsers(new Set());
                } else {
                    await db.bulkClearDues(Array.from(selectedUsers));
                    setSelectedUsers(new Set());
                    alert('Batch dues clearance completed.');
                }
            } catch (error) {
                console.error('Dues Clearance Failure:', error);
                alert('Fiscal clearance protocol interrupted.');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleBatchMarkUnpaid = async () => {
        if (selectedUsers.size === 0) return;
        setIsProcessing(true);
        try {
            if (!canBypassApproval) {
                for (const id of Array.from(selectedUsers)) {
                    await db.submitApprovalRequest('Plan_Activation', id as string, 0, 'Auto', `Retroactive Unpaid Entry: ${bulkUnpaidConfig.months} months. ${bulkUnpaidConfig.notes}`, bulkUnpaidConfig);
                }
                alert(`✓ ${selectedUsers.size} unpaid entry requests submitted to the Approval Desk.`);
                setSelectedUsers(new Set());
                setIsBulkUnpaidModalOpen(false);
            } else {
                const res = await db.bulkMarkUnpaid(
                    Array.from(selectedUsers),
                    bulkUnpaidConfig.packageId,
                    bulkUnpaidConfig.months,
                    bulkUnpaidConfig.paymentStatus,
                    bulkUnpaidConfig.notes
                );
                if (res.success) {
                    setSelectedUsers(new Set());
                    setIsBulkUnpaidModalOpen(false);
                    alert('Batch protocol committed successfully.');
                } else {
                    alert(res.message);
                }
            }
        } catch (error) {
            console.error('Fiscal Arrears Protocol Failure:', error);
            alert('Arrears commitment failure.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchPromiseToPay = async () => {
        if (selectedUsers.size === 0 || !bulkPromiseDate) return;
        setIsProcessing(true);
        try {
            await db.bulkSetPromiseToPay(Array.from(selectedUsers), bulkPromiseDate);
            setSelectedUsers(new Set());
            setIsBulkPromiseModalOpen(false);
            alert('Batch promise timestamps updated.');
        } catch (error) {
            console.error('Promise Registry Failure:', error);
            alert('Timestamp synchronization failure.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openPaymentModal = (user: ISPUser) => {
        setActiveUser(user);
        const pkg = state.packages.find(p => p.id === user.packageId);
        setPaymentAmount(user.balance > 0 ? user.balance : (pkg?.price || 0));
        setPaymentType('Full');
        setIsPaymentModalOpen(true);
    };

    const handleRecoveryPayment = async () => {
        if (!activeUser) return;
        const pkg = state.packages.find(p => p.id === activeUser.packageId);
        if (!pkg) return;

        setIsProcessing(true);
        try {
            if (!canBypassApproval) {
                await db.submitApprovalRequest('Payment_Collection', activeUser.id, paymentAmount, paymentMethod, collectionDetails.notes, {
                    packageId: activeUser.packageId,
                    price: pkg.price,
                    paymentStatus,
                    details: {
                        notes: collectionDetails.notes,
                        collectorName: collectionDetails.collectorName,
                        collectionDate: collectionDetails.collectionDate,
                        collectionTime: collectionDetails.collectionTime
                    }
                });
                setIsPaymentModalOpen(false);
                setActiveUser(null);
                alert('✓ Payment submission sent to Approval Desk. User status set to Pending Verification.');
            } else {
                const res = await db.resolvePlanActivationBilling(
                    activeUser.id,
                    activeUser.packageId,
                    pkg.price,
                    paymentStatus,
                    paymentMethod,
                    {
                        notes: collectionDetails.notes,
                        collectorName: collectionDetails.collectorName,
                        collectionDate: collectionDetails.collectionDate,
                        collectionTime: collectionDetails.collectionTime
                    }
                );

                if (res.success) {
                    setIsPaymentModalOpen(false);
                    setActiveUser(null);
                    setCollectionDetails({ ...collectionDetails, notes: '' });
                    alert('Payment registry protocol successful.');
                } else {
                    alert(res.message);
                }
            }
        } catch (error) {
            console.error('Payment Provisioning Failure:', error);
            alert('Financial provisioning protocol interrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetPromiseToPay = async () => {
        if (!activeUser || !promiseDate) return;
        setIsProcessing(true);
        try {
            await db.setPromiseToPay(activeUser.id, promiseDate);
            setPromiseDate('');
            alert('Promise-to-pay date set successfully.');
        } catch (error) {
            console.error('Promise Update Failure:', error);
            alert('Failed to update promise timestamp.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendReminder = async (type: 'Email' | 'WhatsApp') => {
        if (!activeUser) return;
        const res = await db.sendRecoveryReminder(activeUser.id, type);
        if (res.success) alert(`Reminder sent via ${type}`);
    };

    const handleClearDues = async (userId: string) => {
        if (!confirm('PROTOCOL_OVERRIDE: Are you sure you want to manually clear all remaining dues for this user? This will record an administrative adjustment.')) return;
        setIsProcessing(true);
        try {
            if (!canBypassApproval) {
                await db.submitApprovalRequest('Clear_Dues', userId, 0, 'Auto', 'Manual desk clearance', {});
                alert('✓ Clearance request submitted for approval.');
            } else {
                const res = await db.clearAllDues(userId);
                if (res.success) {
                    alert('Arrears cleared successfully. Registry updated.');
                } else {
                    alert(res.message);
                }
            }
        } catch (error) {
            console.error('Manual Clearance Failure:', error);
            alert('Clearance protocol failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openAdvancedModal = (user: ISPUser) => {
        setActiveUser(user);
        const pkg = state.packages.find(p => p.id === user.packageId);
        setPaymentAmount(user.balance > 0 ? user.balance : (pkg?.price || 0));
        setIsAdvancedModalOpen(true);
    };

    const handleAdvancedBilling = async () => {
        if (!activeUser) return;
        setIsProcessing(true);
        try {
            await db.advancedBillingControl(activeUser.id, {
                amount: paymentAmount,
                paymentType: billingConfig.paymentType,
                method: paymentMethod,
                cycle: billingConfig.cycle,
                customExpiry: billingConfig.customExpiry
            });
            setIsAdvancedModalOpen(false);
            setActiveUser(null);
            alert('Advanced tactical billing deployed.');
        } catch (error) {
            console.error('Advanced Billing Failure:', error);
            alert('Tactical billing deployment failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openAuditDossier = async (userId: string) => {
        const data = await db.getAuditDossier(userId);
        setAuditData(data);
        setIsAuditModalOpen(true);
    };

    return (
        <>
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <ModuleGuide
                moduleName="Collections & Recovery"
                description="Managing arrears, suspensions, and payment promises"
                items={[
                    { title: "Financial States", description: "Green/Full Paid = Clear balance. Yellow/Half = Partial payment. Red/Unpaid = Arrears detected." },
                    { title: "Batch Actions", description: "Select multiple identities to execute bulk suspensions or generate collective reminders." },
                    { title: "Dossier Access", description: "Click the File icon to view a detailed financial and activity history for any subscriber." }
                ]}
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                        <Receipt className="text-indigo-600" size={32} />
                        Collections & Recovery
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Central Operational Console for Suspended & Unpaid Registry</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => handleSelectionShortcut('Clear')}
                        disabled={selectedUsers.size === 0}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all active:scale-95 text-center ${selectedUsers.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <X size={16} /> Deselect ({selectedUsers.size})
                    </button>
                    <button
                        onClick={() => alert("Printing recovery list...")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all active:scale-95 text-center"
                    >
                        <Printer size={16} /> Print Sheet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Suspended', count: state.users.filter(u => u.status === UserStatus.SUSPENDED).length, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Unpaid Dues', count: state.users.filter(u => u.balance > 0).length, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Recovery Mode', count: state.users.filter(u => u.status === UserStatus.RECOVERY_MODE).length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Collections', count: `Rs. ${state.payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} ${stat.color} p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-center items-center text-center animate-in slide-in-from-bottom duration-300 delay-[${i * 100}ms]`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <p className="text-3xl font-black tracking-tighter italic">{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* SELECTION ACTION CONSOLE - TOP POSITIONED */}
            {selectedUsers.size > 0 && (
                <div className="animate-in slide-in-from-top-4 duration-500 mb-8 px-4 py-8 bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                <p className="text-3xl font-black text-white italic tracking-tighter leading-none">
                                    {selectedUsers.size} <span className="text-[10px] text-slate-500 not-italic font-black uppercase ml-1 tracking-widest">Targets Selected</span>
                                </p>
                                <div className="h-6 w-px bg-white/10" />
                                <div className="flex gap-2">
                                    {selectionStats.unpaid > 0 && <span className="text-[8px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">{selectionStats.unpaid} UNPAID</span>}
                                    {selectionStats.expired > 0 && <span className="text-[8px] font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">{selectionStats.expired} EXPIRED</span>}
                                    {selectionStats.suspended > 0 && <span className="text-[8px] font-black bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full border border-slate-500/20">{selectionStats.suspended} LOCKED</span>}
                                </div>
                            </div>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">Operational Batch Command Console Active</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-[1.5rem] border border-white/5">
                                <button
                                    onClick={() => setIsSuspendModalOpen(true)}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-rose-900/40 active:scale-95"
                                >
                                    <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Suspend</span>
                                </button>
                                <button
                                    onClick={handleBatchActivate}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95"
                                >
                                    <Zap size={16} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Activate</span>
                                </button>
                                <button
                                    onClick={() => setIsBulkUnpaidModalOpen(true)}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/40 active:scale-95"
                                >
                                    <BadgeDollarSign size={16} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Mark Unpaid</span>
                                </button>
                                <button
                                    onClick={() => setIsBulkPromiseModalOpen(true)}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-amber-900/40 active:scale-95"
                                >
                                    <Clock size={16} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Promise</span>
                                </button>
                                <button
                                    onClick={() => { setFlashConfirmText(''); setIsBulkFlashModalOpen(true); }}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-red-900/50 active:scale-95 border border-red-500/30"
                                >
                                    <Zap size={16} className="group-hover:animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Flash Reset</span>
                                </button>
                                <button
                                    onClick={() => setIsAssignCollectorModalOpen(true)}
                                    disabled={isProcessing}
                                    className="group px-6 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-[1rem] transition-all flex items-center gap-2 shadow-lg shadow-violet-900/40 active:scale-95"
                                >
                                    <UserCheck size={16} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Assign Collector</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-[1.5rem] border border-white/5">
                                <button
                                    onClick={() => handleBatchReminder('WhatsApp')}
                                    className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-[1rem] transition-all group"
                                >
                                    <Phone size={18} />
                                </button>
                                <button
                                    onClick={() => handleBatchReminder('Email')}
                                    className="p-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-[1rem] transition-all group"
                                >
                                    <Mail size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedUsers(new Set())}
                                className="p-4 bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-400 rounded-[1rem] transition-all border border-white/10 group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* DATE FILTER + COLLECTOR FILTER QUICK BAR */}
                <div className="px-8 pt-6 pb-0 flex flex-wrap items-center gap-3 border-b border-slate-50">
                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {(['All', 'Today', '3Days', '7Days'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setDateFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                    dateFilter === f ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {f === 'All' ? 'All Time' : f === 'Today' ? 'Expiring Today' : f === '3Days' ? 'Last 3 Days' : 'Last 7 Days'}
                            </button>
                        ))}
                    </div>
                    <select
                        value={collectorFilter}
                        onChange={(e) => setCollectorFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-indigo-300 transition-all"
                    >
                        <option value="All">All Collectors</option>
                        {state.staff.filter(s => s.status === 'Active').map(s => (
                            <option key={s.email} value={s.email}>{s.name}</option>
                        ))}
                    </select>
                    {(dateFilter !== 'All' || collectorFilter !== 'All') && (
                        <button
                            onClick={() => { setDateFilter('All'); setCollectorFilter('All'); }}
                            className="px-3 py-2 text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 transition-all"
                        >
                            <X size={10} /> Clear Filters
                        </button>
                    )}
                    <div className="ml-auto px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{filteredUsers.length} Results</div>
                </div>
                <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={toggleAllSelection}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${allFilteredSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                             {allFilteredSelected ? 'Unselect All' : 'Select All Filtered'}
                        </button>
                        <button
                            onClick={() => handleSelectionShortcut('Unpaid')}
                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-rose-100 transition-all border border-rose-100"
                        >
                            Select Unpaid
                        </button>
                        <button
                            onClick={() => handleSelectionShortcut('Expired')}
                            className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-amber-100 transition-all border border-amber-100"
                        >
                            Select Expired
                        </button>
                        <button
                            onClick={() => handleSelectionShortcut('Suspended')}
                            className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            Select Suspended
                        </button>
                        <button
                            onClick={() => handleSelectionShortcut('NA')}
                            className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            Select N/A
                        </button>
                        <button
                            onClick={() => handleSelectionShortcut('Inverse')}
                            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-slate-50 transition-all"
                        >
                            Inverse Selection
                        </button>
                    </div>
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Type Name or ID..."
                            className="w-full pl-16 pr-24 py-5 bg-slate-50 border-none rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest placeholder:lowercase placeholder:font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{filteredUsers.length} Results</div>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <select
                            className="flex-1 lg:flex-none px-6 py-5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="All">All Statuses</option>
                            {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            className="flex-1 lg:flex-none px-6 py-5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value as any)}
                        >
                            <option value="All">Payment Status: All</option>
                            <option value="Paid">Fully Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Half Paid">Half Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-6">
                                    <button onClick={toggleAllSelection} className="w-5 h-5 flex items-center justify-center rounded-lg border-2 border-slate-300 transition-all">
                                        {allFilteredSelected ? <CheckSquare className="text-indigo-600" size={16} /> : <Square className="text-slate-200" size={16} />}
                                    </button>
                                </th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Identity</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Package</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Account Status</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Payment Status</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Financials</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Service Info</th>
                                <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map(user => {
                                const pkg = state.packages.find(p => p.id === user.packageId);
                                const balance = user.balance;
                                const remaining = Math.max(0, balance);
                                const hasPkg = !!user.packageId;
                                const isHalfPaid = hasPkg && balance > 0 && pkg && balance < pkg.price;
                                const isFullPaid = hasPkg && balance <= 0;

                                return (
                                    <tr key={user.id} className={`hover:bg-slate-50/80 transition-all group ${selectedUsers.has(user.id) ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="px-8 py-6">
                                            <button onClick={() => toggleUserSelection(user.id)} className="w-5 h-5 flex items-center justify-center rounded-lg border-2 border-slate-300 transition-all">
                                                {selectedUsers.has(user.id) ? <CheckSquare className="text-indigo-600" size={16} /> : <Square className="text-slate-200" size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-6 font-black">
                                            <div 
                                                className="flex items-center gap-4 cursor-pointer hover:bg-slate-100 p-2 rounded-2xl transition-all"
                                                onClick={() => openPaymentModal(user)}
                                            >
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0 group-hover:scale-110 transition-transform italic border border-white shadow-sm">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tighter text-sm leading-none mb-1 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                                                        ID: {user.id} {user.isRecoveryMode && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                                                    </p>
                                                    {user.collectorName && (
                                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                            <UserCheck size={8} /> {user.collectorName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{pkg?.name || 'N/A'}</p>
                                            <p className="text-[9px] text-slate-400 font-black tracking-widest mt-1 italic">{hasPkg ? `${(pkg?.price || 0).toLocaleString()} PKR` : 'Not Provisioned'}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center w-fit gap-2 border shadow-sm ${!hasPkg ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                                user.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                user.status === UserStatus.SUSPENDED ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    user.status === UserStatus.RECOVERY_MODE ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' :
                                                        'bg-orange-50 text-orange-600 border-orange-100'
                                                }`}>
                                                {!hasPkg ? <Clock size={12} /> : user.status === UserStatus.ACTIVE ? <ShieldCheck size={12} /> :
                                                user.status === UserStatus.SUSPENDED ? <Lock size={12} /> :
                                                user.status === UserStatus.RECOVERY_MODE ? <ShieldAlert size={12} /> : null}
                                                {!hasPkg ? 'N/A' : user.status}
                                            </span>
                                            {user.promiseToPayDate && (
                                                <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white border border-indigo-500 rounded-lg w-fit shadow-sm animate-pulse">
                                                    <Clock size={10} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Promise: {new Date(user.promiseToPayDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center w-fit gap-2 border shadow-sm ${!hasPkg ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                                isFullPaid ? 'bg-emerald-600 text-white border-emerald-500' :
                                                isHalfPaid ? 'bg-yellow-400 text-slate-900 border-yellow-300' :
                                                    'bg-rose-600 text-white border-rose-500'
                                                }`}>
                                                {!hasPkg ? 'N/A' : isFullPaid ? '🟢 Full Paid' : isHalfPaid ? '🟡 Half Paid' : '🔴 Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dues: <span className="text-slate-950 font-black">Rs. {remaining.toLocaleString()}</span></p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Paid: <span className="text-emerald-600 font-black">Rs. {hasPkg ? Math.max(0, (pkg?.price || 0) - balance).toLocaleString() : '0'}</span></p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-slate-300" />
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expires {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <History size={12} className="text-slate-300" />
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Pay: {user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'Never'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openAuditDossier(user.id)}
                                                    title="View Identity Dossier"
                                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all active:scale-90"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                {balance > 0 && (
                                                    <button
                                                        onClick={() => handleClearDues(user.id)}
                                                        title="Force Clear All Dues"
                                                        className="p-3 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <ShieldCheck size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center">
                                                <Search size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">No Subscribers Detected</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">The isolation filter returned zero matches for "{searchTerm}"</p>
                                            </div>
                                            <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); setPaymentFilter('All'); }} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Clear All Protocols</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

            {/* SUSPEND MODAL */}
            {isSuspendModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border-[8px] border-rose-500 animate-in zoom-in duration-300">
                        <div className="p-12 text-center space-y-8">
                            <div className="w-24 h-24 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse"><Lock size={56} strokeWidth={3} /></div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Isolation Protocol</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">Suspending {selectedUsers.size} users will instantly kill their network sessions and lock billing actions.</p>
                            </div>
                            <div className="text-left space-y-4">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Suspension Logic Signature</label>
                                <input
                                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-rose-500/10 placeholder:font-normal"
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    placeholder="Input reason for suspension audit..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsSuspendModalOpen(false)} className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
                                <button onClick={handleBatchSuspend} className="flex-2 py-6 bg-rose-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl shadow-rose-100 transition-all">Command Suspension</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION PANEL POPUP */}
            {isPaymentModalOpen && activeUser && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border-[8px] border-indigo-500 animate-in zoom-in duration-300 flex max-h-[95vh]">

                        {/* LEFT PANEL: ASSORTED ACTIONS & USER DETAILS */}
                        <div className="flex-1 p-10 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50 relative">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-xl italic font-black text-2xl">{activeUser.name.charAt(0)}</div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">{activeUser.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeUser.id} • {state.packages.find(p => p.id === activeUser.packageId)?.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                                    <p className="text-2xl font-black text-rose-600">Rs. {activeUser.balance.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Payment</p>
                                    <p className="text-sm font-black text-slate-700 mt-2">{activeUser.lastPaymentDate ? new Date(activeUser.lastPaymentDate).toLocaleDateString() : 'None'}</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Invoice History</p>
                                    <div className="space-y-2">
                                        {state.invoices.filter(i => i.userId === activeUser.id).slice(0, 3).map(inv => (
                                            <div key={inv.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Receipt size={14} className="text-slate-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-black">Rs. {inv.totalAmount.toLocaleString()}</p>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${inv.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{inv.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {state.invoices.filter(i => i.userId === activeUser.id).length === 0 && (
                                            <p className="text-[10px] font-bold text-slate-400 italic">No invoices found.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow Up Actions</p>
                                    <div className="flex gap-2">
                                        <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none" value={promiseDate} onChange={(e) => setPromiseDate(e.target.value)} />
                                        <button onClick={handleSetPromiseToPay} className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-200">Set Promise</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                         <button onClick={() => handleSendReminder('WhatsApp')} className="py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 hover:border-emerald-300">WhatsApp</button>
                                         <button onClick={() => handleSendReminder('Email')} className="py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-indigo-300">Email</button>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: PAYMENT CAPTURE */}
                        <div className="flex-1 p-10 flex flex-col bg-white">
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setIsPaymentModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"><X size={24} /></button>
                            </div>

                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Activation Strategy</h4>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { id: 'Paid', label: 'Full Paid', desc: 'Activate with payment', icon: <ShieldCheck size={16} />, color: 'bg-emerald-600' },
                                    { id: 'Half', label: 'Half Paid', desc: '50% collection', icon: <Activity size={16} />, color: 'bg-indigo-600' },
                                    { id: 'Unpaid', label: 'Unpaid', desc: 'Activate on credit', icon: <Clock size={16} />, color: 'bg-orange-600' },
                                    { id: 'Emergency', label: 'Emergency', desc: '3-day grace access', icon: <Zap size={16} />, color: 'bg-rose-600' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setPaymentStatus(m.id as any)}
                                        className={`flex flex-col items-start p-5 rounded-[2rem] border-2 transition-all group ${paymentStatus === m.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}
                                    >
                                        <div className={`w-10 h-10 ${m.color} text-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>{m.icon}</div>
                                        <p className={`font-black text-[10px] uppercase tracking-widest ${paymentStatus === m.id ? 'text-indigo-700' : 'text-slate-600'}`}>{m.label}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{m.desc}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Collection Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10"
                                            value={collectionDetails.collectionDate}
                                            onChange={(e) => setCollectionDetails({ ...collectionDetails, collectionDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Collected By</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10"
                                            value={collectionDetails.collectorName}
                                            onChange={(e) => setCollectionDetails({ ...collectionDetails, collectorName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Collector Notes & Handshake Memo</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[80px]"
                                        value={collectionDetails.notes}
                                        onChange={(e) => setCollectionDetails({ ...collectionDetails, notes: e.target.value })}
                                        placeholder="Input collection notes, promise details, or handshake remarks..."
                                    />
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button onClick={handleRecoveryPayment} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3 italic">
                                    <ShieldCheck size={24} /> Authorize Provisioning
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADVANCED BILLING MODAL */}
            {isAdvancedModalOpen && activeUser && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-emerald-500 animate-in zoom-in duration-300">
                        <div className="p-12 space-y-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl italic font-black text-3xl"><Zap size={40} /></div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Advanced Override</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Strategic Billing Configuration for {activeUser.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAdvancedModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"><X size={28} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Override Payment Type</label>
                                        <div className="space-y-2">
                                            {['Full Paid', 'Half Paid', 'Advance Paid'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setBillingConfig(prev => ({ ...prev, paymentType: t as any }))}
                                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${billingConfig.paymentType === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                                >
                                                    {t} {billingConfig.paymentType === t && <ShieldCheck size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Billing Cycle Protocol</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['15 days', '30 days', 'Custom', 'Manual'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setBillingConfig(prev => ({ ...prev, cycle: c as any }))}
                                                    className={`flex items-center justify-center p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${billingConfig.cycle === c ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Collected Cash (PKR)</label>
                                        <input
                                            type="number"
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl tracking-tighter outline-none focus:border-emerald-500 transition-all"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Manual Expiry Override</label>
                                        <input
                                            type="date"
                                            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-emerald-500 transition-all"
                                            onChange={(e) => setBillingConfig(prev => ({ ...prev, customExpiry: e.target.value }))}
                                        />
                                        <p className="text-[8px] text-slate-400 font-bold uppercase italic leading-tight px-2">Leave blank for automatic cycle calculation based on selection.</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleAdvancedBilling} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 italic transition-all active:scale-95 flex items-center justify-center gap-4">
                                <Activity size={28} /> Deploy Optimized Billing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUDIT MODAL */}
            {isAuditModalOpen && auditData && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[6000] flex items-center justify-center p-8">
                    <div className="bg-white rounded-[4rem] w-full max-w-4xl max-h-[90vh] shadow-high overflow-hidden border border-white/20 flex flex-col animate-in zoom-in duration-500">
                        <div className="p-12 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white">
                                    <FileText size={32} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-950 font-sans leading-none mb-2">Audit Dossier: {auditData.identity.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Comprehensive Asset & Ledger Investigation Protocol</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"><Printer size={20} /></button>
                                <button onClick={() => setIsAuditModalOpen(false)} className="p-4 bg-slate-100 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-12 bg-white selection:bg-indigo-100 italic">
                            <div className="grid grid-cols-3 gap-8">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Identity Fingerprint</p>
                                    <div className="space-y-4 font-black">
                                        <p className="text-xs uppercase flex items-center justify-between">Node ID: <span className="text-slate-950">{auditData.identity.id}</span></p>
                                        <p className="text-xs uppercase flex items-center justify-between">Status: <span className="text-indigo-600">{auditData.identity.status}</span></p>
                                        <p className="text-xs uppercase flex items-center justify-between">Region: <span className="text-slate-950">{auditData.identity.area}</span></p>
                                    </div>
                                </div>
                                <div className="p-8 bg-emerald-50 text-emerald-900 rounded-[2.5rem] border-2 border-emerald-100">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-4">Service Asset</p>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-black italic tracking-tighter leading-none">{auditData.package?.name || 'TERMINATED'}</p>
                                        <p className="text-[10px] uppercase font-black tracking-widest">Rate: Rs. {(auditData.package?.price || 0).toLocaleString()}/mo</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-rose-50 text-rose-900 rounded-[2.5rem] border-2 border-rose-100">
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-4">Fiscal Risk</p>
                                    <p className="text-3xl font-black italic tracking-tighter leading-none mb-1">Rs. {auditData.identity.balance || 0}</p>
                                    <p className="text-[10px] uppercase font-black tracking-widest">Outstanding Receivables</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-indigo-600 pl-4">System Transaction Ledger (Last 50 Events)</h4>
                                <div className="space-y-3">
                                    {auditData.systemLogs.length === 0 ? (
                                        <div className="py-12 text-center text-slate-300 font-black uppercase text-[10px] border-2 border-dashed rounded-[2rem]">No recovery actions recorded for this node.</div>
                                    ) : (
                                        auditData.systemLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((log: any) => (
                                            <div key={log.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all"><Zap size={20} /></div>
                                                    <div>
                                                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none mb-1">{log.action}</p>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{log.details}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-950 leading-none mb-1">{new Date(log.timestamp).toLocaleString()}</p>
                                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">Authorized by {log.adminName}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-emerald-600 pl-4">Financial Receipt History</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {auditData.paymentHistory.map((pay: any) => (
                                        <div key={pay.id} className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-3xl flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100"><HandCoins size={18} /></div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg leading-none mb-1">Rs. {pay.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{pay.method} • {new Date(pay.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-[7px] font-black text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full uppercase italic tracking-widest">COMITTED</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-950 text-white shrink-0 flex justify-between items-center italic">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Security Hash: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><Printer size={16} /> Print Full Dossier</button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40"><Download size={16} /> Export CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BATCH MARK UNPAID MODAL */}
            {isBulkUnpaidModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border-[8px] border-indigo-600 overflow-hidden">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl italic font-black text-3xl">
                                        <BadgeDollarSign size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Mark Unpaid Protocol</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assigning fiscal arrears to {selectedUsers.size} Targets</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsBulkUnpaidModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Select Target Plan</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                            value={bulkUnpaidConfig.packageId}
                                            onChange={(e) => setBulkUnpaidConfig(prev => ({ ...prev, packageId: e.target.value }))}
                                        >
                                            {state.packages.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>{pkg.name} - (Rs. {pkg.price})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Quantity (Packages/Months)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none focus:border-indigo-500 transition-all font-sans"
                                            value={bulkUnpaidConfig.months}
                                            onChange={(e) => setBulkUnpaidConfig(prev => ({ ...prev, months: parseInt(e.target.value) || 1 }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Fiscal Resolution Status</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'Unpaid', label: '100% Unpaid', color: 'rose' },
                                                { id: 'Half', label: '50% Paid (Half)', color: 'amber' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setBulkUnpaidConfig(prev => ({ ...prev, paymentStatus: t.id as any }))}
                                                    className={`p-4 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${bulkUnpaidConfig.paymentStatus === t.id ? `bg-${t.color}-50 border-${t.color}-500 text-${t.color}-700` : 'bg-white border-slate-100 text-slate-400'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Handshake Memo / Notes <span className="text-rose-500 font-black">(REQUIRED)</span></label>
                                        <textarea
                                            className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none transition-all min-h-[100px] resize-none ${!bulkUnpaidConfig.notes ? 'border-rose-100 placeholder:text-rose-300' : 'border-slate-100 focus:border-indigo-500'}`}
                                            placeholder="MUST INPUT REASON FOR AUDIT LOG..."
                                            value={bulkUnpaidConfig.notes}
                                            onChange={(e) => setBulkUnpaidConfig(prev => ({ ...prev, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-indigo-200">
                                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1 italic">Financial Preview Handshake:</p>
                                <p className="text-xl font-black text-slate-900 leading-none">
                                    Total Charge: Rs. {((state.packages.find(p => p.id === bulkUnpaidConfig.packageId)?.price || 0) * bulkUnpaidConfig.months).toLocaleString()} 
                                    <span className="text-[10px] text-slate-400 ml-2 font-black italic">
                                        ({bulkUnpaidConfig.paymentStatus === 'Half' ? 'Rs. ' + (((state.packages.find(p => p.id === bulkUnpaidConfig.packageId)?.price || 0) * bulkUnpaidConfig.months) / 2).toLocaleString() + ' will be marked as Balance' : 'Full Arrears Committed'})
                                    </span>
                                </p>
                            </div>

                            <button
                                onClick={handleBatchMarkUnpaid}
                                disabled={isProcessing || !bulkUnpaidConfig.notes}
                                className={`w-full py-8 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl italic transition-all active:scale-95 flex items-center justify-center gap-4 ${!bulkUnpaidConfig.notes ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-950 shadow-indigo-100'}`}
                            >
                                <Zap size={28} /> {isProcessing ? 'AUTHORIZING...' : !bulkUnpaidConfig.notes ? 'Audit Notes Missing' : 'DEPLOY FISCAL ARREARS'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BATCH ACTIVATE MODAL */}
            {isBulkActivateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border-[8px] border-emerald-600 overflow-hidden">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl italic font-black text-3xl">
                                        <Zap size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Activation Command</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Re-Provisioning {selectedUsers.size} Targets</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsBulkActivateModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Select Target Plan</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            value={bulkActivateConfig.packageId}
                                            onChange={(e) => setBulkActivateConfig(prev => ({ ...prev, packageId: e.target.value }))}
                                        >
                                            {state.packages.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>{pkg.name} - (Rs. {pkg.price})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">New Expiration Registry (Calendar)</label>
                                        <input
                                            type="date"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none focus:border-emerald-500 transition-all font-sans"
                                            value={bulkActivateConfig.expiryDate}
                                            onChange={(e) => setBulkActivateConfig(prev => ({ ...prev, expiryDate: e.target.value }))}
                                        />
                                        <p className="text-[8px] text-slate-400 font-black uppercase ml-2 italic">Standard 30-day auto-plan default</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Immediate Fiscal Resolution</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'Paid', label: 'Paid', color: 'emerald' },
                                                { id: 'Unpaid', label: 'Unpaid', color: 'rose' },
                                                { id: 'Half', label: 'Half', color: 'amber' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setBulkActivateConfig(prev => ({ ...prev, paymentStatus: t.id as any }))}
                                                    className={`py-3 rounded-xl border-2 font-black text-[8px] uppercase tracking-widest transition-all ${bulkActivateConfig.paymentStatus === t.id ? `bg-${t.color}-50 border-${t.color}-500 text-${t.color}-700` : 'bg-white border-slate-100 text-slate-400'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Operational Memo <span className="text-rose-500 font-black">(REQUIRED)</span></label>
                                        <textarea
                                            className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none transition-all min-h-[100px] resize-none ${!bulkActivateConfig.notes ? 'border-rose-100 placeholder:text-rose-300' : 'border-slate-100 focus:border-emerald-500'}`}
                                            placeholder="MUST INPUT REASON FOR AUDIT LOG..."
                                            value={bulkActivateConfig.notes}
                                            onChange={(e) => setBulkActivateConfig(prev => ({ ...prev, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmBulkActivate}
                                disabled={isProcessing || !bulkActivateConfig.notes}
                                className={`w-full py-8 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl italic transition-all active:scale-95 flex items-center justify-center gap-4 ${!bulkActivateConfig.notes ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-950 shadow-emerald-100'}`}
                            >
                                <Zap size={28} /> {isProcessing ? 'AUTHORIZING...' : !bulkActivateConfig.notes ? 'Audit Notes Missing' : 'EXECUTE MASS ACTIVATION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* BATCH PROMISE MODAL */}
            {isBulkPromiseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight italic flex items-center gap-3">
                                    <Clock className="text-amber-500" />
                                    Batch Promise Registry
                                </h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Updating {selectedUsers.size} Targets</p>
                            </div>
                            <button onClick={() => setIsBulkPromiseModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Extension Date</label>
                                <input
                                    type="date"
                                    value={bulkPromiseDate}
                                    onChange={(e) => setBulkPromiseDate(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleBatchPromiseToPay}
                                disabled={!bulkPromiseDate || isProcessing}
                                className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                AUTHORIZE BATCH TIMESTAMPS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK FLASH RESET MODAL */}
            {isBulkFlashModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[7000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300 border-[6px] border-red-600 overflow-hidden">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                                        <Zap size={36} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Account Flash Reset</h3>
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Resetting {selectedUsers.size} accounts — irreversible</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsBulkFlashModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-3xl">
                                <p className="text-[10px] font-black text-red-800 uppercase tracking-widest leading-relaxed">
                                    ⚠ This will clear balance to zero, remove all invoices within the selected window, and reset recovery mode. The user's package will be KEPT. This action cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Months of Data to Clear</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={1}
                                        max={12}
                                        value={flashMonths}
                                        onChange={(e) => setFlashMonths(parseInt(e.target.value))}
                                        className="flex-1 accent-red-600"
                                    />
                                    <span className="w-16 text-center py-2 px-3 bg-red-50 text-red-700 font-black text-xl rounded-xl border-2 border-red-200">{flashMonths}</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Clearing invoices from last {flashMonths} month(s)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type <span className="text-red-600 font-black">CONFIRM</span> to proceed</label>
                                <input
                                    type="text"
                                    value={flashConfirmText}
                                    onChange={(e) => setFlashConfirmText(e.target.value.toUpperCase())}
                                    placeholder="CONFIRM"
                                    className={`w-full px-6 py-4 border-2 rounded-2xl font-black text-lg tracking-widest outline-none transition-all ${flashConfirmText === 'CONFIRM' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50'}`}
                                />
                            </div>

                            <button
                                onClick={handleBulkFlash}
                                disabled={isProcessing || flashConfirmText !== 'CONFIRM'}
                                className={`w-full py-6 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] italic transition-all active:scale-95 flex items-center justify-center gap-3 ${flashConfirmText !== 'CONFIRM' ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-900/30'}`}
                            >
                                <Zap size={20} /> {isProcessing ? 'FLASHING...' : flashConfirmText !== 'CONFIRM' ? 'Type CONFIRM First' : `FLASH ${selectedUsers.size} ACCOUNTS`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN COLLECTOR MODAL */}
            {isAssignCollectorModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[7000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border-[6px] border-violet-600 overflow-hidden">
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-violet-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                                        <UserCheck size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">Assign Collector</h3>
                                        <p className="text-[10px] text-violet-500 font-black uppercase tracking-widest">Assigning {selectedUsers.size} accounts to team member</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAssignCollectorModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Team Member</label>
                                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                    {state.staff.filter(s => s.status === 'Active').map(member => (
                                        <button
                                            key={member.email}
                                            onClick={() => setSelectedCollector({ email: member.email, name: member.name })}
                                            className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${selectedCollector?.email === member.email ? 'border-violet-500 bg-violet-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${selectedCollector?.email === member.email ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={`font-black text-sm uppercase tracking-tighter leading-none ${selectedCollector?.email === member.email ? 'text-violet-700' : 'text-slate-900'}`}>{member.name}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{member.role} • {member.email}</p>
                                            </div>
                                            {selectedCollector?.email === member.email && (
                                                <ShieldCheck size={18} className="ml-auto text-violet-600" />
                                            )}
                                        </button>
                                    ))}
                                    {state.staff.filter(s => s.status === 'Active').length === 0 && (
                                        <div className="py-8 text-center text-slate-400 font-black text-xs uppercase tracking-widest">No active team members found.</div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAssignCollector}
                                disabled={isProcessing || !selectedCollector}
                                className={`w-full py-6 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] italic transition-all active:scale-95 flex items-center justify-center gap-3 ${!selectedCollector ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-violet-600 hover:bg-violet-700 shadow-2xl shadow-violet-900/20'}`}
                            >
                                <UserCheck size={20} /> {isProcessing ? 'ASSIGNING...' : !selectedCollector ? 'Select a Collector First' : `ASSIGN ${selectedCollector.name.toUpperCase()}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Recovery;


import React from 'react';
import { useAdmission } from '../hooks/useAdmission';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import {
    Users, FileText, CheckSquare, Award, DollarSign, ArrowRight,
    TrendingUp, FilePlus, UserPlus, Calendar, CreditCard, ShieldAlert,
    Clock, PhoneCall, CheckCircle, AlertCircle, Sparkles, BookOpen, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { DashboardMapper } from '../../dashboard/utils/dashboard.mapper';

function MetricCard({ title, value, sub, icon: Icon, color }: any) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
                {sub && <p className="text-xs text-gray-500 font-medium mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}

import { DashboardProvider } from '../../dashboard/core/DashboardProvider';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
// Phase 3.3 Enterprise Workspace imports
import { WorkQueue } from '../../dashboard/components/workqueue/WorkQueue';
import { QuickActions } from '../../dashboard/components/actions/QuickActions';
import { AdmissionsCrossModulePanel } from '../../dashboard/components/widgets/CrossModulePanels';
import { RoleDashboardInsights } from '../../dashboard/components/analytics/RoleDashboardInsights';
import { HealthPanel } from '../../dashboard/components/health/HealthPanel';
import AdmissionOfficerDashboard from './Workspace/AdmissionOfficerDashboard';

export function DashboardPage() {
    return (
        <DashboardProvider>
            <DashboardPageInner />
        </DashboardProvider>
    );
}

function DashboardPageInner() {
    const { user, hasPermission, hasRole } = useAuth();
    const roles = user?.roles || [];
    const permCtx = { roles, hasPermission, hasRole };

    const isReceptionist = AdmissionPermissions.isReceptionist(permCtx);
    const isCounselor = AdmissionPermissions.isCounselor(permCtx);
    const isAdmissionOfficer = AdmissionPermissions.isAdmissionOfficer(permCtx);
    const isExamCell = AdmissionPermissions.isExamCell(permCtx);
    const isPrincipal = AdmissionPermissions.isPrincipal(permCtx);
    const isFinance = AdmissionPermissions.isFinance(permCtx);
    const isParent = AdmissionPermissions.isParent(permCtx);

    const { kpis: engineKPIs, tasks: engineTasks } = useDashboard();

    const getKPIValue = (id: string, fallback: number | string) => {
        const item = engineKPIs.find(k => k.id === id);
        return item ? item.value : fallback;
    };

    const { stats } = useAdmission();

    // ----------------------------------------------------
    // 1. PARENT WORKSPACE
    // ----------------------------------------------------
    if (isParent) {
        return (
            <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            Welcome, Parent <Sparkles className="w-5 h-5 text-indigo-500" />
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Track your candidate's admission lifecycle steps.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard title="Application Status" value="Under Review" sub="Doc verification phase" icon={FileText} color="text-indigo-600 bg-indigo-50" />
                    <MetricCard title="Required Docs" value="1 Pending" sub="Needs re-upload" icon={ShieldAlert} color="text-rose-600 bg-rose-50" />
                    <MetricCard title="Admission Fee" value="₹45,000" sub="Due by July 15" icon={DollarSign} color="text-emerald-600 bg-emerald-50" />
                    <MetricCard title="Active Offers" value="0 Pending" sub="Awaiting merit list release" icon={Award} color="text-amber-600 bg-amber-50" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-gray-900">Application Progress Timeline</h2>
                    <div className="relative pl-6 border-l-2 border-dashed border-indigo-200 space-y-6">
                        <div className="relative">
                            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                            <p className="text-xs font-bold text-gray-900">Inquiry Submitted</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Completed on June 15</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                            <p className="text-xs font-bold text-gray-900">Application Form Drafted & Filed</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Completed on June 18</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm animate-pulse" />
                            <p className="text-xs font-bold text-gray-900">Document verification under process</p>
                            <p className="text-[10px] text-amber-600 mt-0.5">Assigned to Admission Desk</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // 2. RECEPTIONIST WORKSPACE
    // ----------------------------------------------------
    if (isReceptionist) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Receptionist Desk</h1>
                    <p className="text-sm text-gray-500 mt-1">Walk-in visitors registry and inquiry logging.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard title="Walk-ins Today" value={getKPIValue('reception.kpi.walkins', 12)} sub="Logged visitors" icon={Users} color="text-blue-600 bg-blue-50" />
                    <MetricCard title="New Inquiries" value={8} sub="Added to CRM flow" icon={FilePlus} color="text-purple-600 bg-purple-50" />
                    <MetricCard title="Appointments Scheduled" value={5} sub="Counselor slots booked" icon={Calendar} color="text-amber-600 bg-amber-50" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Today's Walk-in Registers</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-bold">
                                    <th className="pb-3">Visitor Name</th>
                                    <th className="pb-3">Contact</th>
                                    <th className="pb-3">Purpose</th>
                                    <th className="pb-3">Time</th>
                                    <th className="pb-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50 text-gray-700">
                                    <td className="py-3 font-bold">Rajesh Kumar</td>
                                    <td className="py-3">+91 98765 43210</td>
                                    <td className="py-3">Admission inquiry for Grade 1</td>
                                    <td className="py-3">10:30 AM</td>
                                    <td className="py-3 text-right"><button className="text-primary hover:underline font-bold">Assign Lead</button></td>
                                </tr>
                                <tr className="text-gray-700">
                                    <td className="py-3 font-bold">Anita Sharma</td>
                                    <td className="py-3">+91 98765 12345</td>
                                    <td className="py-3">Scheduled counseling appointment</td>
                                    <td className="py-3">11:15 AM</td>
                                    <td className="py-3 text-right"><span className="text-gray-400 font-medium">Assigned</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // 3. COUNSELOR WORKSPACE
    // ----------------------------------------------------
    if (isCounselor) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Counselor Console</h1>
                    <p className="text-sm text-gray-500 mt-1">Lead assignments, follow-ups call scheduling, and conversion ratios.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard title="Assigned Leads" value="28" sub="Assigned to your queue" icon={Users} color="text-blue-600 bg-blue-50" />
                    <MetricCard title="Pending Follow-ups" value="6" sub="Due calls today" icon={PhoneCall} color="text-amber-600 bg-amber-50" />
                    <MetricCard title="Conversion Rate" value={getKPIValue('principal.kpi.conversions', '48%')} sub="Inquiry to Application" icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Assigned Leads Queue</h2>
                    <div className="space-y-3">
                        {(engineTasks && engineTasks.length > 0 ? engineTasks.map((t: any) => ({
                            name: t.title,
                            grade: t.description || 'Grade General',
                            details: t.status
                        })) : [
                            { name: 'Amit Verma', grade: 'Grade 5', details: 'Waiting for follow-up callback' },
                            { name: 'Sunita Patel', grade: 'Grade 8', details: 'Requested syllabus info' }
                        ]).map((lead: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl border border-solid border-gray-100 flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-bold text-gray-900">{lead.name} ({lead.grade})</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{lead.details}</p>
                                </div>
                                <button className="px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">
                                    Log Call
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // 4. ADMISSION OFFICER WORKSPACE
    // ----------------------------------------------------
    if (isAdmissionOfficer) {
        return <AdmissionOfficerDashboard />;
    }

    // ----------------------------------------------------
    // 5. EXAM CELL WORKSPACE
    // ----------------------------------------------------
    if (isExamCell) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Exam Cell Console</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage entrance test registries, panels feedback, and generate merit lists.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard title="Scheduled Exams" value="8" sub="Upcoming dates" icon={Calendar} color="text-blue-600 bg-blue-50" />
                    <MetricCard title="Pending Marks" value="14" sub="To be uploaded" icon={FileText} color="text-purple-600 bg-purple-50" />
                    <MetricCard title="Scheduled Interviews" value="5" sub="Panels logged" icon={Users} color="text-amber-600 bg-amber-50" />
                    <MetricCard title="Merit Pending" value="3 Lists" sub="Ready to compile" icon={Award} color="text-rose-600 bg-rose-50" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Entrance Evaluation Desk</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-solid border-gray-100 flex flex-col justify-between h-36">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Generate Grade 11 Merit List</p>
                                <p className="text-[10px] text-gray-500 mt-1">Computes scores for 45 tested applicants</p>
                            </div>
                            <button className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors text-xs">
                                Compile Merit List
                            </button>
                        </div>
                        <div className="p-4 rounded-xl border border-solid border-gray-100 flex flex-col justify-between h-36">
                            <div>
                                <p className="text-xs font-bold text-gray-900">Upload Interview Scores</p>
                                <p className="text-[10px] text-gray-500 mt-1">Awaiting panels logs updates</p>
                            </div>
                            <button className="w-full py-2 rounded-lg bg-purple-50 text-purple-600 font-bold hover:bg-purple-100 transition-colors text-xs">
                                Enter Panel Scores
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // 6. PRINCIPAL / HOI WORKSPACE
    // ----------------------------------------------------
    if (isPrincipal) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Principal Approvals Panel</h1>
                    <p className="text-sm text-gray-500 mt-1">Merit list approvals, offer triggers, and admissions override dashboard.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard title="Merit Approvals" value="2 Lists" sub="Awaiting validation" icon={Award} color="text-rose-600 bg-rose-50" />
                    <MetricCard title="Offers Pending" value={getKPIValue('admissions.kpi.verified', 15)} sub="Ready to dispatch" icon={FileText} color="text-blue-600 bg-blue-50" />
                    <MetricCard title="Funnel Conversion" value={getKPIValue('principal.kpi.conversions', '62%')} sub="Inquiry to Admission" icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
                    <MetricCard title="Total Admissions" value={getKPIValue('admissions.kpi.enrolled', 42)} sub="Academic year total" icon={CheckCircle} color="text-indigo-600 bg-indigo-50" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Pending Executive Approvals</h2>
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-solid border-gray-100 flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-gray-900">Grade 11 Science Merit List</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Completed by Exam Cell: 18 Candidates</p>
                            </div>
                            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                                Approve List
                            </button>
                        </div>
                        <div className="p-4 rounded-xl border border-solid border-gray-100 flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-gray-900">Admissions Offers Batch 2</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Pending dispatch to 8 approved applicants</p>
                            </div>
                            <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                                Trigger Offers
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // 7. FINANCE WORKSPACE
    // ----------------------------------------------------
    if (isFinance) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Finance Ledger Panel</h1>
                    <p className="text-sm text-gray-500 mt-1">Verify payment receipts, allocate scholarships, and reconcile admissions revenue.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MetricCard title="Payments Pending" value={getKPIValue('finance.kpi.ledger', 8) + " Transactions"} sub="Awaiting verification" icon={Clock} color="text-rose-600 bg-rose-50" />
                    <MetricCard title="Reconciled Today" value={DashboardMapper.formatRupee(Number(getKPIValue('finance.kpi.collected', 180000)))} sub="Verified collections" icon={CheckCircle} color="text-emerald-600 bg-emerald-50" />
                    <MetricCard title="Outstanding Fees" value={DashboardMapper.formatRupee(Number(getKPIValue('finance.kpi.pending', 210000)))} sub="Unpaid draft offers" icon={DollarSign} color="text-amber-600 bg-amber-50" />
                    <MetricCard title="Scholarships" value="4 Candidates" sub="Approved allocations" icon={Award} color="text-indigo-600 bg-indigo-50" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Payment Verification Queue</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 font-bold">
                                    <th className="pb-3">Applicant Name</th>
                                    <th className="pb-3">Mode</th>
                                    <th className="pb-3">Amount</th>
                                    <th className="pb-3">Transaction ID</th>
                                    <th className="pb-3 text-right">Reconciliation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(engineTasks && engineTasks.length > 0 ? engineTasks.map((t: any) => ({
                                    name: t.title,
                                    mode: t.description || 'NEFT Transfer',
                                    amount: '₹45,000',
                                    txnId: t.id
                                })) : [
                                    { name: 'Dev Sharma', mode: 'NEFT Transfer', amount: '₹45,000', txnId: 'TXN-90210' },
                                    { name: 'Gauri Gupta', mode: 'Credit Card', amount: '₹45,000', txnId: 'TXN-88290' }
                                ]).map((row: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-50 last:border-0 text-gray-700">
                                        <td className="py-3 font-bold">{row.name}</td>
                                        <td className="py-3">{row.mode}</td>
                                        <td className="py-3">{row.amount}</td>
                                        <td className="py-3">{row.txnId}</td>
                                        <td className="py-3 text-right">
                                            <button className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors">
                                                Verify Payment
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // FALLBACK DEFAULT ADMISSIONSFunnel (ADMIN overview)
    // ----------------------------------------------------
    const kpis = [
        { title: 'Total Inquiries', value: getKPIValue('reception.kpi.walkins', '142'), sub: 'CRM Inbound leads', icon: Users, color: 'bg-blue-100 text-blue-600' },
        { title: 'Total Applications', value: getKPIValue('admissions.kpi.total', stats?.total || '86'), sub: 'Parent submissions', icon: FileText, color: 'bg-purple-100 text-purple-600' },
        { title: 'Conversion Rate', value: getKPIValue('principal.kpi.conversions', '62%'), sub: 'Inquiry to Application', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
        { title: 'Fees Collected', value: DashboardMapper.formatRupee(Number(getKPIValue('finance.kpi.collected', 452000))), sub: 'Admission fees received', icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
    ];

    const chartData = [
        { name: 'Inquiry', count: Number(getKPIValue('reception.kpi.walkins', 142)) },
        { name: 'Application', count: Number(getKPIValue('admissions.kpi.total', stats?.total || 86)) },
        { name: 'Doc Verified', count: Number(getKPIValue('admissions.kpi.verified', 72)) },
        { name: 'Exam', count: 65 },
        { name: 'Interview', count: 58 },
        { name: 'Merit', count: 45 },
        { name: 'Offer', count: 40 },
        { name: 'Payment', count: 36 },
        { name: 'Enrolled', count: Number(getKPIValue('admissions.kpi.enrolled', 32)) },
    ];

    const quickActions = [
        { label: 'Create Inquiry', href: '/app/admissions/inquiries', icon: FilePlus, color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { label: 'New Application', href: '/app/admissions/new', icon: UserPlus, color: 'bg-purple-50 text-purple-600 border-purple-100' },
        { label: 'Document Review', href: '/app/admissions/review', icon: CheckSquare, color: 'bg-green-50 text-green-600 border-green-100' },
        { label: 'Schedule Exam', href: '/app/admissions/exams', icon: Calendar, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { label: 'Collect Fee', href: '/app/admissions/fees', icon: CreditCard, color: 'bg-amber-50 text-amber-600 border-amber-100' },
        { label: 'Enroll Handoff', href: '/app/admissions/enrollment', icon: Award, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Admission Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time indicators across the admission funnel.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((card, i) => (
                    <MetricCard key={i} {...card} />
                ))}
            </div>

            {/* Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Funnel Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Conversion Funnel</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 mb-4">Counselor Shortcuts</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((act, i) => {
                                const Icon = act.icon;
                                return (
                                    <a
                                        key={i}
                                        href={act.href}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-solid transition-all hover:-translate-y-0.5 hover:shadow-sm text-center ${act.color}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold text-gray-700">{act.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-primary">
                        <a href="/app/admissions/reports" className="flex items-center gap-1 hover:underline">
                            Executive Reports <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Active Stages Queue Details */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black text-gray-900">Active Workflow Queues</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {[
                        { label: 'Doc Reviews', count: '14 pending', color: 'border-l-indigo-400 bg-indigo-50/20' },
                        { label: 'Exam Marking', count: '7 pending', color: 'border-l-blue-400 bg-blue-50/20' },
                        { label: 'Interview Scores', count: '5 pending', color: 'border-l-purple-400 bg-purple-50/20' },
                        { label: 'Merit List Desk', count: 'Ready to generate', color: 'border-l-pink-400 bg-pink-50/20' },
                        { label: 'Fee Verification', count: '4 pending', color: 'border-l-amber-400 bg-amber-50/20' },
                        { label: 'Enroll Handoff', color: 'border-l-green-400 bg-green-50/20', count: '3 pending' },
                    ].map((stage, i) => (
                        <div key={i} className={`p-3.5 rounded-xl border-l-4 ${stage.color}`}>
                            <p className="text-[11px] font-black text-gray-900">{stage.label}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{stage.count}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
            <RoleDashboardInsights />
            <AdmissionsCrossModulePanel />
            <WorkQueue />
            <QuickActions />
            <HealthPanel />
        </div>
    );
}

export default DashboardPage;

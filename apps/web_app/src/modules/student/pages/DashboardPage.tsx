import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users, UserPlus, ArrowRightLeft, TrendingUp, GraduationCap, ShieldAlert, Home, Bus, FileWarning } from 'lucide-react';

export function DashboardPage() {
    const navigate = useNavigate();

    const kpis = [
        { title: 'Total Registered', value: '1,280', sub: 'Cumulative entries', icon: Users, color: 'bg-indigo-100 text-indigo-600' },
        { title: 'Active Students', value: '1,120', sub: 'Current enrollment', icon: GraduationCap, color: 'bg-green-100 text-green-600' },
        { title: 'Pending Promotions', value: '84', sub: 'Awaiting transition', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
        { title: 'Pending Transfers', value: '12', sub: 'TC requests active', icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-600' },
        { title: 'Missing Documents', value: '45', sub: 'Verification incomplete', icon: FileWarning, color: 'bg-amber-100 text-amber-600' },
        { title: 'Hostel Boarders', value: '310', sub: 'In-campus residents', icon: Home, color: 'bg-pink-100 text-pink-600' },
        { title: 'Transport Opted', value: '540', sub: 'Bus routing assigned', icon: Bus, color: 'bg-teal-100 text-teal-600' },
        { title: 'Suspended Roster', value: '3', sub: 'Behavioral warning', icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
    ];

    const distributions = [
        { title: 'Houses Allocation', items: [{ label: 'Red House', val: 280 }, { label: 'Blue House', val: 275 }, { label: 'Green House', val: 290 }, { label: 'Yellow House', val: 275 }] },
        { title: 'Categories Breakdown', items: [{ label: 'General', val: 840 }, { label: 'OBC', val: 240 }, { label: 'SC/ST', val: 120 }, { label: 'EWS', val: 80 }] },
        { title: 'Admission Quota Types', items: [{ label: 'Regular', val: 980 }, { label: 'RTE', val: 180 }, { label: 'Management', val: 60 }, { label: 'Scholarship', val: 60 }] },
    ];

    const quickActions = [
        { label: 'Register Student', action: () => navigate('/app/students/new'), color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
        { label: 'Allocate Grade/Section', action: () => navigate('/app/students/allocation'), color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
        { label: 'Promote Student', action: () => navigate('/app/students/promote'), color: 'bg-blue-600 hover:bg-blue-700 text-white' },
        { label: 'Transfer Desk', action: () => navigate('/app/students/transfer'), color: 'bg-purple-600 hover:bg-purple-700 text-white' },
        { label: 'Generate ID Cards', action: () => navigate('/app/students/identity'), color: 'bg-slate-800 hover:bg-slate-900 text-white' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Information System (SIS)</h1>
                    <p className="text-sm text-gray-500 mt-1">Review active student cohorts, demographics, and processing queues.</p>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Quick Actions Console</h3>
                <div className="flex flex-wrap gap-2.5">
                    {quickActions.map((act, i) => (
                        <button
                            key={i}
                            onClick={act.action}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${act.color}`}
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${kpi.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">{kpi.title}</span>
                                <h2 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h2>
                                <p className="text-[9px] text-gray-400 mt-0.5">{kpi.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Demographics distributions */}
            <div className="grid md:grid-cols-3 gap-6">
                {distributions.map((dist, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">{dist.title}</h3>
                        <div className="space-y-3">
                            {dist.items.map((item, idx) => {
                                const total = dist.items.reduce((acc, curr) => acc + curr.val, 0);
                                const percentage = Math.round((item.val / total) * 100);
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold text-gray-700">
                                            <span>{item.label}</span>
                                            <span>{item.val} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DashboardPage;

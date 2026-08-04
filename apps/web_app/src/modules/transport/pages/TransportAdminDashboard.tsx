
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { supabase } from '../../../lib/supabase';
import {
    Bus,
    Users,
    Activity,
    AlertOctagon,
    BarChart3,
    FileText,
    Settings,
    ArrowUpRight,
    Navigation,
    ShieldAlert,
    CheckCircle,
    AlertTriangle,
    History
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransportAdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [liveTripsCount, setLiveTripsCount] = useState(0);
    const [recentIncidents, setRecentIncidents] = useState<any[]>([]);

    // New Compliance Data State
    const [driverCompliance, setDriverCompliance] = useState<any[]>([]);
    const [vehicleCompliance, setVehicleCompliance] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOverview = async () => {
            try {
                // parallel fetch of legacy API + new Direct View queries
                const [liveRes, incRes, analyticsRes, driverRes, vehicleRes, auditRes] = await Promise.all([
                    apiClient.get('/transport/trips/live'),
                    apiClient.get('/transport/incidents/recent').catch(() => ({ data: [] })), // Allow fail
                    apiClient.get('/transport/analytics/punctuality').catch(() => ({ data: [] })),
                    // Direct Supabase View Queries (Read-Only)
                    supabase.from('view_transport_driver_compliance').select('*'),
                    supabase.from('view_transport_vehicle_compliance').select('*'),
                    supabase.from('view_transport_recent_changes').select('*').limit(5)
                ]);

                setLiveTripsCount(liveRes.data.filter((t: any) => t.status === 'LIVE').length);
                setRecentIncidents(incRes.data || []);

                if (driverRes.data) setDriverCompliance(driverRes.data);
                if (vehicleRes.data) setVehicleCompliance(vehicleRes.data);
                if (auditRes.data) setAuditLogs(auditRes.data);

                // Calculate some summary KPI
                const avgPunctuality = analyticsRes.data.length > 0
                    ? Math.round(analyticsRes.data.reduce((acc: any, curr: any) => acc + curr.on_time_percentage, 0) / analyticsRes.data.length)
                    : 0;

                setStats({
                    punctuality: avgPunctuality,
                    activeRoutes: analyticsRes.data.length
                });
            } catch (err) {
                console.error("Transport Overview Load Failed", err);
            } finally {
                setLoading(false);
            }
        };
        loadOverview();
    }, []);

    const navCards = [
        { label: 'Fleet & Setup', desc: 'Routes, Stops, Vehicles', icon: Settings, path: '/app/transport/setup', color: 'bg-blue-600' },
        { label: 'Student Ops', desc: 'Assignments & Rosters', icon: Users, path: '/app/transport/assign', color: 'bg-indigo-600' },
        { label: 'Live Monitor', desc: 'Track Trips in Real-time', icon: Activity, path: '/app/transport/monitor', color: 'bg-emerald-600' },
        { label: 'Incident Command', desc: 'Alerts & Safety Logs', icon: AlertOctagon, path: '/app/transport/incidents', color: 'bg-rose-600' },
        { label: 'Print Manifests', desc: 'Daily Student Sheets', icon: FileText, path: '/app/transport/manifests', color: 'bg-amber-600' },
        { label: 'Analytics', desc: 'Performance Insights', icon: BarChart3, path: '/app/transport/analytics', color: 'bg-cyan-600' },
    ];

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Operational Dashboard...</div>;

    // Computed Compliance Counts
    const expiredDrivers = driverCompliance.filter(d => d.compliance_status === 'EXPIRED').length;
    const expiringDrivers = driverCompliance.filter(d => d.compliance_status === 'EXPIRING_SOON').length;
    const expiredVehicles = vehicleCompliance.filter(d => d.compliance_status === 'EXPIRED').length;
    const expiringVehicles = vehicleCompliance.filter(d => d.compliance_status === 'EXPIRING_SOON').length;
    const totalIssues = expiredDrivers + expiringDrivers + expiredVehicles + expiringVehicles;

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mission Control</h1>
                    <p className="text-slate-500 font-medium mt-1">Institutional Transport Logistics & Safety HQ.</p>
                </div>
                <div className="flex gap-4">
                    {liveTripsCount > 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl flex items-center gap-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                            <div className="font-black text-emerald-700">{liveTripsCount} Trips Live</div>
                        </div>
                    )}
                    {totalIssues > 0 && (
                        <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div className="font-black text-red-700">{totalIssues} Compliance Issues</div>
                        </div>
                    )}
                </div>
            </div>

            {/* SAFETY CONTEXT BANNER */}
            {liveTripsCount > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="text-blue-600 w-5 h-5" />
                        <span className="text-blue-900 font-medium text-sm">
                            <strong>Active Fleet Operations:</strong> Configuration changes to Routes and Stops are currently restricted to prevent service disruption.
                        </span>
                    </div>
                </div>
            )}

            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Fleet Punctuality</div>
                    <div className="text-4xl font-black text-slate-900">{stats?.punctuality}%</div>
                    <div className="mt-2 text-xs font-bold text-emerald-500">Above Target</div>
                </div>

                {/* COMPLIANCE WIDGET */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 flex justify-between">
                        <span>Readiness</span>
                        <Link to="/app/transport/setup" className="hover:text-blue-600">VIEW</Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xxs text-slate-400 font-bold uppercase mb-1">Drivers</div>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-black ${expiredDrivers > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                    {driverCompliance.length - expiredDrivers}
                                </span>
                                <span className="text-xs text-slate-400 mb-1">/ {driverCompliance.length} OK</span>
                            </div>
                            {expiredDrivers > 0 && <div className="text-xxs font-bold text-red-500 mt-1">⚠️ {expiredDrivers} Expired</div>}
                        </div>
                        <div>
                            <div className="text-xxs text-slate-400 font-bold uppercase mb-1">Vehicles</div>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-black ${expiredVehicles > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                    {vehicleCompliance.length - expiredVehicles}
                                </span>
                                <span className="text-xs text-slate-400 mb-1">/ {vehicleCompliance.length} OK</span>
                            </div>
                            {expiredVehicles > 0 && <div className="text-xxs font-bold text-red-500 mt-1">⚠️ {expiredVehicles} Expired</div>}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${100 - (totalIssues / (driverCompliance.length + vehicleCompliance.length || 1) * 100)}%` }}></div>
                        <div className="bg-red-500 h-full flex-1"></div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">System Status</div>
                    <div className="text-2xl font-black flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-emerald-400" />
                        Operational
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-500">All GPS clusters communicating.</div>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {navCards.map((card, idx) => (
                    <Link
                        key={idx}
                        to={card.path}
                        className="group relative bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden"
                    >
                        <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{card.label}</h3>
                        <p className="text-slate-400 text-sm font-medium">{card.desc}</p>
                        <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-slate-900 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Lower Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* AUDIT LOG WIDGET (New) */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <History className="text-indigo-500 w-6 h-6" /> Recent Activity
                        </h3>
                        {/* <Link to="/app/transport/audit" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Full Log</Link> */}
                    </div>
                    <div className="space-y-0 divide-y divide-slate-50">
                        {auditLogs.length === 0 ? (
                            <div className="py-10 text-center text-slate-300 italic text-sm">No significant configuration changes recently.</div>
                        ) : (
                            auditLogs.map((log, i) => (
                                <div key={i} className="py-3 flex items-start gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.action === 'DELETE' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800">
                                            {log.action} {log.entity_type}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            by {log.changed_by_name || 'System'} • {new Date(log.changed_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Safety / Incidents Alert Widget */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <ShieldAlert className="text-rose-500 w-6 h-6" /> Security Queue
                        </h3>
                        <Link to="/app/transport/incidents" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Command Center</Link>
                    </div>
                    <div className="space-y-4">
                        {recentIncidents.length === 0 ? (
                            <div className="py-10 text-center text-slate-300 italic text-sm">No critical incidents logged in the last 24h.</div>
                        ) : (
                            recentIncidents.map((inc, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                    <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
                                    <div>
                                        <div className="font-bold text-rose-900">{inc.type}</div>
                                        <div className="text-xs text-rose-600">{inc.description}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

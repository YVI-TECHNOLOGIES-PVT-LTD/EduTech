import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    Users,
    TrendingUp,
    MapPin
} from 'lucide-react';

export const TransportAnalytics = () => {
    const [punctuality, setPunctuality] = useState<any[]>([]);
    const [delays, setDelays] = useState<any[]>([]);
    const [pickups, setPickups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, dRes, pkRes] = await Promise.all([
                    apiClient.get('/transport/analytics/punctuality'),
                    apiClient.get('/transport/analytics/delays'),
                    apiClient.get('/transport/analytics/pickups')
                ]);
                setPunctuality(pRes.data);
                setDelays(dRes.data);
                setPickups(pkRes.data);
            } catch (err) {
                console.error("Analytics Load Failed", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const overallPunctuality = punctuality.length > 0
        ? Math.round(punctuality.reduce((acc, curr) => acc + curr.on_time_percentage, 0) / punctuality.length)
        : 0;

    const totalMissed = pickups.reduce((acc, curr) => acc + curr.missed_pickups, 0);

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-10 h-10 text-blue-600" /> Operational Insights
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Data-driven transport performance and student reliability metrics.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-2xl font-black text-blue-600">{overallPunctuality}%</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg On-Time</div>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-amber-500">{totalMissed}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missed Pickups</div>
                    </div>
                </div>
            </div>

            {/* Grid 1: Reliability & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Punctuality Card */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Clock className="text-emerald-500" /> Route Punctuality
                        </h3>
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Global KPIs</span>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-4">
                            {punctuality.map((route, idx) => (
                                <div key={idx} className="group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <div className="font-bold text-slate-700">{route.route_name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{route.trip_type} TRIP</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-900">{route.on_time_percentage}%</div>
                                            <div className="text-[10px] text-slate-400 font-bold tracking-tight">{route.on_time_trips}/{route.total_trips} On Time</div>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${route.on_time_percentage > 90 ? 'bg-emerald-500' : route.on_time_percentage > 70 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                            style={{ width: `${route.on_time_percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Delay Hotspots */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-rose-500" /> Latency Hotspots
                        </h3>
                        <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Bottlenecks</span>
                    </div>
                    <div className="p-0 flex-1">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Name</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Delay</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Peak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {delays.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-slate-700">{d.route_name}</td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`inline-flex items-center gap-1.5 font-black ${Math.round(d.avg_delay_minutes) > 15 ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {Math.round(d.avg_delay_minutes)}m
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">
                                            {Math.round(d.max_delay_minutes)}m
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Grid 2: Exceptions & Student Lifecycle */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-500" /> Pickup Compliance
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Cross-referencing student assignments with actual boarding events.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex gap-2">
                            <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters: All Students</div>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Trips</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Boarded</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Missed / Absent</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Reliability</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {pickups.map((p, i) => {
                                const rate = Math.round((p.boarded_count / p.total_trips) * 100);
                                return (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-700">{p.student_name}</div>
                                        </td>
                                        <td className="px-8 py-5 text-center font-bold text-slate-400">{p.total_trips}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black tracking-tight">{p.boarded_count}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={p.missed_pickups > 0 ? "bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black tracking-tight" : "text-slate-300"}>
                                                {p.missed_pickups}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="text-xs font-black text-slate-800">{rate}%</div>
                                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${rate > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    History,
    Filter,
    ChevronDown,
    ChevronUp,
    Search,
    User,
    Calendar,
    ArrowLeft,
    Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransportAuditLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filters
    const [entityType, setEntityType] = useState<string>('ALL');
    const [daysRange, setDaysRange] = useState<number>(30); // Default last 30 days
    const [actionType, setActionType] = useState<string>('ALL');

    useEffect(() => {
        fetchLogs();
    }, [entityType, daysRange, actionType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // We use the view for the main table info (it already does the joins for user names)
            // But the view might NOT have the old_data/new_data JSON columns if I didn't add them.
            // Let's check 037_transport_dashboards_phase6.sql. 
            // The view 'view_transport_recent_changes' selects specific columns.
            // It does NOT select old_data/new_data. 
            // So we must query the base table 'transport_audit_logs' but join users manually?
            // OR query the base table directly. It has 'changed_by' UUID.
            // The request says "Primary: transport_audit_logs (via Supabase client)".
            // Let's query the base table to get the JSON data.
            // We can fetch user details in a second pass or just show the UUID if names are hard.
            // Better: Query the view for the list, then query the base table for details?
            // Actually, querying the base table and left joining users is hard with Supabase simple client.
            // Let's stick effectively to the base table request but maybe we can just get the raw JSON.

            let query = supabase
                .from('transport_audit_logs')
                .select(`
                    *,
                    users:changed_by (full_name, email)
                `)
                .order('changed_at', { ascending: false })
                .gt('changed_at', new Date(Date.now() - daysRange * 24 * 60 * 60 * 1000).toISOString());

            if (entityType !== 'ALL') {
                query = query.eq('entity_type', entityType);
            }
            if (actionType !== 'ALL') {
                query = query.eq('action', actionType);
            }

            const { data, error } = await query.limit(100); // Limit 100 for perf

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Audit Log Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        if (expandedRow === id) setExpandedRow(null);
        else setExpandedRow(id);
    };

    const formatDiff = (oldD: any, newD: any) => {
        // Simple comparison visualization
        if (!oldD && !newD) return <span className="text-gray-400 italic">No data captured</span>;

        return (
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-red-50 p-3 rounded border border-red-100 overflow-auto max-h-60">
                    <div className="font-bold text-red-700 mb-2 border-b border-red-200 pb-1 sticky top-0 bg-red-50">BEFORE</div>
                    <pre className="whitespace-pre-wrap text-red-900">{JSON.stringify(oldD, null, 2) || 'null'}</pre>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-100 overflow-auto max-h-60">
                    <div className="font-bold text-green-700 mb-2 border-b border-green-200 pb-1 sticky top-0 bg-green-50">AFTER</div>
                    <pre className="whitespace-pre-wrap text-green-900">{JSON.stringify(newD, null, 2) || 'null'}</pre>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/app/transport/admin" className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="w-8 h-8 text-indigo-600" /> Audit Log
                    </h1>
                    <p className="text-slate-500 font-medium">Traceability & Configuration History</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase mr-2">
                    <Filter className="w-4 h-4" /> Filters:
                </div>

                <select
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                >
                    <option value="ALL">All Entities</option>
                    <option value="ROUTE">Routes</option>
                    <option value="STOP">Stops</option>
                    <option value="VEHICLE">Vehicles</option>
                    <option value="DRIVER">Drivers</option>
                </select>

                <select
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                >
                    <option value="ALL">All Actions</option>
                    <option value="INSERT">Created (Insert)</option>
                    <option value="UPDATE">Modified (Update)</option>
                    <option value="DELETE">Removed (Delete)</option>
                </select>

                <select
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
                    value={daysRange}
                    onChange={(e) => setDaysRange(Number(e.target.value))}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>

                <div className="ml-auto text-xs text-gray-400 font-medium">
                    Showing latest 100 records
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                        <Database className="w-8 h-8 mb-2 animate-bounce" />
                        Loading history...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                            <History className="w-8 h-8 text-gray-300" />
                        </div>
                        No audit records found for this filter.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                                <th className="p-4 pl-6">Entity</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Changed By</th>
                                <th className="p-4 text-right pr-6">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log) => (
                                <>
                                    <tr
                                        key={log.id}
                                        onClick={() => toggleRow(log.id)}
                                        className={`cursor-pointer hover:bg-indigo-50/30 transition-colors group ${expandedRow === log.id ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="font-bold text-slate-700">{log.entity_type}</div>
                                            <div className="text-xs text-gray-400 font-mono truncate max-w-[150px]" title={log.entity_id}>
                                                {log.entity_id}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                                                    log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {(log.users?.full_name || 'U').charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-slate-600">
                                                    {log.users?.full_name || 'System / Unknown'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="text-sm font-bold text-slate-700">
                                                {new Date(log.changed_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(log.changed_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expanded Detail Row */}
                                    {expandedRow === log.id && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={4} className="p-4 pl-6 pr-6">
                                                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-inner">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                        <Database className="w-4 h-4" /> Record Diff
                                                    </h4>
                                                    {formatDiff(log.old_data, log.new_data)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

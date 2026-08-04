import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    History,
    ChevronLeft,
    Power,
    Lock,
    Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AcademicYearManagement = () => {
    const [years, setYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchYears = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/academic-years');
            setYears(res.data);
        } catch (err) {
            console.error("Failed to fetch years:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleActivate = async (yearId: string) => {
        if (!confirm("Are you sure? This will CLOSE the current active year and make this one ACTIVE. This cannot be undone easily.")) return;

        setActionLoading(yearId);
        try {
            await apiClient.post('/admin/academic-years/activate', { academic_year_id: yearId });
            fetchYears();
        } catch (err: any) {
            alert(err.response?.data?.error || "Activation failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleClose = async (yearId: string) => {
        if (!confirm("Closing an academic year will make all its data READ-ONLY. Are you sure?")) return;

        setActionLoading(yearId);
        try {
            await apiClient.post('/admin/academic-years/close', { academic_year_id: yearId });
            fetchYears();
        } catch (err: any) {
            alert(err.response?.data?.error || "Closing failed");
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
            case 'CLOSED': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'DRAFT': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Calendar className="w-10 h-10 text-indigo-600" />
                        Academic Year Governance
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Control the lifecycle of school academic sessions.</p>
                </div>
                <Link to="/app/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-bold transition-all">
                    <ChevronLeft className="w-5 h-5" />
                    Dashboard
                </Link>
            </header>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                <div className="space-y-1">
                    <h4 className="font-black text-amber-900">Governance Warning</h4>
                    <p className="text-sm text-amber-700 font-medium leading-relaxed">
                        Transitioning academic years affects all modules including Exams, Fees, and Attendance.
                        <strong> CLOSED</strong> years are strictly read-only to preserve historical integrity.
                        Ensure all ongoing exams are completed before closing a year.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Year Label</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400 font-bold">Loading Academic Years...</td></tr>
                        ) : years.length === 0 ? (
                            <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-400 font-bold">No years found.</td></tr>
                        ) : years.map(year => (
                            <tr key={year.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6 font-black text-gray-900 text-lg">
                                    {year.year_label}
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full border text-xs font-black tracking-widest ${getStatusStyles(year.status)}`}>
                                        {year.status || (year.is_active ? 'ACTIVE' : 'DRAFT')}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {year.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleActivate(year.id)}
                                                disabled={actionLoading === year.id}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                                            >
                                                <Power className="w-4 h-4" />
                                                Activate
                                            </button>
                                        )}
                                        {year.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleClose(year.id)}
                                                disabled={actionLoading === year.id}
                                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
                                            >
                                                <Lock className="w-4 h-4" />
                                                Close Year
                                            </button>
                                        )}
                                        {year.status === 'CLOSED' && (
                                            <span className="flex items-center gap-2 text-gray-400 font-bold px-4 py-2 bg-gray-50 rounded-lg">
                                                <History className="w-4 h-4" />
                                                Archived
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Draft Status</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Upcoming sessions. Use this phase for building Classes, Sections, and promoting students ahead of time.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Active Status</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Only ONE year can be active. This is the year used for daily Attendance, Fees, and Exam scheduling.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Closed Status</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Immutable historical data. Data can be viewed for reports but no modifications are permitted.
                    </p>
                </div>
            </div>
        </div>
    );
};

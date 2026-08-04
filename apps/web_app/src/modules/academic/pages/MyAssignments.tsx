import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Clock,
    Calendar,
    Book,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';

export const MyAssignments = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingTasks, setFetchingTasks] = useState(false);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await apiClient.get('/students/my/children');
                setChildren(res.data);
                if (res.data.length > 0) {
                    setSelectedChildId(res.data[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChildId) {
            const fetchAssignments = async () => {
                setFetchingTasks(true);
                try {
                    const res = await apiClient.get(`/academic/assignments/student/${selectedChildId}`);
                    setAssignments(res.data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setFetchingTasks(false);
                }
            };
            fetchAssignments();
        }
    }, [selectedChildId]);

    if (loading) return <div className="p-10 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Book className="w-10 h-10 text-indigo-600" />
                        My Assignments
                    </h1>
                    <p className="text-gray-500 mt-1">Track your child's daily class work and homework progress.</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-400 capitalize">Viewing for:</span>
                    <select
                        className="bg-white border border-gray-200 px-4 py-2 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        value={selectedChildId}
                        onChange={e => setSelectedChildId(e.target.value)}
                    >
                        {children.map(child => (
                            <option key={child.id} value={child.id}>{child.full_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics / Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold opacity-80">Total Tasks</h3>
                            <div className="text-5xl font-black mt-2">{assignments.length}</div>
                            <div className="mt-6 flex items-center gap-4">
                                <div>
                                    <div className="text-xs font-bold opacity-60">Pending</div>
                                    <div className="text-xl font-bold">{assignments.filter(a => new Date(a.due_date) > new Date()).length}</div>
                                </div>
                                <div className="w-px h-8 bg-white/20"></div>
                                <div>
                                    <div className="text-xs font-bold opacity-60">Due Soon</div>
                                    <div className="text-xl font-bold text-amber-300">
                                        {assignments.filter(a => {
                                            const diff = new Date(a.due_date).getTime() - new Date().getTime();
                                            return diff > 0 && diff < 86400000 * 2; // Next 2 days
                                        }).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Search className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Upcoming Deadlines</h4>
                        <div className="space-y-3">
                            {assignments.slice(0, 3).map(a => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 truncate">{a.title}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{new Date(a.due_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Assignment List */}
                <div className="lg:col-span-2 space-y-4">
                    {fetchingTasks ? (
                        <div className="p-20 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
                    ) : assignments.length === 0 ? (
                        <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center">
                            <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6 text-gray-300">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">No active assignments found for the selected child.</p>
                        </div>
                    ) : (
                        assignments.map(app => {
                            const isOverdue = new Date(app.due_date) < new Date();
                            return (
                                <div key={app.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                    {app.subject?.name}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Teacher: {app.teacher?.full_name}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900">{app.title}</h3>
                                            <p className="text-sm text-gray-500 font-medium line-clamp-2 mt-2">{app.description}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1 ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                                                {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-3 h-3" />}
                                                {isOverdue ? 'Overdue' : 'Due'}: {new Date(app.due_date).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400">
                                                Sent: {new Date(app.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-50 rounded-lg px-3 py-1 text-xs font-bold text-gray-500">
                                                {app.max_marks} Marks
                                            </div>
                                        </div>
                                        <button className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                            View Instructions
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

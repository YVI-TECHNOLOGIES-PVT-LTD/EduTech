import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { PenTool, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface FacultyTimeline {
    examName: string;
    examStatus: string;
    events: {
        id: string;
        title: string;
        description: string;
        status: 'PENDING' | 'READY' | 'DONE' | 'BLOCKED';
        data?: any;
    }[];
}

export const FacultyExamTimeline: React.FC = () => {
    const [projection, setProjection] = useState<FacultyTimeline | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const res = await apiClient.get('/exams/dashboard/faculty/exam-timeline');
                setProjection(res.data);
            } catch (err) {
                console.error('Failed to fetch faculty timeline:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, []);

    if (loading) return <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>;

    if (!projection) return (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-500 italic">No pending examination tasks.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 p-4 flex items-center justify-between">
                <div>
                    <p className="text-indigo-100 text-[10px] uppercase font-black tracking-widest leading-none mb-1">Active Exam</p>
                    <h3 className="text-white font-bold text-lg">{projection.examName}</h3>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase">
                    {projection.examStatus}
                </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
                {projection.events.map(event => (
                    <div key={event.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-colors">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${event.status === 'DONE' ? 'bg-green-100 text-green-600' :
                                event.status === 'READY' ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-100 text-gray-400'
                            }`}>
                            {event.id === 'marks_entry' ? <PenTool className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                                <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                                {event.status === 'READY' && <span className="text-orange-600 animate-pulse"><AlertCircle className="w-4 h-4" /></span>}
                            </div>
                            <p className="text-gray-500 text-xs truncate">{event.description}</p>

                            {/* Entry Progress Bar */}
                            {event.id === 'marks_entry' && event.data && (
                                <div className="mt-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5">
                                        <span>Subject Locks</span>
                                        <span className="text-gray-700">{event.data.lockedCount} / {event.data.totalCount}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${event.data.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="h-8 w-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 p-3 text-center">
                <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                    Go to Exam Management
                </button>
            </div>
        </div>
    );
};

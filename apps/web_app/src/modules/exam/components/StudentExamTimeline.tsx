import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { CheckCircle2, Clock, AlertCircle, Lock, Download, Calendar, Ticket, GraduationCap } from 'lucide-react';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'READY' | 'DONE' | 'BLOCKED';
    date?: string;
    data?: any;
}

export const StudentExamTimeline: React.FC<{ studentId: string }> = ({ studentId }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const res = await apiClient.get('/exams/dashboard/student/exam-timeline', {
                    params: { studentId }
                });
                setEvents(res.data);
            } catch (err) {
                console.error('Failed to fetch student timeline:', err);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) fetchTimeline();
    }, [studentId]);

    if (loading) return <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;

    if (events.length === 0) return (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No active examinations found for your class.</p>
        </div>
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'DONE': return { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600', ring: 'ring-green-500/20' };
            case 'READY': return { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-600', ring: 'ring-indigo-500/20' };
            case 'PENDING': return { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600', ring: 'ring-amber-500/20' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-400', icon: 'text-gray-300', ring: 'ring-gray-200' };
        }
    };

    const getIcon = (eventId: string, status: string) => {
        if (status === 'DONE') return <CheckCircle2 className="w-5 h-5" />;
        if (status === 'BLOCKED') return <Lock className="w-5 h-5" />;

        switch (eventId) {
            case 'exam_scheduled': return <Calendar className="w-5 h-5" />;
            case 'timetable': return <Clock className="w-5 h-5" />;
            case 'eligibility': return <AlertCircle className="w-5 h-5" />;
            case 'seating': return <Calendar className="w-5 h-5" />;
            case 'hall_ticket': return <Ticket className="w-5 h-5" />;
            case 'results': return <GraduationCap className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-gray-100 before:to-transparent">
            {events.map((event, idx) => {
                const styles = getStatusStyles(event.status);
                return (
                    <div key={event.id} className="relative pl-12 group">
                        {/* Dot */}
                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ring-8 ${styles.bg} ${styles.icon} ${styles.ring} transition-all duration-300 group-hover:scale-110`}>
                            {getIcon(event.id, event.status)}
                        </div>

                        {/* Content */}
                        <div className={`p-5 rounded-2xl border transition-all duration-300 ${event.status === 'BLOCKED' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold text-lg ${styles.text}`}>{event.title}</h4>
                                {event.status === 'DONE' && <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Completed</span>}
                                {event.status === 'READY' && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">Action Required</span>}
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">{event.description}</p>

                            {/* Dynamic Data Blocks */}
                            {event.id === 'eligibility' && event.data && (
                                <div className="mt-4 flex gap-4">
                                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Attendance</p>
                                        <p className={`font-bold ${event.data.attendance >= 75 ? 'text-green-600' : 'text-red-500'}`}>{event.data.attendance}%</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Fee Status</p>
                                        <p className={`font-bold ${event.data.fees_status === 'CLEARED' ? 'text-green-600' : 'text-amber-500'}`}>{event.data.fees_status}</p>
                                    </div>
                                </div>
                            )}

                            {event.id === 'seating' && event.data && (
                                <div className="mt-4 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-tight">{event.data.hall.hall_name}</p>
                                        <p className="text-xl font-black text-indigo-900">Seat #{event.data.seat_number}</p>
                                    </div>
                                </div>
                            )}

                            {event.id === 'results' && event.status === 'DONE' && (
                                <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200">
                                    <Download className="w-4 h-4" /> View Result Summary
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

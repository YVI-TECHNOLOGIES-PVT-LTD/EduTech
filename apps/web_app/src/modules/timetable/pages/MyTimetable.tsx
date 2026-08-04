import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Clock,
    Calendar as CalendarIcon,
    BookOpen,
    MapPin,
    User,
    ArrowLeft,
    Download,
    LayoutGrid,
    ChevronRight,
    Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const MyTimetable = () => {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7); // Default to today, 7 if Sunday

    const days = [
        { id: 1, name: 'Monday', short: 'Mon' },
        { id: 2, name: 'Tuesday', short: 'Tue' },
        { id: 3, name: 'Wednesday', short: 'Wed' },
        { id: 4, name: 'Thursday', short: 'Thu' },
        { id: 5, name: 'Friday', short: 'Fri' },
        { id: 6, name: 'Saturday', short: 'Sat' },
        { id: 7, name: 'Sunday', short: 'Sun' }
    ];

    useEffect(() => {
        apiClient.get('/timetable/my')
            .then(res => setSlots(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const daySlots = slots.filter(s => s.day_of_week === selectedDay);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <Link to="/app/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <CalendarIcon className="w-10 h-10 text-indigo-600" />
                        My Weekly Timetable
                    </h1>
                    <p className="text-gray-500 font-medium">Your customized academic schedule and teaching hours.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-black transition-all shadow-sm border border-gray-100 hover:bg-gray-50">
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Day Selector */}
            <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl flex flex-wrap gap-2 overflow-hidden">
                {days.map((day) => (
                    <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`flex-1 min-w-[100px] py-4 rounded-[1.5rem] transition-all relative group ${selectedDay === day.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${selectedDay === day.id ? 'text-indigo-200' : 'text-gray-300'
                            }`}>
                            {day.short}
                        </div>
                        <div className="font-bold">{day.name}</div>
                        {selectedDay === day.id && (
                            <motion.div
                                layoutId="activeDay"
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Schedule Column */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Today's Sessions</h3>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            {daySlots.length} Classes
                        </span>
                    </div>

                    <div className="space-y-4">
                        {daySlots.length === 0 ? (
                            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center shadow-sm">
                                <div className="inline-flex p-8 bg-gray-50 rounded-[2rem] mb-6 text-gray-200">
                                    <Star className="w-16 h-16" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">No Classes Scheduled</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">It looks like there are no academic sessions for this day. Use this time for planning or rest!</p>
                            </div>
                        ) : (
                            daySlots.map((slot, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={slot.id}
                                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group flex gap-8 items-center"
                                >
                                    <div className="flex flex-col items-center justify-center min-w-[100px] py-4 bg-gray-50 rounded-3xl group-hover:bg-indigo-50 transition-colors">
                                        <div className="text-2xl font-black text-gray-900 group-hover:text-indigo-600">
                                            {slot.start_time.slice(0, 5)}
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            TO {slot.end_time.slice(0, 5)}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                {slot.section?.class?.name}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                ID: {slot.id.substring(0, 8)}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {slot.subject?.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-gray-300" />
                                                Section {slot.section?.name}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-4 h-4 text-gray-300" />
                                                {slot.faculty?.full_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <button className="p-4 bg-gray-50 rounded-2xl text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Info & Stats */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black mb-2">Weekly Load</h4>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">You are currently handling <span className="text-indigo-400 font-black">{slots.length} academic sessions</span> per week across 3 different divisions.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[65%]" />
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <span>Workload</span>
                                    <span>65% Capacity</span>
                                </div>
                            </div>
                        </div>
                        <LayoutGrid className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.03]" />
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-[3rem] space-y-6 border border-indigo-100">
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Upcoming Break</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-indigo-600 text-xl italic">
                                45
                            </div>
                            <div className="space-y-0.5">
                                <div className="font-black text-gray-900">Lunch Interval</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Minutes remaining</div>
                            </div>
                        </div>
                        <p className="text-xs text-indigo-900/60 font-medium leading-relaxed">Lunch starts after your second session on Monday, Wednesday and Friday.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import {
    FileText,
    UserCheck,
    BookOpen,
    CreditCard,
    Clock,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, any> = {
    FileText,
    UserCheck,
    BookOpen,
    CreditCard,
    MessageSquare
};

import { useDashboard } from '../modules/dashboard/hooks/useDashboard';

export const ActivityTimeline = () => {
    const { activities, loading } = useDashboard();

    const events = activities.map(act => {
        let color = 'indigo';
        let icon = 'Clock';
        
        const titleL = act.title.toLowerCase();
        if (titleL.includes('admission') || titleL.includes('applied') || titleL.includes('enrol')) {
            color = 'emerald';
            icon = 'UserCheck';
        } else if (titleL.includes('pay') || titleL.includes('fee') || titleL.includes('ledger')) {
            color = 'amber';
            icon = 'CreditCard';
        } else if (titleL.includes('exam') || titleL.includes('grade') || titleL.includes('score')) {
            color = 'indigo';
            icon = 'BookOpen';
        } else if (titleL.includes('message') || titleL.includes('notice') || titleL.includes('announc')) {
            color = 'rose';
            icon = 'MessageSquare';
        }
        
        return {
            id: act.id,
            title: act.title,
            description: act.description,
            time: act.timestamp,
            icon,
            color
        };
    });

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (events.length === 0) return (
        <div className="text-center py-10">
            <Clock className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-400 font-bold italic">No recent activities found.</p>
        </div>
    );

    return (
        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
            <AnimatePresence>
                {events.map((event, idx) => {
                    const Icon = ICON_MAP[event.icon] || Clock;
                    const colorClasses: Record<string, string> = {
                        amber: 'text-amber-600 bg-amber-50 border-amber-100',
                        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
                        rose: 'text-rose-600 bg-rose-50 border-rose-100'
                    };
                    const color = colorClasses[event.color] || colorClasses.indigo;

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={event.id + idx}
                            className="flex gap-6 relative group"
                        >
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center relative z-10 transition-all group-hover:scale-110 ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                        {event.title}
                                    </h4>
                                    <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap pt-1">
                                        {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed mt-0.5">
                                    {event.description}
                                </p>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {new Date(event.time).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-300 hover:text-indigo-600 transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

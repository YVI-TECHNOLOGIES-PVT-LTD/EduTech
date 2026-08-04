import React from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '../../utils/date';

export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: Date | string;
    actor?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

interface AuditTimelineProps {
    events: TimelineEvent[];
    loading?: boolean;
}

export const AuditTimeline = ({ events, loading = false }: AuditTimelineProps) => {
    if (loading) {
        return <div className="text-xs text-gray-500 py-4">Fetching audit timeline logs...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-6 text-xs text-gray-400">
                No activity logs available on this timeline.
            </div>
        );
    }

    return (
        <div className="relative border-l border-gray-100 pl-6 ml-3 space-y-6 text-left">
            {events.map((event) => {
                const badgeColor =
                    event.type === 'success'
                        ? 'bg-green-500'
                        : event.type === 'warning'
                        ? 'bg-amber-500'
                        : event.type === 'error'
                        ? 'bg-red-500'
                        : 'bg-primary';

                return (
                    <div key={event.id} className="relative group animate-in fade-in slide-in-from-left-2 duration-300">
                        {/* Timeline dot */}
                        <span className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${badgeColor}`} />

                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors">
                                    {event.title}
                                </h4>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold select-none">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(event.timestamp, 'dd MMM yyyy, hh:mm a')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {event.description}
                            </p>
                            {event.actor && (
                                <span className="inline-flex items-center gap-1.5 mt-2 bg-gray-50 text-gray-500 text-[10px] px-2 py-0.5 rounded-md font-semibold select-none border border-gray-100">
                                    Actor: {event.actor}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
export default AuditTimeline;

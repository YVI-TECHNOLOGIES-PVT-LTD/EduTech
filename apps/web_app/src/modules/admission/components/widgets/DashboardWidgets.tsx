import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface WidgetItem {
    id: string;
    title: string;
    description: string;
    status: 'urgent' | 'pending' | 'completed';
    time: string;
}

interface ActionQueueWidgetProps {
    items: WidgetItem[];
    onItemClick?: (id: string) => void;
}

export function ActionQueueWidget({ items, onItemClick }: ActionQueueWidgetProps) {
    const statusColors = {
        urgent: 'text-rose-500 bg-rose-50 border-rose-100',
        pending: 'text-amber-500 bg-amber-50 border-amber-100',
        completed: 'text-emerald-500 bg-emerald-50 border-emerald-100'
    };

    const StatusIcon = {
        urgent: AlertCircle,
        pending: Clock,
        completed: CheckCircle2
    };

    return (
        <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Today's Priority Queue
                </h4>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    {items.filter(i => i.status !== 'completed').length} Tasks
                </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-border/10">
                {items.map(item => {
                    const Icon = StatusIcon[item.status];
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => onItemClick && onItemClick(item.id)}
                            className="py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-muted/10 px-2 rounded-xl transition-all"
                        >
                            <div className="flex gap-3">
                                <span className={`p-2 rounded-lg border shrink-0 ${statusColors[item.status]}`}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <div>
                                    <h5 className="text-xs font-black text-gray-900 dark:text-gray-100">{item.title}</h5>
                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-[10px] text-gray-400 font-bold block">{item.time}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto mt-1" />
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs font-medium">
                        No actions in queue. Good job!
                    </div>
                )}
            </div>
        </div>
    );
}

interface RecentActivityWidgetProps {
    activities: { title: string; operator: string; time: string }[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
    return (
        <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Recent Operations Feed
            </h4>

            <div className="space-y-4 text-xs">
                {activities.map((act, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        <div className="space-y-0.5">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{act.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">
                                By {act.operator} • {act.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

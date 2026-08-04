import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';
import { QueuePriorityBadge } from './QueuePriorityBadge';
import { DashboardTask } from '../../types/dashboard.types';

interface WorkQueueCardProps {
    task: DashboardTask;
}

export const WorkQueueCard: React.FC<WorkQueueCardProps> = ({ task }) => {
    const getSLAStyle = (dueDateStr?: string) => {
        if (!dueDateStr) return { border: 'border-l-emerald-500 bg-emerald-50/10', label: 'On Track', badge: 'bg-emerald-500' };
        const now = new Date();
        const due = new Date(dueDateStr);
        const diffMs = due.getTime() - now.getTime();
        
        if (diffMs < 0) {
            return { border: 'border-l-rose-500 bg-rose-50/10', label: 'Overdue', badge: 'bg-rose-500' };
        }
        const diffHrs = diffMs / (1000 * 60 * 60);
        if (diffHrs < 6) {
            return { border: 'border-l-orange-500 bg-orange-50/10', label: 'Urgent (<6h)', badge: 'bg-orange-500' };
        }
        if (diffHrs < 24) {
            return { border: 'border-l-amber-500 bg-amber-50/10', label: 'Warning (<24h)', badge: 'bg-amber-500' };
        }
        return { border: 'border-l-emerald-500 bg-emerald-50/10', label: 'On Track', badge: 'bg-emerald-500' };
    };

    const sla = getSLAStyle(task.dueDate);
    const linkTarget = task.entityId ? `/app/admissions/review` : undefined; // fallback target

    return (
        <div className={`p-4 bg-white dark:bg-card border border-border/40 rounded-2xl border-l-4 shadow-premium-sm transition-all duration-300 hover:shadow-premium-md hover:border-l-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${sla.border}`}>
            <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                        {task.entityType || 'SYSTEM'}
                    </span>
                    <QueuePriorityBadge priority={task.priority} />
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full ${sla.badge}`}></span>
                        {sla.label}
                    </span>
                </div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                    {task.title}
                </h4>
                {task.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed truncate">
                        {task.description}
                    </p>
                )}
                <div className="flex flex-wrap gap-4 items-center text-[10px] text-muted-foreground pt-1">
                    {task.dueDate && (
                        <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    )}
                    {task.assignedTo && (
                        <span className="flex items-center gap-1 font-semibold">
                            <User className="w-3.5 h-3.5" />
                            {task.assignedTo}
                        </span>
                    )}
                </div>
            </div>
            {linkTarget ? (
                <Link
                    to={linkTarget}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 self-end sm:self-center shrink-0 shadow-premium-sm"
                >
                    <span>Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            ) : (
                <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-black flex items-center justify-center gap-1.5 self-end sm:self-center shrink-0"
                >
                    <span>Task Active</span>
                </button>
            )}
        </div>
    );
};

export default WorkQueueCard;

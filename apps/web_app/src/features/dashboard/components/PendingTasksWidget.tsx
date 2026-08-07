import React from 'react';
import { Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PendingTask {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PendingTasksWidgetProps {
  tasks?: PendingTask[];
}

export const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ tasks }) => {
  const defaultTasks: PendingTask[] = [
    {
      id: 'task-1',
      title: 'Verify Documents for Application #APP-2026-042',
      type: 'DOCUMENT_VERIFICATION',
      dueDate: 'Today, 5:00 PM',
      priority: 'HIGH',
    },
    {
      id: 'task-2',
      title: 'Record Assessment Marks for Grade 10 Applicant',
      type: 'ASSESSMENT',
      dueDate: 'Tomorrow',
      priority: 'MEDIUM',
    },
    {
      id: 'task-3',
      title: 'Collect Admission Fee for Application #APP-2026-039',
      type: 'FEE_PAYMENT',
      dueDate: 'Aug 10',
      priority: 'HIGH',
    },
  ];

  const taskList = tasks && tasks.length > 0 ? tasks : defaultTasks;

  const priorityStyles = {
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
    LOW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400',
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Tasks</h3>
          <p className="text-xs text-slate-500">Action items requiring administrative review</p>
        </div>
        <Clock className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {taskList.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                    priorityStyles[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {task.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Due: {task.dueDate}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-blue-600"
            >
              <ArrowUpRight size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

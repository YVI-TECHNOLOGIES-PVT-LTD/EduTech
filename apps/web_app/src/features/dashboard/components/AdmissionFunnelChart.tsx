import React from 'react';
import { Filter } from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

interface AdmissionFunnelChartProps {
  funnel?: { stage: string; count: number }[];
}

export const AdmissionFunnelChart: React.FC<AdmissionFunnelChartProps> = ({ funnel }) => {
  const defaultStages: FunnelStage[] = [
    { stage: 'Lead Creation', count: 150, color: 'bg-blue-600' },
    { stage: 'Counselling', count: 120, color: 'bg-blue-500' },
    { stage: 'Campus Visit', count: 95, color: 'bg-indigo-500' },
    { stage: 'Application', count: 75, color: 'bg-indigo-600' },
    { stage: 'Docs Verified', count: 62, color: 'bg-purple-600' },
    { stage: 'Assessment', count: 50, color: 'bg-amber-600' },
    { stage: 'Approved', count: 42, color: 'bg-emerald-500' },
    { stage: 'Fee Paid', count: 36, color: 'bg-emerald-600' },
    { stage: 'Enrolled (Stage-1 Final)', count: 32, color: 'bg-emerald-700' },
  ];

  const stages =
    funnel && funnel.length > 0
      ? funnel.map((item, idx) => ({
          stage: item.stage,
          count: item.count,
          color: defaultStages[idx]?.color || 'bg-blue-600',
        }))
      : defaultStages;

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Stage-1 Admission Conversion Funnel
          </h3>
          <p className="text-xs text-slate-500">
            End-to-end conversion progression from Lead to Final Enrollment
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <Filter size={18} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {stages.map((item) => {
          const widthPercent = Math.max(Math.round((item.count / maxCount) * 100), 8);

          return (
            <div key={item.stage} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">{item.stage}</span>
                <span className="text-slate-500 font-bold">{item.count}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

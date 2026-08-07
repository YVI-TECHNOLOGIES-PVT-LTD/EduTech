import React from 'react';
import { Activity, UserCheck, FileText, CreditCard, Target } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
}

interface RecentActivitiesFeedProps {
  activities?: ActivityItem[];
}

export const RecentActivitiesFeed: React.FC<RecentActivitiesFeedProps> = ({ activities }) => {
  const defaultActivities: ActivityItem[] = [
    {
      id: 'act-1',
      action: 'STUDENT_ENROLLED',
      description: 'Completed Stage-1 Enrollment for Student Rahul Sharma (Grade 9-A)',
      user: 'Admin Officer',
      timestamp: '10 mins ago',
    },
    {
      id: 'act-2',
      action: 'FEE_RECEIVED',
      description: 'Collected Admission Fee ₹25,000 for Application #APP-2026-088',
      user: 'Finance Officer',
      timestamp: '45 mins ago',
    },
    {
      id: 'act-3',
      action: 'DECISION_APPROVED',
      description: 'Approved Admission Decision for Applicant Priya Singh',
      user: 'Academic Head',
      timestamp: '2 hours ago',
    },
    {
      id: 'act-4',
      action: 'LEAD_CREATED',
      description: 'Captured new lead inquiry via website contact form',
      user: 'System Bot',
      timestamp: '3 hours ago',
    },
  ];

  const items = activities && activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recent System Activity
          </h3>
          <p className="text-xs text-slate-500">Live Stage-1 audit log feed</p>
        </div>
        <Activity className="h-5 w-5 text-slate-400" />
      </div>

      <div className="relative border-l border-slate-200 ml-3 space-y-6 dark:border-slate-800">
        {items.map((item) => (
          <div key={item.id} className="relative pl-6">
            <span className="absolute -left-2 top-0.5 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {item.description}
              </span>
              <span className="text-[10px] text-slate-400">{item.timestamp}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">By {item.user}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

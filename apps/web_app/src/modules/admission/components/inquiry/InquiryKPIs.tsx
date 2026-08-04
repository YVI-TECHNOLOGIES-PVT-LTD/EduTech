import { Users, Globe, UserCheck, UserX, Calendar, CheckCircle, Archive } from 'lucide-react';
import type { LeadMetrics } from '../../types/admission.types';

interface InquiryKPIsProps {
    metrics: LeadMetrics;
}

const KPI_CONFIG = [
    { key: 'walkInsToday' as const, label: 'Walk-ins', icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { key: 'onlineToday' as const, label: 'Online', icon: Globe, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    { key: 'assigned' as const, label: 'Assigned', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { key: 'unassigned' as const, label: 'Unassigned', icon: UserX, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { key: 'pending' as const, label: 'Pending', icon: Calendar, color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { key: 'converted' as const, label: 'Converted', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
];

export function InquiryKPIs({ metrics }: InquiryKPIsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {KPI_CONFIG.map(({ key, label, icon: Icon, color }) => (
                <div
                    key={key}
                    className={`rounded-xl border p-3 ${color.split(' ').slice(1).join(' ')} border`}
                >
                    <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
                        <span className="text-[9px] font-black uppercase text-gray-500">{label}</span>
                    </div>
                    <p className={`text-xl font-black mt-1 ${color.split(' ')[0]}`}>{metrics[key]}</p>
                </div>
            ))}
            <div className="rounded-xl border p-3 bg-violet-50 border-violet-100 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-violet-600" />
                    <span className="text-[9px] font-black uppercase text-gray-500">Conversion</span>
                </div>
                <p className="text-xl font-black mt-1 text-violet-600">{metrics.conversionRate}%</p>
                <p className="text-[9px] text-gray-400 mt-0.5">
                    Avg follow-up: {metrics.avgFollowUpHours}h · Response: {metrics.avgResponseHours}h
                </p>
            </div>
        </div>
    );
}

export default InquiryKPIs;

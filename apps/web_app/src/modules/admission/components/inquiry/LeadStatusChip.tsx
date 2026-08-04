interface LeadStatusChipProps {
    status?: string;
}

function statusColor(status?: string): string {
    const s = (status ?? 'new').toLowerCase();
    if (s.includes('convert')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('contact') || s.includes('follow')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (s.includes('archiv') || s.includes('cancel') || s.includes('lost')) return 'bg-gray-100 text-gray-500 border-gray-200';
    return 'bg-amber-50 text-amber-700 border-amber-100';
}

export function LeadStatusChip({ status }: LeadStatusChipProps) {
    const label = (status ?? 'new').replace(/_/g, ' ');
    return (
        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${statusColor(status)}`}>
            {label}
        </span>
    );
}

export default LeadStatusChip;

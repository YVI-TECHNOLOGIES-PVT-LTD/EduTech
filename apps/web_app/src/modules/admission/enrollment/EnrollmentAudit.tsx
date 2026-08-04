import type { EnrollmentAuditEntry } from '../utils/enrollment.mapper';

interface EnrollmentAuditProps {
    entries: EnrollmentAuditEntry[];
}

export function EnrollmentAudit({ entries }: EnrollmentAuditProps) {
    if (entries.length === 0) {
        return <p className="text-xs text-gray-400 py-4 text-center">No enrollment audit entries.</p>;
    }

    return (
        <div className="divide-y divide-gray-50 text-xs">
            {entries.map(entry => (
                <div key={entry.id} className="py-2.5 flex justify-between gap-3">
                    <div>
                        <p className="font-bold text-gray-800">{entry.action}</p>
                        {entry.remarks && <p className="text-[10px] text-gray-500">{entry.remarks}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
            ))}
        </div>
    );
}

export default EnrollmentAudit;

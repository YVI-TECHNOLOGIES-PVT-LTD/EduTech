import type { EnrollmentHistoryEntry } from '../utils/enrollment.mapper';

interface EnrollmentHistoryProps {
    entries: EnrollmentHistoryEntry[];
}

export function EnrollmentHistory({ entries }: EnrollmentHistoryProps) {
    if (entries.length === 0) return null;

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400">Enrollment History</h3>
            <div className="divide-y divide-gray-50 text-xs">
                {entries.map(e => (
                    <div key={e.id} className="py-2 flex justify-between">
                        <span className="font-bold text-gray-700">{e.action}</span>
                        <span className="text-gray-400">{new Date(e.timestamp).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EnrollmentHistory;

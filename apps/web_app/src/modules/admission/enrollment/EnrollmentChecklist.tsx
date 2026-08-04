import type { EnrollmentValidationItem } from '../utils/enrollment.mapper';
import { CheckCircle2, XCircle } from 'lucide-react';

interface EnrollmentChecklistProps {
    items: EnrollmentValidationItem[];
}

export function EnrollmentChecklist({ items }: EnrollmentChecklistProps) {
    if (items.length === 0) {
        return <p className="text-xs text-gray-400">No validation data.</p>;
    }

    return (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <p className="text-xs font-bold text-gray-800">{item.label}</p>
                        {item.detail && <p className="text-[10px] text-gray-400 mt-0.5">{item.detail}</p>}
                    </div>
                    {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                </div>
            ))}
        </div>
    );
}

export default EnrollmentChecklist;

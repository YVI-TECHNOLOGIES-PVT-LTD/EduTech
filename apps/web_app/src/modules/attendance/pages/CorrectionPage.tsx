import { useCorrections } from '../hooks/useCorrections';
import { CorrectionQueue } from '../components/corrections/CorrectionQueue';
import { Card } from '../../../components/ui/card';
import { ShieldAlert, BookOpen } from 'lucide-react';

export function CorrectionPage() {
    const { corrections, approveCorrection, rejectCorrection } = useCorrections();

    const handleApprove = async (id: string) => {
        try {
            await approveCorrection(id);
            alert('Correction approved and status synced!');
        } catch (err) {
            console.error('Approve failed', err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectCorrection(id);
            alert('Correction request rejected.');
        } catch (err) {
            console.error('Reject failed', err);
        }
    };

    const mockCorrections = [
        { id: 'c1', student_name: 'Amit Kumar', date: '2026-06-25', original_status: 'Absent', requested_status: 'Present', reason: 'Was attending inter-school match.', status: 'PENDING' as const },
        { id: 'c2', student_name: 'Priya Saxena', date: '2026-06-26', original_status: 'Late', requested_status: 'Present', reason: 'Bus was delayed due to water logging.', status: 'PENDING' as const },
    ];

    const activeList = corrections.length > 0 ? corrections : mockCorrections;

    return (
        <div className="space-y-6 pb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Attendance Correction Desk</h1>
                <p className="text-sm text-gray-500 mt-1">Review request overrides, audit reasons, and sign off updates.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <CorrectionQueue
                        items={activeList as any}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                </div>

                <Card className="p-6 border-0 shadow-sm space-y-4 h-fit">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Administrative Audit rules
                    </h3>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                            Corrections are audited. The original state is archived, and updates show in timeline logs with the reviewer's signature.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default CorrectionPage;

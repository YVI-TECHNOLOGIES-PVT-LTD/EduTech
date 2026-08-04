import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { StudentTimeline } from '../components/timeline/StudentTimeline';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';

export function TimelinePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { timeline } = useStudent(id || '');

    const mockTimeline = timeline.length > 0 ? timeline : [
        { id: 't1', old_status: 'NEW', new_status: 'ACTIVE', reason: 'Student profile verified post admission.', changed_by: 'Registrar', changed_at: '2026-06-29T10:00:00.000Z' },
        { id: 't2', old_status: 'ACTIVE', new_status: 'PROMOTED', reason: 'Promoted to grade 10.', changed_by: 'Academic Board', changed_at: '2026-06-30T10:00:00.000Z' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Milestones Timeline</h1>
                    <p className="text-sm text-gray-500 mt-1">Audit status lifecycle updates and tracking logs.</p>
                </div>
            </div>

            <Card className="p-6 border-0 shadow-sm space-y-4 max-w-xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" /> Lifecycle Milestone Tracker
                </h3>
                <StudentTimeline steps={mockTimeline} />
            </Card>
        </div>
    );
}

export default TimelinePage;

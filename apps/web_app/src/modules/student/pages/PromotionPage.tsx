import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePromotion } from '../hooks/usePromotion';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function PromotionPage() {
    const navigate = useNavigate();
    const { promoteStudent, isPromoting } = usePromotion();

    const [studentId, setStudentId] = useState('');
    const [targetYear, setTargetYear] = useState('year-2026');
    const [targetGrade, setTargetGrade] = useState('');
    const [reason, setReason] = useState('Promoted on final exam results review.');

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await promoteStudent({
                id: studentId,
                data: {
                    to_academic_year_id: targetYear,
                    to_grade: targetGrade,
                    promotion_reason: reason,
                },
            });
            alert('Student promoted successfully!');
            navigate('/app/students');
        } catch (err) {
            console.error('Promotion failed', err);
        }
    };

    return (
        <form onSubmit={handlePromote} className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Promotion</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure individual promotions to next active academic year.</p>
                </div>
            </div>

            <Card className="p-6 border-0 shadow-sm space-y-4 max-w-xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Promotion Setup</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Student ID Reference</label>
                        <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student UUID..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Target Year</label>
                            <select
                                id="promotion-year-select"
                                value={targetYear}
                                onChange={e => setTargetYear(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                            >
                                <option value="year-2026">2026-27 Active</option>
                                <option value="year-2025">2025-26 Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Target Grade</label>
                            <Input value={targetGrade} onChange={e => setTargetGrade(e.target.value)} placeholder="e.g. Grade 11" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Remarks / Reason</label>
                        <Input value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <Button type="submit" disabled={isPromoting} className="bg-primary text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Promote Student
                    </Button>
                </div>
            </Card>
        </form>
    );
}

export default PromotionPage;

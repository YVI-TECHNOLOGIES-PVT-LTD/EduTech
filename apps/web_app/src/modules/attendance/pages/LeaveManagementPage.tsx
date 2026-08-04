import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useLeave } from '../hooks/useAttendance';

export const LeaveManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { submitLeave } = useLeave();
    const [submitting, setSubmitting] = useState(false);

    const handleLeave = async () => {
        const studentId = prompt("Enter Student UUID:");
        const start = prompt("Enter Start Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        const end = prompt("Enter End Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        const type = prompt("Enter Leave Type (MEDICAL, SPORTS, CASUAL):", "MEDICAL");
        const reason = prompt("Enter Leave Reason:");

        if (!studentId || !start || !end || !type || !reason) return;

        setSubmitting(true);
        try {
            const res = await submitLeave(studentId, start, end, type, reason);
            alert(`Leave request submitted successfully! Status: ${res.status}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/attendance')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Student Leave Requests
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Submit and approve medical leaves, Casual leaves, and Sports representation duty requests.
                    </p>
                </div>
            </div>

            {/* Actions panel */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Trigger Leave workflow</h3>
                <p className="text-xs text-gray-400">Apply leave range overlaps validation rules check.</p>

                <button
                    onClick={handleLeave}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-premium-md text-xs flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                    {submitting ? 'Submitting request...' : 'Apply Student Leave'}
                </button>
            </div>
        </div>
    );
};
export default LeaveManagementPage;

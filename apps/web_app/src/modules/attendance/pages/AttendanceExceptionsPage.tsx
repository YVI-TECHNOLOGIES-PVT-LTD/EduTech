import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const AttendanceExceptionsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/attendance')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Attendance Exception Requests
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Review and approve sports duty, medical leaves, or cultural representations exceptions.
                    </p>
                </div>
            </div>

            {/* List exception requests */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Exceptions signoff register</h3>

                <div className="text-center py-12 text-xs text-gray-400 font-bold flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    No pending exception approvals found.
                </div>
            </div>
        </div>
    );
};
export default AttendanceExceptionsPage;

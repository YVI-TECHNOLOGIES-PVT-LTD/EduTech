import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const DefaultersPage: React.FC = () => {
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
                        Attendance Defaulters List
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Students falling below minimum academic eligibility threshold percentage (75.00%).
                    </p>
                </div>
            </div>

            {/* List defaulter cards */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Defaulter Students</h3>

                <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                        <div>
                            <div className="font-bold text-gray-900">Student ID: STD-404-ABSENT</div>
                            <p className="text-[10px] text-gray-400">Current Attendance Percentage: <span className="text-rose-500 font-bold">64.50%</span></p>
                            <span className="text-[9px] text-gray-400 block pt-1">Shortage warning sent.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DefaultersPage;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, HelpCircle } from 'lucide-react';

export const AcademicHistoryPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/academic-records')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Semester Academic History
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Consolidated semester-by-semester historical grades registry details.
                    </p>
                </div>
            </div>

            {/* Timelines history card */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Academic Semester logs</h3>

                <div className="space-y-4 text-xs">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-900">Academic Semester 1</span>
                            <span className="text-primary">GPA: 8.50</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Earned Credits: 24 | Promotion decision status: Promoted</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AcademicHistoryPage;

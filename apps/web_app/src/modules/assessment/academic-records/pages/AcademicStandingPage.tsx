import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Award } from 'lucide-react';

export const AcademicStandingPage: React.FC = () => {
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
                        Academic Standing warnings logs
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Historical probation notices, warning letters, and Dean honors roll listings.
                    </p>
                </div>
            </div>

            {/* List standing alerts */}
            <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase">Warnings & Honors history</h3>

                <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <div className="font-bold text-gray-900">Academic Standing Warning Check</div>
                            <p className="text-[10px] text-gray-400">Student placed on Good Standing. No active warning flags reported.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AcademicStandingPage;

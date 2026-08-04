import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, CheckCircle } from 'lucide-react';

export const TranscriptPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-4xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/assessment/results')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Official Academic Transcripts
                        </h1>
                        <p className="text-[10px] text-gray-400">
                            View official academic transcripts snapshot registry.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200 text-xs"
                >
                    <Printer className="w-4 h-4" />
                    Print Transcript
                </button>
            </div>

            {/* Transcript canvas sheet */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 max-w-2xl mx-auto shadow-premium-md print:border-none print:shadow-none">
                <div className="text-center space-y-2 pb-6 border-b-2 border-double border-gray-300">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
                        EduTrack School Academy
                    </h2>
                    <h3 className="text-base font-black text-primary">OFFICIAL CONSOLIDATED TRANSCRIPT</h3>
                    <div className="text-[10px] text-gray-400 font-bold">PERMANENT ACADEMIC REGISTER RECORD</div>
                </div>

                <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                        <div><span className="font-bold text-gray-400">Student Name:</span> <span className="font-black text-gray-900">John Doe</span></div>
                        <div><span className="font-bold text-gray-400">Roll Registration:</span> <span className="font-black text-gray-900">2026-ROLL-01</span></div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Academic summary:</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] text-slate-400">Cumulative GPA</div>
                                <span className="font-black text-primary">8.50 / 10.00</span>
                            </div>
                            <div className="p-2 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] text-slate-400">Earned Credits</div>
                                <span className="font-black text-gray-900">24 Credits</span>
                            </div>
                            <div className="p-2 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] text-slate-400">Graduation Status</div>
                                <span className="font-black text-emerald-500">PROMOTED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default TranscriptPage;

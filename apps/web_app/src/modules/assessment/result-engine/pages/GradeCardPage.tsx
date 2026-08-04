import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Award, ShieldAlert, CheckSquare } from 'lucide-react';

export const GradeCardPage: React.FC = () => {
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
                            Official Grade Cards Printer
                        </h1>
                        <p className="text-[10px] text-gray-400">
                            Download signed, print-ready student grade report cards.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold border border-gray-200 text-xs"
                >
                    <Printer className="w-4 h-4" />
                    Print Document
                </button>
            </div>

            {/* Print preview scorecard sheet */}
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 space-y-6 max-w-2xl mx-auto shadow-premium-md print:border-none print:shadow-none">
                <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
                        EduTrack School Academy
                    </h2>
                    <h3 className="text-base font-black text-primary">OFFICIAL GRADE REPORT CARD</h3>
                    <div className="text-[10px] text-gray-400 font-bold">TERM EXAMINATION REPORT | BATCH 2026</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="font-bold text-gray-400">Student ID:</span> <span className="font-black text-gray-900">STD-789-2026</span></div>
                    <div><span className="font-bold text-gray-400">CGPA Score:</span> <span className="font-black text-primary">8.50 / 10.00</span></div>
                </div>

                {/* Subject grids */}
                <div className="border border-gray-150 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 font-bold border-b border-gray-150 text-[10px] text-gray-400 uppercase">
                                <th className="p-3">Subject Name</th>
                                <th className="p-3">Grade Label</th>
                                <th className="p-3">Grade Point</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="p-3 font-bold">Mathematics</td>
                                <td className="p-3 font-bold text-emerald-500">A+</td>
                                <td className="p-3 font-mono font-bold">9.00</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold">Computer Science</td>
                                <td className="p-3 font-bold text-emerald-500">O</td>
                                <td className="p-3 font-mono font-bold">10.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signatures overlay */}
                <div className="flex justify-between items-end pt-12 text-[10px] font-bold text-gray-400">
                    <div className="text-center w-32 border-t border-gray-200 pt-2">
                        Controller of Exams
                    </div>
                    <div className="text-center w-32 border-t border-gray-200 pt-2">
                        Principal Signed
                    </div>
                </div>
            </div>
        </div>
    );
};
export default GradeCardPage;

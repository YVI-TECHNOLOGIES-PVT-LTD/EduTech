import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import { Printer, Clock, XCircle, Trophy, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const MyReportCard = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId') || user?.id;

    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (examId && studentId) {
            apiClient.get(`/exams/report-card?examId=${examId}&studentId=${studentId}`)
                .then(res => setData(res.data))
                .catch(err => {
                    setError(err.response?.data?.error || "Results are not yet published for this exam.");
                })
                .finally(() => setLoading(false));
        } else {
            setError("Information missing.");
            setLoading(false);
        }
    }, [examId, studentId]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="flex items-center justify-center p-8 sm:p-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto mt-12 p-8 text-center animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 text-gray-400">
                <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Results Awaited</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                {error}
            </p>
            <Link to="/app/student/exams" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                Back to Exams
            </Link>
        </div>
    );

    if (!data) return null;

    const summary = data.summary;
    const isPass = summary.result_status === 'PASS';
    const isClosed = data.exam?.academic_year?.status === 'CLOSED';

    return (
        <div className="max-w-3xl mx-auto my-10 bg-white shadow-2xl rounded-none print:shadow-none print:w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${isPass ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            {isClosed && (
                <div className="bg-amber-100 text-amber-800 text-center py-3 text-[10px] font-black uppercase tracking-[0.2em] border-b border-amber-200 print:hidden">
                    Archived Academic Year – Read Only View
                </div>
            )}

            {/* Actions (Hidden in Print) */}
            <div className="flex justify-between items-center bg-gray-50 p-4 print:hidden border-b border-gray-100">
                <button onClick={() => window.history.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md"
                >
                    <Printer className="w-4 h-4" /> Print Report
                </button>
            </div>

            <div className="p-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-black rounded text-sm">R</div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Rapid School</h1>
                    </div>

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Official Statement of Marks</p>

                    <div className="mt-8 inline-block bg-gray-50 px-8 py-3 rounded-full border border-gray-100">
                        <h2 className="text-lg font-black text-gray-800">{data.exam.name}</h2>
                    </div>
                </div>

                {/* Student Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10 gap-6">
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student Name</div>
                        <div className="text-xl font-bold text-gray-900">{data.student.full_name}</div>
                        <div className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-2">
                            <span className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                Class: <strong className="text-gray-900">{summary.class_name_snapshot || data.student.section?.class?.name || 'N/A'}</strong>
                            </span>
                            <span className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                Section: <strong className="text-gray-900">{summary.section_name_snapshot || data.student.section?.name || 'N/A'}</strong>
                            </span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Academic Year</div>
                        <div className="text-lg font-bold text-gray-900">{summary.academic_year_label_snapshot || data.exam.academic_year?.year_label || 'Current'}</div>
                        <div className="mt-1 text-xs text-gray-400 font-mono">ID: {data.student.student_code}</div>
                    </div>
                </div>

                {/* Marks Table */}
                <div className="mb-10 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="py-4 font-black text-gray-900 uppercase text-xs tracking-wider">Subject</th>
                                <th className="py-4 font-black text-gray-900 uppercase text-xs tracking-wider text-center">Max Marks</th>
                                <th className="py-4 font-black text-gray-900 uppercase text-xs tracking-wider text-center">Obtained</th>
                                <th className="py-4 font-black text-gray-900 uppercase text-xs tracking-wider text-right">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.details.map((det: any, i: number) => (
                                <tr key={i}>
                                    <td className="py-4 font-bold text-gray-700">{det.subject?.name}</td>
                                    <td className="py-4 font-medium text-gray-500 text-center text-sm">100</td>
                                    <td className="py-4 font-black text-gray-900 text-center text-lg">{det.marks_obtained}</td>
                                    <td className="py-4 text-right">
                                        <div className={`inline-flex h-2 w-16 rounded-full ${det.marks_obtained >= 75 ? 'bg-emerald-500' :
                                            det.marks_obtained >= 50 ? 'bg-indigo-500' :
                                                det.marks_obtained >= 35 ? 'bg-amber-400' : 'bg-red-400'
                                            }`}></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-900 bg-gray-50">
                            <tr>
                                <td className="py-5 pl-4 font-black text-gray-900 uppercase text-sm">Grand Total</td>
                                <td className="py-5 font-black text-gray-900 text-center text-sm">{summary.total_max}</td>
                                <td className="py-5 font-black text-emerald-700 text-center text-xl">{summary.total_obtained}</td>
                                <td className="py-5"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                    <div className="bg-gray-900 text-white p-6 rounded-2xl text-center shadow-lg shadow-gray-200">
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Percentage</div>
                        <div className="text-3xl font-black">{summary.percentage}%</div>
                    </div>

                    <div className="bg-white border border-gray-200 p-6 rounded-2xl text-center">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Grade</div>
                        <div className="text-3xl font-black text-gray-900">{summary.grade}</div>
                    </div>

                    <div className={`p-6 rounded-2xl text-center border flex flex-col items-center justify-center ${isPass ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">Final Result</div>
                        <div className="text-2xl font-black flex items-center gap-2 uppercase tracking-wide">
                            {isPass ? <Trophy className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            {summary.result_status}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end pt-8 border-t border-dashed border-gray-300">
                    <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified & Published on {new Date(data.published_at).toLocaleDateString()}
                    </div>
                    <div className="text-center">
                        <div className="font-nothing-you-could-do text-2xl text-gray-800 mb-1 -rotate-2 opacity-60">Principal</div>
                        <div className="h-px bg-gray-300 w-32 mb-2"></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Principal Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

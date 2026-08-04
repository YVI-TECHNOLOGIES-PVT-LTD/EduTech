import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import { useTranscriptRequest } from '../hooks/useAcademicRecords';

export const TranscriptCenterPage: React.FC = () => {
    const navigate = useNavigate();
    const { requestTranscript, generateTranscript } = useTranscriptRequest();
    const [submitting, setSubmitting] = useState(false);

    const handleRequest = async () => {
        const studentId = prompt("Enter Student UUID:");
        if (!studentId) return;

        setSubmitting(true);
        try {
            await requestTranscript(studentId);
            alert("Transcript print request submitted successfully!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerate = async () => {
        const studentId = prompt("Enter Student UUID:");
        if (!studentId) return;

        setSubmitting(true);
        try {
            const res = await generateTranscript(studentId);
            alert(`Official transcript generated successfully! File: ${res.pdf_url}`);
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
                <button onClick={() => navigate('/app/academic-records')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Official Academic Transcripts Center
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Submit official transcript requests and generate COE-signed documents copies.
                    </p>
                </div>
            </div>

            {/* Actions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase">Submit print request</h3>
                    <p className="text-xs text-gray-400">Request copies for student dispatching purposes.</p>
                    <button
                        onClick={handleRequest}
                        disabled={submitting}
                        className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-xs"
                    >
                        Request transcript copy
                    </button>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase">Generate official copy</h3>
                    <p className="text-xs text-gray-400">Compile consolidated transcript and apply signatures hashes.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold text-xs"
                    >
                        Generate & sign transcript
                    </button>
                </div>
            </div>
        </div>
    );
};
export default TranscriptCenterPage;

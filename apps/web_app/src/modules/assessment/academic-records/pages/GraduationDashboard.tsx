import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Sparkles, RefreshCw, BarChart2, CheckSquare } from 'lucide-react';
import { useGraduationWorkflow } from '../hooks/useAcademicRecords';

export const GraduationDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { transitionGraduation, approveClearance } = useGraduationWorkflow();
    const [submitting, setSubmitting] = useState(false);

    const handleClearNoc = async () => {
        const studentId = prompt("Enter Student UUID:");
        const type = prompt("Enter NOC Type (Library, Finance, Hostel, Transport, Department, ExamCell, Placement, Alumni):");

        if (!studentId || !type) return;

        setSubmitting(true);
        try {
            await approveClearance(studentId, type);
            alert(`NOC item signoff recorded! Clearance: ${type}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTransitionStatus = async () => {
        const studentId = prompt("Enter Student UUID:");
        const status = prompt("Enter Target Status (ELIGIBLE, APPROVED, GRADUATED):");

        if (!studentId || !status) return;

        setSubmitting(true);
        try {
            await transitionGraduation(studentId, status);
            alert(`Candidacy status successfully transitioned to: ${status}`);
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
                        Graduation candidates desk
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Process departmental clearance NOC items and candidate approvals matrices.
                    </p>
                </div>
            </div>

            {/* Actions panel splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase">Approve NOC clearance</h3>
                    <p className="text-xs text-gray-400">Signoff Library, Hostel, or Finance NOC checklists.</p>
                    <button
                        onClick={handleClearNoc}
                        disabled={submitting}
                        className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-xs"
                    >
                        Sign clearance NOC item
                    </button>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-md space-y-4">
                    <h3 className="text-xs font-black text-gray-900 uppercase">Transition Candidate</h3>
                    <p className="text-xs text-gray-400">Progress student file through review to Graduation.</p>
                    <button
                        onClick={handleTransitionStatus}
                        disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold text-xs"
                    >
                        Transition workflow status
                    </button>
                </div>
            </div>
        </div>
    );
};
export default GraduationDashboard;

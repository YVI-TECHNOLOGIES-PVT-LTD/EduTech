import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Sparkles, ClipboardList, ShieldAlert, Award, FileText, CheckCircle, 
    ArrowUpRight, Clock, Users, Activity, BarChart2, ShieldCheck, RefreshCw, GraduationCap
} from 'lucide-react';
import { useAcademicRecords } from '../hooks/useAcademicRecords';

export const AcademicRecordsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const studentId = 'e0b57ba2-8f92-41cc-8854-3253bdeef12b'; // Simulated student UUID
    const { record, timeline, loading, saveAcademicRecord } = useAcademicRecords(studentId);

    const handleSaveRecord = async () => {
        const cgpa = Number(prompt("Enter CGPA Score:", "8.50"));
        const credits = Number(prompt("Enter Total Credits Earned:", "24"));

        try {
            await saveAcademicRecord(cgpa, credits);
            alert("Permanent Academic Record updated successfully!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Phase 14 Academic Records
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Academic History & Graduation Desk
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Permanent academic profile registries, degree audits, and transcript signatures locks.
                    </p>
                </div>

                <button 
                    onClick={handleSaveRecord}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]"
                >
                    Update Student Record
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Cumulative GPA (CGPA)
                    </div>
                    <div className="text-2xl font-black text-primary mt-2">
                        {record ? record.cgpa.toFixed(2) : '0.00'} / 10.00
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        First Class Distinction Range
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Earned Credits
                    </div>
                    <div className="text-2xl font-black text-gray-900 mt-2">
                        {record ? record.total_credits : '0'} Credits
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Graduation benchmark: 120
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Academic Standing
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-2">
                        {record ? record.standing : 'GOOD_STANDING'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Good standing profile
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Degree Audit Completion
                    </div>
                    <div className="text-2xl font-black text-indigo-500 mt-2">
                        20.00%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        Core/Elective requirements
                    </div>
                </div>
            </div>

            {/* Split timeline logs and toolbox */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Timeline activity logs */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Student Academic Event Timeline
                        </h3>

                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                Loading academic timeline events...
                            </div>
                        ) : timeline.length === 0 ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                No academic events logged.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {timeline.map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start text-xs">
                                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-bold text-gray-900">{item.event_type}</div>
                                            <p className="text-[10px] text-gray-400">{item.event_description}</p>
                                            <span className="text-[9px] text-gray-400 block pt-1">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations tools */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            SIS Academic Tools
                        </h3>
                        <div className="space-y-3 text-xs">
                            <Link to="/app/academic-records/history" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Academic History Registry
                            </Link>
                            <Link to="/app/academic-records/degree-audit" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Degree Audit & Milestones
                            </Link>
                            <Link to="/app/academic-records/graduation" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Graduation candidate workflow
                            </Link>
                            <Link to="/app/academic-records/transcripts" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Transcript requests center
                            </Link>
                            <Link to="/app/academic-records/standing" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Academic Standing warnings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AcademicRecordsDashboard;

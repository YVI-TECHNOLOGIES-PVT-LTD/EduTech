import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Database,
    Users,
    GraduationCap,
    Calendar,
    Coins,
    Clock,
    AlertCircle,
    CheckCircle2,
    Search
} from 'lucide-react';
import { BulkFileUploader } from '../../../components/common/BulkFileUploader';
import { toast } from 'sonner';

import { useAuth } from '../../../context/AuthContext';

export const BulkOperations = () => {
    const { systemMode } = useAuth();
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'assign' | 'promote' | 'attendance' | 'fees'>('assign');

    const isProduction = systemMode === 'PRODUCTION';

    useEffect(() => {
        apiClient.get('/academic-years').then(res => {
            setAcademicYears(res.data);
            const active = res.data.find((y: any) => y.is_active);
            if (active) setSelectedYear(active.id);
        });
    }, []);

    const handleBulkUpload = async (endpoint: string, file: File, extraData: any = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        Object.keys(extraData).forEach(key => formData.append(key, extraData[key]));

        const res = await apiClient.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                        <Database className="w-10 h-10 text-indigo-600" />
                        Bulk Operations
                    </h1>
                    <p className="text-gray-500 font-medium">Enterprise data ingestion & mass processing system.</p>
                </div>

                <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <button
                        onClick={() => setActiveTab('assign')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'assign' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-indigo-600'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Assignment
                    </button>
                    <button
                        onClick={() => setActiveTab('promote')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'promote' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-indigo-600'
                            }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Promotion
                    </button>
                    {!isProduction && (
                        <>
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-indigo-600'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Attendance
                            </button>
                            <button
                                onClick={() => setActiveTab('fees')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fees' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-indigo-600'
                                    }`}
                            >
                                <Coins className="w-4 h-4" />
                                Fees
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Config Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Target Academic Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 font-black text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            >
                                <option value="">Select Year...</option>
                                {academicYears.map(y => (
                                    <option key={y.id} value={y.id}>{y.year_label} {y.is_active ? '(Active)' : ''}</option>
                                ))}
                            </select>
                            {selectedYear && academicYears.find(y => y.id === selectedYear)?.status === 'CLOSED' && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-rose-700 leading-relaxed">
                                        This year is **CLOSED**. All bulk writes will be rejected to protect historical integrity.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-50">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Governance Rules</h4>
                            <ul className="space-y-3">
                                {[
                                    { icon: Clock, text: "Writes to CLOSED years forbidden" },
                                    { icon: CheckCircle2, text: "All rows are audited & logged" },
                                    { icon: AlertCircle, text: "Single row failure won't stop others" }
                                ].map((rule, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center">
                                            <rule.icon className="w-3.5 h-3.5" />
                                        </div>
                                        {rule.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    {activeTab === 'assign' && (
                        <BulkFileUploader
                            title="Student Section Assignment"
                            description="Mass link students to their respective classes and sections for the selected academic year."
                            requiredColumns={["student_code", "class_code", "section_code"]}
                            sampleData={[
                                { student_code: "STU-2026-001", class_code: "Grade 5", section_code: "A" },
                                { student_code: "STU-2026-002", class_code: "Grade 5", section_code: "B" }
                            ]}
                            onUpload={(file) => handleBulkUpload('/admin/bulk/student-section/assign', file, { academic_year_id: selectedYear })}
                        />
                    )}

                    {activeTab === 'promote' && (
                        <BulkFileUploader
                            title="Bulk Student Promotion"
                            description="Move students to the next academic session. Note: System blocks promotion if current year exams are ongoing."
                            requiredColumns={["student_code", "target_academic_year", "target_class", "target_section"]}
                            sampleData={[
                                { student_code: "STU-2025-001", target_academic_year: "2026-27", target_class: "Grade 6", target_section: "A" }
                            ]}
                            onUpload={(file) => handleBulkUpload('/admin/bulk/students/promote', file, { from_academic_year_id: selectedYear })}
                        />
                    )}

                    {activeTab === 'attendance' && (
                        <BulkFileUploader
                            title="Attendance Seeding (UAT)"
                            description="Populate historical attendance records for system testing. Marked as ADMIN_TEST_SEED."
                            requiredColumns={["student_code", "date", "status"]}
                            sampleData={[
                                { student_code: "STU-2026-001", date: "2026-02-08", status: "PRESENT" }
                            ]}
                            onUpload={(file) => handleBulkUpload('/admin/bulk/attendance/seed', file)}
                        />
                    )}

                    {activeTab === 'fees' && (
                        <BulkFileUploader
                            title="Fee Record Seeding (UAT)"
                            description="Bulk populate fee ledger for system verification. Tagged as TEST_ADMIN_SEED."
                            requiredColumns={["student_code", "fee_type", "amount", "paid_amount", "remarks"]}
                            sampleData={[
                                { student_code: "STU-2026-001", fee_type: "Tuition Fee", amount: 5000, paid_amount: 5000, remarks: "One-time" }
                            ]}
                            onUpload={(file) => handleBulkUpload('/admin/bulk/fees/seed', file, { academic_year_id: selectedYear })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

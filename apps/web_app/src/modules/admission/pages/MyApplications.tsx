import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApplicationList } from '../hooks/useApplication';
import { formatStatusLabel, getStatusColor } from '../core/AdmissionStatusMapper';
import ParentAdmissionDashboard from '../pages/Workspace/ParentDashboard';

export function MyApplications() {
    const { applications, isLoading } = useApplicationList({ limit: 50 }, { mine: true });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading applications…</div>;
    }

    const activeApplications = applications.filter(
        app => !['enrolled', 'rejected', 'withdrawn'].includes(app.status.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        My Admission
                    </h1>
                    <p className="text-gray-500 mt-1">Track your child&apos;s admission progress, documents, and fees</p>
                </div>
                <Link
                    to="/admissions/apply"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-200 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Application
                </Link>
            </div>

            {activeApplications.length > 0 && <ParentAdmissionDashboard />}

            {applications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800">No Applications Yet</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">Start your child&apos;s journey with an online application.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">All Applications</h2>
                    <div className="grid gap-4">
                        {applications.map(app => (
                            <div
                                key={app.id}
                                className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-600">
                                        {app.student_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{app.student_name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span>Grade: {app.grade_applied_for}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}>
                                        {formatStatusLabel(app.status)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Link to={`/app/admissions/${app.id}?tab=documents`} className="text-xs font-bold text-indigo-600 hover:underline">
                                            Documents
                                        </Link>
                                        <Link to={`/app/admissions/${app.id}?tab=timeline`} className="text-xs font-bold text-indigo-600 hover:underline">
                                            Timeline
                                        </Link>
                                        <Link
                                            to={`/app/admissions/${app.id}`}
                                            className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyApplications;

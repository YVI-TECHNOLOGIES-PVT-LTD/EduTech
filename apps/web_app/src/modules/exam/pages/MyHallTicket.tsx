import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { HallTicketDocument } from '../components/HallTicketDocument';

export const MyHallTicket = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // Prioritize param (for parents/admin), fallback to logged-in user
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId') || user?.id;

    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (examId && studentId) {
            apiClient.get(`/exams/hall-ticket`, { params: { examId, studentId } })
                .then(res => setData(res.data))
                .catch(err => {
                    const msg = err.response?.data?.error || "Hall ticket is not generated yet.";
                    setError(msg);
                })
                .finally(() => setLoading(false));
        } else {
            setError("Exam information is missing. Please return to the dashboard.");
            setLoading(false);
        }
    }, [examId, studentId]);

    if (loading) return (
        <div className="flex items-center justify-center p-8 sm:p-24 min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-full mb-6 text-amber-500 mx-auto">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed text-sm">
                    {error.includes("Not Ready")
                        ? "Your hall ticket is not ready yet. Seating allocation is in progress. Please check back later."
                        : error}
                </p>
                <div className="space-y-3">
                    <Link to="/app/student/exams" className="block w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                        Return to My Exams
                    </Link>
                    <Link to="/app/dashboard" className="block w-full px-6 py-3 bg-white text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Integrated Document Component */}
            <HallTicketDocument
                data={data}
                onClose={() => window.history.back()}
            />
        </div>
    );
};

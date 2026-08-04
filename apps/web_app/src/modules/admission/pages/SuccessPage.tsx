import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export function SuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-6 select-none">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <div className="space-y-2">
                <h1 className="text-2xl font-black text-gray-900">Assessment Submitted Successfully</h1>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                    Thank you. Your responses have been securely uploaded, evaluated on the server, and written to the Admissions Merit Engine database records.
                </p>
            </div>

            <button
                onClick={() => navigate('/app/admissions/my')}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark transition-all"
            >
                Return to My Applications <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

export default SuccessPage;

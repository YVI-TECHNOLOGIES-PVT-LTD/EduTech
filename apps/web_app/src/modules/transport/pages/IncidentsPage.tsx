import { ExceptionManager } from '../components/ExceptionManager';
import { AlertOctagon } from 'lucide-react';

export const IncidentsPage = () => {
    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <AlertOctagon className="text-rose-600 w-10 h-10" />
                    Incident Command Center
                </h1>
                <p className="text-gray-500 mt-1">Monitor safety alerts, breakdown logs, and operational exceptions.</p>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <ExceptionManager />
            </div>
        </div>
    );
};

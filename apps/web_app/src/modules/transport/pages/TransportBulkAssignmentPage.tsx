
import { BulkAssignment } from '../components/BulkAssignment';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransportBulkAssignmentPage = () => {
    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/app/transport/setup" className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-blue-600" />
                        Bulk Student Transport Assignment
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Efficiently assign routes, stops, and vehicles to multiple students at once.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <BulkAssignment />
            </div>
        </div>
    );
};

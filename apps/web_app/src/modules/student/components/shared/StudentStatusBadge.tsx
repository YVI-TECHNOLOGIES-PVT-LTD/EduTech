import React from 'react';

interface StudentStatusBadgeProps {
    status: string;
}

export const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({ status }) => {
    const statusColors: Record<string, string> = {
        ACTIVE: 'bg-green-50 text-green-600 border-green-200',
        NEW: 'bg-blue-50 text-blue-600 border-blue-200',
        PROMOTED: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        SUSPENDED: 'bg-red-50 text-red-600 border-red-200',
        TRANSFERRED: 'bg-purple-50 text-purple-600 border-purple-200',
        LEFT: 'bg-gray-100 text-gray-600 border-gray-300',
        ALUMNI: 'bg-amber-50 text-amber-600 border-amber-200',
    };

    return (
        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase border ${statusColors[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
};

export default StudentStatusBadge;

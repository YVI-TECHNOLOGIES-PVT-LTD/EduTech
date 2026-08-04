import React from 'react';

/**
 * StaffListPage — DECOMMISSIONED
 * The legacy ERP Staff module has been removed as part of Stage 3 — Sprint 6.
 * Staff profiles are now managed via the Core Shared Platform (Academic module).
 */
export const StaffListPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <span className="text-2xl">🗂️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Staff Management</h2>
            <p className="text-sm text-gray-500">
                Staff profiles are managed through the Core Academic platform.
                Contact your system administrator for access.
            </p>
        </div>
    );
};

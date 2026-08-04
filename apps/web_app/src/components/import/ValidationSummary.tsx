import React from 'react';
import { AlertTriangle, UserX, Building, School } from 'lucide-react';
import { ValidationSummary } from '../../api/import.api';

export const ValidationSummaryView: React.FC<{ summary: ValidationSummary }> = ({ summary }) => {

    // Group Errors Logic
    const groupedErrors = {
        users: [] as any[],
        departments: [] as any[],
        classes: [] as any[],
        others: [] as any[]
    };

    summary.failedRows.forEach(row => {
        row.errors.forEach((err: any) => {
            const errorItem = { row: row.row, error: err };
            if (err.message.includes('User not found') || err.message.includes('email') || err.column === 'email') {
                groupedErrors.users.push(errorItem);
            } else if (err.message.includes('Department') || err.column === 'department') {
                groupedErrors.departments.push(errorItem);
            } else if (err.message.includes('Class') || err.column === 'class_name') {
                groupedErrors.classes.push(errorItem);
            } else {
                groupedErrors.others.push(errorItem);
            }
        });
    });

    const renderErrorGroup = (title: string, icon: React.ReactNode, items: any[], colorClass: string) => {
        if (items.length === 0) return null;
        return (
            <div className={`rounded-xl border ${colorClass} overflow-hidden mb-3`}>
                <div className={`px-4 py-2 bg-opacity-10 font-bold text-sm flex items-center gap-2 ${colorClass.replace('border', 'bg').replace('text', 'text')}`}>
                    {icon} {title} ({items.length})
                </div>
                <div className="max-h-32 overflow-y-auto p-2 bg-white space-y-1 custom-scrollbar">
                    {items.map((item, idx) => (
                        <div key={idx} className="text-xs grid grid-cols-[60px_1fr] gap-2 p-1 hover:bg-gray-50 rounded">
                            <span className="font-mono font-bold text-gray-500">Row {item.row}</span>
                            <span className="text-gray-700">{item.error.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Rows</p>
                    <p className="text-2xl font-black text-gray-900">{summary.totalRows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                    <p className="text-xs font-bold text-green-600 uppercase">Valid Rows</p>
                    <p className="text-2xl font-black text-green-700">{summary.validRows.length}</p>
                </div>
                <div className={`p-4 rounded-xl border text-center ${summary.failedRows.length > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-xs font-bold uppercase ${summary.failedRows.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Failed Rows</p>
                    <p className={`text-2xl font-black ${summary.failedRows.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>{summary.failedRows.length}</p>
                </div>
            </div>

            {summary.failedRows.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b pb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Validation Issues
                    </h4>

                    {renderErrorGroup("User Errors (Fix with AUTO_CREATE)", <UserX className="w-4 h-4" />, groupedErrors.users, "border-blue-200 text-blue-800 bg-blue-50")}
                    {renderErrorGroup("Department Errors (Manual Setup Required)", <Building className="w-4 h-4" />, groupedErrors.departments, "border-orange-200 text-orange-800 bg-orange-50")}
                    {renderErrorGroup("Class Errors (Manual Setup Required)", <School className="w-4 h-4" />, groupedErrors.classes, "border-orange-200 text-orange-800 bg-orange-50")}
                    {renderErrorGroup("Other Errors", <AlertTriangle className="w-4 h-4" />, groupedErrors.others, "border-gray-200 text-gray-800 bg-gray-50")}
                </div>
            )}
        </div>
    );
};

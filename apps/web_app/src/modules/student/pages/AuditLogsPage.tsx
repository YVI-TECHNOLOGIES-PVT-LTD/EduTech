import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { ArrowLeft, User, ShieldAlert } from 'lucide-react';

export function AuditLogsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const mockAuditLogs = [
        { id: 'a1', action: 'PERSONAL_PROFILE_UPDATED', changed_by: 'Counselor Priya', date: '2026-06-29 11:32 AM', details: 'Changed address from Jaiput Block A to Jaipur Block C.' },
        { id: 'a2', action: 'CLASS_ALLOCATED', changed_by: 'Staff Administrator', date: '2026-06-29 02:15 PM', details: 'Assigned Grade 10 - Section A.' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Audit Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">Review modifications and history of student data.</p>
                </div>
            </div>

            <div className="space-y-4 max-w-2xl">
                {mockAuditLogs.map(log => (
                    <Card key={log.id} className="p-5 border-0 shadow-sm space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                                <span className="px-2 py-0.5 text-[8px] font-black rounded-full bg-slate-100 text-slate-700 uppercase border border-slate-200">
                                    {log.action}
                                </span>
                                <p className="text-xs text-gray-700 mt-2 font-bold">{log.details}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                            <User className="w-3 h-3" />
                            <span>Modified by: {log.changed_by}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default AuditLogsPage;

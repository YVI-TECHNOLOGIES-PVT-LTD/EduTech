import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransfer } from '../hooks/useTransfer';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { ArrowRight, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export function TransferPage() {
    const navigate = useNavigate();
    const { requestTransfer, approveTransfer, isRequesting, isApproving } = useTransfer();

    const [studentId, setStudentId] = useState('');
    const [school, setSchool] = useState('');
    const [reason, setReason] = useState('');
    const [pendingRequestId, setPendingRequestId] = useState('t-101');

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await requestTransfer({
                id: studentId,
                data: {
                    destination_school: school,
                    reason,
                },
            });
            alert('Transfer Certificate (TC) request submitted successfully!');
            setStudentId('');
            setSchool('');
            setReason('');
        } catch (err) {
            console.error('Request failed', err);
        }
    };

    const handleApprove = async () => {
        try {
            await approveTransfer(pendingRequestId);
            alert('TC request approved and generated!');
        } catch (err) {
            console.error('Approval failed', err);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Transfer & TC Desk</h1>
                    <p className="text-sm text-gray-500 mt-1">Review transfer certificate requests, approve exits, and download certificates.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Form to submit request */}
                <form onSubmit={handleRequest}>
                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Initiate TC Request</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Student Reference ID</label>
                                <Input value={studentId} onChange={e => setStudentId(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Destination School</label>
                                <Input value={school} onChange={e => setSchool(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Reason for Withdrawal</label>
                                <Input value={reason} onChange={e => setReason(e.target.value)} required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <Button type="submit" disabled={isRequesting} className="bg-primary text-white flex items-center gap-1.5">
                                <Send className="w-4 h-4" /> Request Transfer
                            </Button>
                        </div>
                    </Card>
                </form>

                {/* Queue list for approvals */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Pending Approvals Queue
                    </h3>
                    <div className="divide-y divide-gray-50">
                        <div className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                            <div>
                                <p className="text-xs font-black text-gray-900">Rahul Soni</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Dest: Jaipur Public School · Relocation</p>
                            </div>
                            <Button
                                size="sm"
                                disabled={isApproving}
                                onClick={handleApprove}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                                Approve & Issue
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default TransferPage;

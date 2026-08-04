import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import { Printer, CreditCard, History, CheckCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export const MyFees = () => {
    const { user } = useAuth();
    const [structures, setStructures] = useState<any[]>([]);
    const [myLedger, setMyLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeYear, setActiveYear] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const yearRes = await apiClient.get('/academic-years/current');
                setActiveYear(yearRes.data);

                const structRes = await apiClient.get('/fees/structures');
                setStructures(structRes.data);

                const ledgRes = await apiClient.get('/fees/my');
                setMyLedger(ledgRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Fee_Chart_${activeYear?.year_label || 'Session'}`,
    });

    const handlePay = async (studentId: string, amount: number, feeName: string) => {
        if (!confirm(`Proceed to pay Rs.${amount} for ${feeName} ? `)) return;

        // Mock Payment Gateway Logic
        const refNo = `TXN${Math.floor(Math.random() * 1000000)} `;
        try {
            await apiClient.post('/fees/payments', {
                student_id: studentId,
                amount_paid: amount,
                payment_mode: 'ONLINE',
                reference_no: refNo,
                remarks: `Online Payment for ${feeName}`
            });
            alert(`Payment Successful! Transaction ID: ${refNo} `);

            // Refresh Ledger
            const ledgRes = await apiClient.get('/fees/my');
            setMyLedger(ledgRes.data);
        } catch (err: any) {
            alert('Payment Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div>Loading Fee Details...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fee Center</h1>
                    <p className="text-gray-500">View official fees and manage your payments</p>
                </div>
                <button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                    <Printer className="w-5 h-5" />
                    Download Chart
                </button>
            </div>

            {/* Student Ledger Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    My Payment Status
                </h2>

                {myLedger.length === 0 ? (
                    <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500">No student records linked to this account.</div>
                ) : (
                    myLedger.map((record, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{record.student?.full_name}</h3>
                                    <div className="text-xs font-mono text-gray-400">{record.student?.student_code}</div>
                                </div>
                                <div className={`text-sm font-bold px-3 py-1 rounded-full ${record.summary.balance <= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {record.summary.balance <= 0 ? 'Fully Paid' : `Due: Rs.${record.summary.balance} `}
                                </div>
                            </div>

                            <div className="p-6 grid lg:grid-cols-2 gap-8">
                                {/* Assigned Fees */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Assigned Fees</h4>
                                    <div className="space-y-3">
                                        {record.fees?.map((fee: any) => (
                                            <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-700">
                                                        {fee.fee_type === 'TRANSPORT' ? '🚌 Transport Fee' : (fee.fee_structure?.name || 'Unknown Fee')}
                                                    </span>
                                                    {fee.fee_type === 'TRANSPORT' && (
                                                        <div className="text-xs text-blue-500 font-bold mt-0.5">
                                                            {fee.fee_structure?.name?.replace('Transport Fee: ', '')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono font-bold">Rs. {fee.assigned_amount}</span>
                                                    <button
                                                        onClick={() => handlePay(record.student.id, fee.assigned_amount, fee.fee_structure?.name)}
                                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold transition-colors"
                                                    >
                                                        Pay Now
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!record.fees || record.fees.length === 0) && <p className="text-sm text-gray-400 italic">No fees assigned yet.</p>}
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <History className="w-4 h-4" /> Payment History
                                    </h4>
                                    <div className="space-y-3">
                                        {record.payments?.map((pay: any) => (
                                            <div key={pay.id} className="flex justify-between items-center p-3 bg-green-50/30 rounded-lg border border-green-50">
                                                <div>
                                                    <div className="font-bold text-green-900">Rs. {pay.amount_paid}</div>
                                                    <div className="text-xs text-green-600">{new Date(pay.created_at).toLocaleDateString()} via {pay.payment_mode}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-mono text-gray-400">{pay.reference_no}</div>
                                                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                        {(!record.payments || record.payments.length === 0) && <p className="text-sm text-gray-400 italic">No payments made.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Official Chart (Hidden in Print Mode but visible on screen, printable) */}
            <div className="pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold mb-6">Official Fee Chart</h2>
                <div ref={printRef} className="bg-white shadow-xl rounded-none md:rounded-2xl overflow-hidden print:shadow-none print:w-full">
                    <div className="bg-purple-900 text-white p-6 text-center print:bg-white print:text-black print:border-b-2 print:border-black">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">Fees Structure For Session {activeYear?.year_label}</h1>
                        <p className="text-purple-200 print:hidden text-sm mt-1">Official Institutional Schedule</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-900 border-b-2 border-gray-200 print:bg-white print:border-black">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase w-1/3 border-r border-gray-200 print:border-black">Fees Details</th>
                                    <th className="px-6 py-4 font-bold uppercase border-r border-gray-200 print:border-black">Classes</th>
                                    <th className="px-6 py-4 font-bold uppercase border-r border-gray-200 print:border-black">Amount</th>
                                    <th className="px-6 py-4 font-bold uppercase border-r border-gray-200 print:border-black">Schedule</th>
                                    <th className="px-6 py-4 font-bold uppercase border-r border-gray-200 print:border-black">Discount if any</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 print:divide-black">
                                {structures.map((s, index) => (
                                    <tr key={s.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-white'}>
                                        <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-200 print:border-black">
                                            {s.fee_details || s.name}
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 print:border-black whitespace-pre-wrap">{s.applicable_classes || '-'}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900 border-r border-gray-200 print:border-black">
                                            Rs. {Number(s.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 print:border-black font-medium text-gray-600 print:text-black">
                                            {s.payment_schedule || '-'}
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 print:border-black text-xs text-gray-500 print:text-black">
                                            {s.discount_info || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

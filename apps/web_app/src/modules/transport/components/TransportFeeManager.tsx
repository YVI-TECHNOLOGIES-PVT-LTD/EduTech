import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { DollarSign, Save } from 'lucide-react';

export const TransportFeeManager = () => {
    const [stops, setStops] = useState<any[]>([]);
    const [slabs, setSlabs] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [selectedAY, setSelectedAY] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [stopRes, ayRes, slabRes] = await Promise.all([
                    apiClient.get('/transport/stops'),
                    apiClient.get('/academic-years'),
                    apiClient.get('/transport/fee-slabs')
                ]);
                setStops(stopRes.data);
                setAcademicYears(ayRes.data);
                setSlabs(slabRes.data);

                const active = ayRes.data.find((ay: any) => ay.is_active);
                if (active) setSelectedAY(active.id);

            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleUpdate = async (stopId: string, amount: string) => {
        if (!selectedAY) return alert("Select Academic Year first");
        try {
            await apiClient.post('/transport/fee-slabs', {
                stop_id: stopId,
                academic_year_id: selectedAY,
                amount: parseFloat(amount) || 0
            });
            // Update local state is optional but better
            const res = await apiClient.get('/transport/fee-slabs');
            setSlabs(res.data);
        } catch (err) { alert("Failed to save"); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <DollarSign className="text-green-600" /> Transport Fee Slabs
                    </h3>
                    <p className="text-sm text-gray-400">Define transport fees per stop for each session.</p>
                </div>
                <select
                    value={selectedAY}
                    onChange={e => setSelectedAY(e.target.value)}
                    className="border rounded-lg p-2 font-bold text-blue-600"
                >
                    {academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>{ay.year_label} {ay.is_active ? '(Active)' : ''}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Bus Stop Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fee Amount (per session)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {stops.map(stop => {
                            const slab = slabs.find(s => s.stop_id === stop.id && s.academic_year_id === selectedAY);
                            return (
                                <StopRow
                                    key={stop.id}
                                    stop={stop}
                                    initialAmount={slab?.amount || 0}
                                    onSave={(amt: string) => handleUpdate(stop.id, amt)}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StopRow = ({ stop, initialAmount, onSave }: any) => {
    const [amount, setAmount] = useState(initialAmount);
    useEffect(() => setAmount(initialAmount), [initialAmount]);

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 font-bold text-gray-900">{stop.name}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold">₹</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="border-b-2 border-transparent focus:border-blue-500 outline-none w-24 font-mono font-bold text-lg"
                    />
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <button
                    disabled={amount === initialAmount}
                    onClick={() => onSave(amount)}
                    className={`p-2 rounded-lg transition-all ${amount === initialAmount ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                    <Save className="w-5 h-5 shadow-sm" />
                </button>
            </td>
        </tr>
    );
};

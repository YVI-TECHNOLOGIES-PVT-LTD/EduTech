import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Trash2, Plus, GripVertical } from 'lucide-react';

export const StopManager = () => {
    const [stops, setStops] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStops();
    }, []);

    const fetchStops = () => apiClient.get('/transport/stops').then(res => setStops(res.data));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/transport/stops', {
                name,
                latitude: lat ? parseFloat(lat) : null,
                longitude: lng ? parseFloat(lng) : null
            });
            setName('');
            setLat('');
            setLng('');
            fetchStops();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed using default");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h3 className="font-bold mb-4 text-gray-800">Add New Stop</h3>
                <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Stop Name</label>
                        <input className="w-full border p-2 rounded" placeholder="e.g. Clock Tower" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Latitude (Opt)</label>
                        <input className="w-full border p-2 rounded" placeholder="12.9716" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Longitude (Opt)</label>
                        <input className="w-full border p-2 rounded" placeholder="77.5946" type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Adding...' : 'Add Stop'}
                    </button>
                </form>
            </div>

            <div className="bg-white shadow rounded overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stop Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Coordinates</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {stops.map(stop => (
                            <tr key={stop.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{stop.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                    {stop.latitude && stop.longitude ? `${stop.latitude}, ${stop.longitude}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-red-500 hover:text-red-700 opacity-50 cursor-not-allowed" title="Delete Not Implemented">
                                        <Trash2 className="w-4 h-4 ml-auto" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {stops.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No stops defined yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

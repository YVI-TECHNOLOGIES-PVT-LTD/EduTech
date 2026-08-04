import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { User, Phone, CheckCircle, XCircle } from 'lucide-react';

export const DriverManager = () => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]); // Potential drivers (Staff?)
    // For T1, we might just assume any user or enter a User ID manually if search is complex.
    // Let's rely on simple User ID input or assume we can create users?
    // "Create driver (must link to existing user)" - says the prompt.
    // So we need a User ID input.

    const [userId, setUserId] = useState('');
    const [license, setLicense] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = () => apiClient.get('/transport/drivers').then(res => setDrivers(res.data));

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/transport/drivers', {
                user_id: userId, // In real app, search user. Here manual UUID for T1 is acceptable or name search if possible.
                license_number: license,
                phone
            });
            setUserId('');
            setLicense('');
            setPhone('');
            fetchDrivers();
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h3 className="font-bold mb-4 text-gray-800">Register Driver</h3>
                <p className="text-sm text-gray-500 mb-4">Link an existing system user as a Driver.</p>
                <form onSubmit={handleAdd} className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">User ID (UUID)</label>
                        <input className="w-full border p-2 rounded" placeholder="User UUID" value={userId} onChange={e => setUserId(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">License No</label>
                        <input className="w-full border p-2 rounded" placeholder="DL-XXXX" value={license} onChange={e => setLicense(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
                        <input className="w-full border p-2 rounded" placeholder="+91..." value={phone} onChange={e => setPhone(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Register Driver'}
                    </button>
                </form>
            </div>

            <div className="bg-white shadow rounded overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Driver Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">License / Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {drivers.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{d.user?.full_name || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500">{d.user?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-mono text-gray-700">{d.license_number}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Phone className="w-3 h-3" /> {d.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {d.status === 'ACTIVE' ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                                            <XCircle className="w-3 h-3" /> Inactive
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {drivers.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No drivers registered.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

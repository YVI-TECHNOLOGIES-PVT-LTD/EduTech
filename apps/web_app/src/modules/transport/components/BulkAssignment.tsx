import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search, CheckSquare, Square } from 'lucide-react';

export const BulkAssignment = () => {
    // Data
    const [students, setStudents] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterClass, setFilterClass] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [onlyUnassigned, setOnlyUnassigned] = useState(true);

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Assignment Form
    const [targetRouteId, setTargetRouteId] = useState('');
    const [targetStopId, setTargetStopId] = useState('');
    const [targetMode, setTargetMode] = useState('BOTH');

    useEffect(() => {
        Promise.all([
            apiClient.get('/students'), // Need raw list or pagination. Assuming raw list for T2 scale.
            apiClient.get('/transport/routes'),
            // Get existing assignments to filter "unassigned" client-side if not supported by API
            // Actually, for T2, let's assume we fetch basic student list which might not have transport status.
            // A clearer proper implementation would benefit from a backend "students with transport status" endpoint.
            // I'll stick to client side filtering for small scale.
        ]).then(([rStudents, rRoutes]) => {
            setStudents(rStudents.data);
            setRoutes(rRoutes.data);
            setLoading(false);
        });
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (filterClass && s.class_id !== filterClass) return false;
            // Unassigned check? API needs to return it. If API doesn't return transport assignment status for *all* students, we can't filter Unassigned easily here.
            // Phase T2 assumes "Searchable Table". I'll skip "Unassigned" strict filter for now unless I fetch all assignments.
            if (filterSearch) {
                const lower = filterSearch.toLowerCase();
                const matchName = s.full_name?.toLowerCase().includes(lower);
                const matchCode = s.student_code?.toLowerCase().includes(lower);
                if (!matchName && !matchCode) return false;
            }
            return true;
        });
    }, [students, filterClass, filterSearch]);

    const handleSelectAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkAssign = async () => {
        if (selectedIds.size === 0) return;
        if (!targetRouteId || !targetStopId) {
            alert("Please select Route and Stop");
            return;
        }

        if (!confirm(`Assign ${selectedIds.size} students to selected route?`)) return;

        try {
            await apiClient.post('/transport/assign/bulk', {
                student_ids: Array.from(selectedIds),
                route_id: targetRouteId,
                stop_id: targetStopId,
                pickup_mode: targetMode
            });
            alert("Bulk Assignment Successful!");
            setSelectedIds(new Set());
        } catch (err: any) {
            alert(err?.response?.data?.error || "Failed");
        }
    };

    // Derived
    const targetRoute = routes.find(r => r.id === targetRouteId);
    const stops = targetRoute?.transport_route_stops?.sort((a: any, b: any) => a.stop_order - b.stop_order) || [];

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* LEFT: Student List */}
            <div className="lg:col-span-2 bg-white rounded shadow flex flex-col border border-gray-100">
                <div className="p-4 border-b flex gap-4 items-center bg-gray-50 rounded-t">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            className="w-full pl-9 p-2 border rounded"
                            placeholder="Search Student Name or ID..."
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="min-w-full divide-y sticky top-0">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    <button onClick={handleSelectAll} className="text-gray-500">
                                        {selectedIds.size > 0 && selectedIds.size === filteredStudents.length ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Class</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredStudents.map(s => (
                                <tr key={s.id} className={selectedIds.has(s.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggleSelection(s.id)}>
                                            {selectedIds.has(s.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-900">{s.full_name}</div>
                                        <div className="text-xs text-gray-500">{s.student_code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{s.class_id || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-2 border-t text-xs text-gray-400 text-center">
                    Showing {filteredStudents.length} students
                </div>
            </div>

            {/* RIGHT: Assignment Action */}
            <div className="bg-white rounded shadow p-6 border border-gray-100 h-fit">
                <h3 className="font-bold text-lg mb-4">Bulk Assign</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100 text-center">
                        <div className="text-3xl font-black text-blue-600">{selectedIds.size}</div>
                        <div className="text-xs text-blue-500 font-bold uppercase">Students Selected</div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Target Route</label>
                        <select className="w-full border p-2 rounded" value={targetRouteId} onChange={e => setTargetRouteId(e.target.value)}>
                            <option value="">Select Route...</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.stats?.capacity - r.stats?.assigned} seats left)</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Target Stop</label>
                        <select className="w-full border p-2 rounded" value={targetStopId} onChange={e => setTargetStopId(e.target.value)} disabled={!targetRouteId}>
                            <option value="">Select Stop...</option>
                            {stops.map((s: any) => <option key={s.stop_id} value={s.stop_id}>{s.stop?.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Pickup Mode</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setTargetMode('BOTH')} className={`flex-1 py-2 text-xs font-bold rounded ${targetMode === 'BOTH' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>BOTH</button>
                            <button type="button" onClick={() => setTargetMode('PICKUP')} className={`flex-1 py-2 text-xs font-bold rounded ${targetMode === 'PICKUP' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>PICK</button>
                            <button type="button" onClick={() => setTargetMode('DROP')} className={`flex-1 py-2 text-xs font-bold rounded ${targetMode === 'DROP' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>DROP</button>
                        </div>
                    </div>

                    <button
                        onClick={handleBulkAssign}
                        disabled={selectedIds.size === 0 || !targetRouteId}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50 shadow-lg mt-4"
                    >
                        Assign Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search } from 'lucide-react';

export const StudentTransportAssignment = () => {
    const [routes, setRoutes] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    // Selection
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [currentAssignment, setCurrentAssignment] = useState<any>(null);

    // Form
    const [routeId, setRouteId] = useState('');
    const [stopId, setStopId] = useState('');
    const [pickupMode, setPickupMode] = useState('BOTH');

    useEffect(() => {
        Promise.all([
            apiClient.get('/transport/routes'),
            apiClient.get('/students') // Assumes this endpoint exists and returns array. If paginated, need adjustment.
        ]).then(([rRoutes, rStudents]) => {
            setRoutes(rRoutes.data);
            setStudents(rStudents.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lower = searchTerm.toLowerCase();
        return students.filter(s =>
            s.full_name?.toLowerCase().includes(lower) ||
            s.student_code?.toLowerCase().includes(lower)
        ).slice(0, 10); // Limit results
    }, [searchTerm, students]);

    const handleSelectStudent = async (student: any) => {
        setSelectedStudent(student);
        setSearchTerm(''); // Clear search to hide dropdown
        // Fetch current
        try {
            const res = await apiClient.get(`/transport/student/${student.id}`);
            if (res.data) {
                setCurrentAssignment(res.data);
                setRouteId(res.data.route_id || '');
                setStopId(res.data.stop_id || '');
                setPickupMode(res.data.pickup_mode || 'BOTH');
            } else {
                setCurrentAssignment(null);
                setRouteId('');
                setStopId('');
                setPickupMode('BOTH');
            }
        } catch { setCurrentAssignment(null); }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        try {
            await apiClient.post('/transport/assign', {
                student_id: selectedStudent.id,
                route_id: routeId,
                stop_id: stopId,
                pickup_mode: pickupMode
            });
            alert("Assignment Succesful");
            handleSelectStudent(selectedStudent); // Refresh
        } catch (err: any) { alert(err?.response?.data?.error || "Failed"); }
    };

    const selectedRouteObj = routes.find(r => r.id === routeId);
    const routeStops = selectedRouteObj?.transport_route_stops?.sort((a: any, b: any) => a.stop_order - b.stop_order) || [];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Assign Transport to Student</h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* 1. Student Search */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded shadow border border-gray-100 relative">
                        <h3 className="font-bold mb-4">Select Student</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                className="w-full border p-2 pl-9 rounded"
                                placeholder="Search Name or ID..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {filteredStudents.length > 0 && (
                            <div className="absolute left-0 right-0 bg-white border border-gray-200 mt-1 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                                {filteredStudents.map(s => (
                                    <div
                                        key={s.id}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                        onClick={() => handleSelectStudent(s)}
                                    >
                                        <div className="font-bold">{s.full_name}</div>
                                        <div className="text-xs text-gray-500">{s.student_code} • {s.class_id || 'No Class'}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedStudent && (
                            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
                                <p className="text-xs font-bold text-blue-500 uppercase">Selected Student</p>
                                <p className="font-black text-lg">{selectedStudent.full_name}</p>
                                <p className="text-sm">{selectedStudent.student_code}</p>
                            </div>
                        )}
                    </div>

                    {currentAssignment && (
                        <div className="bg-green-50 p-4 rounded border border-green-100">
                            <h4 className="font-bold text-green-800 text-sm mb-2">Current Assignment</h4>
                            <p><strong>Route:</strong> {currentAssignment.route?.name}</p>
                            <p><strong>Stop:</strong> {currentAssignment.stop?.name}</p>
                            <p><strong>Mode:</strong> {currentAssignment.pickup_mode}</p>
                        </div>
                    )}
                </div>

                {/* 2. Assignment Form */}
                <div className={`bg-white p-6 rounded shadow border border-gray-100 ${!selectedStudent ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="font-bold mb-4">Assignment Details</h3>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Route</label>
                            <select className="w-full border p-2 rounded" value={routeId} onChange={e => setRouteId(e.target.value)} required>
                                <option value="">Select Route...</option>
                                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Stop</label>
                            <select className="w-full border p-2 rounded" value={stopId} onChange={e => setStopId(e.target.value)} required disabled={!routeId}>
                                <option value="">Select Stop...</option>
                                {routeStops.map((rs: any) => (
                                    <option key={rs.stop_id} value={rs.stop_id}>
                                        {rs.stop?.name} ({rs.morning_time || '--'} / {rs.evening_time || '--'})
                                    </option>
                                ))}
                            </select>
                            {routeId && routeStops.length === 0 && <p className="text-xs text-red-500 mt-1">No stops defined for this route.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Mode</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="mode" value="BOTH" checked={pickupMode === 'BOTH'} onChange={e => setPickupMode(e.target.value)} /> Both
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="mode" value="PICKUP" checked={pickupMode === 'PICKUP'} onChange={e => setPickupMode(e.target.value)} /> Pickup Only
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="radio" name="mode" value="DROP" checked={pickupMode === 'DROP'} onChange={e => setPickupMode(e.target.value)} /> Drop Only
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 shadow-lg">
                            Confirm Assignment
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};


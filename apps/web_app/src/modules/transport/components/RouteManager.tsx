
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { ArrowUp, ArrowDown, Trash2, Printer, Bus, User, Lock, AlertTriangle } from 'lucide-react';
import { ManifestViewer } from './ManifestViewer'; // Will create next

interface RouteManagerProps {
    lockedRouteIds?: string[];
}

export const RouteManager = ({ lockedRouteIds = [] }: RouteManagerProps) => {
    const [routes, setRoutes] = useState<any[]>([]);
    const [stops, setStops] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [routeName, setRouteName] = useState('');

    // Manage Route Stops
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [routeStops, setRouteStops] = useState<any[]>([]);

    // Manage Vehicle Assignment
    const [assignVehicleId, setAssignVehicleId] = useState('');
    const [assignDriverId, setAssignDriverId] = useState('');

    const [showManifest, setShowManifest] = useState(false);

    useEffect(() => {
        fetchRoutes();
        fetchStops();
        fetchVehicles();
        fetchDrivers();
    }, []);

    const fetchRoutes = () => apiClient.get('/transport/routes').then(res => setRoutes(res.data));
    const fetchStops = () => apiClient.get('/transport/stops').then(res => setStops(res.data));
    const fetchVehicles = () => apiClient.get('/transport/vehicles').then(res => setVehicles(res.data));
    const fetchDrivers = () => apiClient.get('/transport/drivers').then(res => setDrivers(res.data));

    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/transport/routes', { name: routeName });
            setRouteName('');
            fetchRoutes();
        } catch (err) { alert("Failed"); }
    };

    const handleManageStops = (route: any) => {
        setSelectedRoute(route);
        // Load stops sorted
        const sorted = (route.transport_route_stops || []).sort((a: any, b: any) => a.stop_order - b.stop_order);
        setRouteStops(sorted);
        // Reset Vehicle Form
        setAssignVehicleId('');
        setAssignDriverId('');
        setShowManifest(false);
    };

    const addStopToRoute = () => {
        setRouteStops([...routeStops, { stop_id: '', stop_order: routeStops.length + 1, morning_time: '', evening_time: '' }]);
    };

    const updateRouteStop = (index: number, field: string, value: any) => {
        const newStops = [...routeStops];
        newStops[index] = { ...newStops[index], [field]: value };
        setRouteStops(newStops);
    };

    const moveStop = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === routeStops.length - 1) return;

        const newStops = [...routeStops];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];

        // Re-assign order based on NEW index
        const reordered = newStops.map((s, i) => ({ ...s, stop_order: i + 1 }));
        setRouteStops(reordered);
    };

    const removeRouteStop = (index: number) => {
        const newStops = routeStops.filter((_, i) => i !== index).map((s, i) => ({ ...s, stop_order: i + 1 }));
        setRouteStops(newStops);
    };

    const saveStops = async () => {
        if (!selectedRoute) return;
        try {
            await apiClient.post(`/transport/routes/${selectedRoute.id}/stops`, { stops: routeStops });
            alert("Stops Saved!");
            fetchRoutes(); // Refresh stats
        } catch (err: any) {
            // Graceful Error
            const msg = err?.response?.data?.error || "Failed saving stops";
            alert(msg);
            if (err?.response?.status === 409) {
                // Refresh routes likely
                fetchRoutes();
            }
        }
    };

    const handleAssignVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoute || !assignVehicleId) return;
        try {
            await apiClient.post(`/transport/routes/${selectedRoute.id}/assign-vehicle`, {
                vehicle_id: assignVehicleId,
                driver_id: assignDriverId || null
            });
            alert("Vehicle Assigned");
            fetchRoutes();
        } catch (err: any) { alert(err?.response?.data?.error || "Failed"); }
    };

    const isLocked = selectedRoute && lockedRouteIds.includes(selectedRoute.id);

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* List Routes */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-bold mb-2">Create Route</h3>
                    <form onSubmit={handleCreateRoute} className="flex gap-2">
                        <input className="border p-2 rounded flex-1" placeholder="Route Name" value={routeName} onChange={e => setRouteName(e.target.value)} required />
                        <button type="submit" className="bg-blue-600 text-white px-3 rounded">Add</button>
                    </form>
                </div>

                <div className="bg-white shadow rounded overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr><th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Route</th></tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {routes.map(r => {
                                const isRouteLocked = lockedRouteIds.includes(r.id);
                                return (
                                    <tr key={r.id} onClick={() => handleManageStops(r)} className={`cursor-pointer hover:bg-blue-50 ${selectedRoute?.id === r.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {r.name}
                                                    {isRouteLocked && <span title="Locked: Active Trip"><Lock className="w-3 h-3 text-amber-600" /></span>}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                                <span>{r.transport_route_stops?.length || 0} stops</span>
                                                <span className={`font-mono ${r.stats?.assigned > r.stats?.capacity ? 'text-red-600 font-bold' : ''}`}>
                                                    {r.stats?.assigned || 0}/{r.stats?.capacity || 0} Seats
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 h-1 mt-1 rounded overflow-hidden">
                                                <div className={`h-full ${r.stats?.assigned > r.stats?.capacity ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(r.stats?.utilization || 0, 100)}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Route */}
            <div className="lg:col-span-2 space-y-6">
                {selectedRoute ? (
                    <>
                        {isLocked && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-amber-800 text-sm">Security Lock Active</div>
                                        <div className="text-xs text-amber-700 mt-1">
                                            This route currently has a LIVE trip. Modifications are temporarily disabled to ensure student safety.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 1. Header & Actions */}
                        <div className="bg-white rounded shadow p-6 border border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Manage {selectedRoute.name}
                                    {isLocked && <Lock className="w-4 h-4 text-amber-600" />}
                                </h3>
                                <div className="text-sm text-gray-500">
                                    Assigned: {selectedRoute.stats?.assigned} • Capacity: {selectedRoute.stats?.capacity}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowManifest(true)} className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded hover:bg-black">
                                    <Printer className="w-4 h-4" /> Manifest
                                </button>
                                <button
                                    onClick={saveStops}
                                    disabled={isLocked}
                                    className={`px-4 py-2 rounded shadow transition-colors text-white ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isLocked ? 'Locked' : 'Save Stops'}
                                </button>
                            </div>
                        </div>

                        {/* 2. Vehicle Assignment */}
                        <div className={`bg-white rounded shadow p-6 border border-gray-100 ${isLocked ? 'opacity-70 pointer-events-none grayscale' : ''}`}>
                            <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Bus className="w-4 h-4" /> Fleet & Driver Assignment</h4>

                            {/* Existing Assignments */}
                            {selectedRoute.route_vehicles?.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {selectedRoute.route_vehicles.map((rv: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 bg-blue-50 p-2 rounded text-sm border border-blue-100">
                                            <div className="font-mono font-bold bg-white px-2 rounded border">{rv.vehicle?.vehicle_no}</div>
                                            <div className="text-gray-500">({rv.vehicle?.capacity} seats)</div>
                                            <div className="flex-1 text-right text-gray-700 flex items-center justify-end gap-1">
                                                <User className="w-3 h-3" /> {rv.driver?.user?.full_name || "No Driver"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleAssignVehicle} className="flex gap-2 items-end bg-gray-50 p-3 rounded">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Vehicle</label>
                                    <select disabled={isLocked} className="flex-1 w-full border p-2 rounded text-sm" value={assignVehicleId} onChange={e => setAssignVehicleId(e.target.value)} required>
                                        <option value="">Select Vehicle...</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_no} ({v.capacity})</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500">Driver (Optional)</label>
                                    <select disabled={isLocked} className="flex-1 w-full border p-2 rounded text-sm" value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)}>
                                        <option value="">Select Driver...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.full_name} ({d.status})</option>)}
                                    </select>
                                </div>
                                <button disabled={isLocked} type="submit" className="bg-blue-600 text-white px-3 py-2 rounded h-10 text-sm disabled:bg-gray-400">Add</button>
                            </form>
                        </div>

                        {/* 3. Stops Editor */}
                        <div className={`bg-white rounded shadow p-6 border border-gray-100 ${isLocked ? 'opacity-80' : ''}`}>
                            <h4 className="font-bold text-sm mb-4">Stops Sequence</h4>
                            <div className="space-y-2 mb-6">
                                {routeStops.map((rs, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                        <div className="flex flex-col gap-1 mr-2">
                                            <button type="button" disabled={isLocked || idx === 0} onClick={() => moveStop(idx, 'up')} className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                            <button type="button" disabled={isLocked || idx === routeStops.length - 1} onClick={() => moveStop(idx, 'down')} className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                        </div>
                                        <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full font-bold text-xs shrink-0">
                                            {idx + 1}
                                        </div>
                                        <select
                                            disabled={isLocked}
                                            className="flex-1 border p-1 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                            value={rs.stop_id}
                                            onChange={e => updateRouteStop(idx, 'stop_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Stop...</option>
                                            {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <input
                                            type="time"
                                            disabled={isLocked}
                                            className="border p-1 rounded w-24 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                            value={rs.morning_time || ''}
                                            onChange={e => updateRouteStop(idx, 'morning_time', e.target.value)}
                                            title="Pickup"
                                        />
                                        <input
                                            type="time"
                                            disabled={isLocked}
                                            className="border p-1 rounded w-24 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                            value={rs.evening_time || ''}
                                            onChange={e => updateRouteStop(idx, 'evening_time', e.target.value)}
                                            title="Drop"
                                        />
                                        <button disabled={isLocked} onClick={() => removeRouteStop(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded disabled:text-gray-300 disabled:hover:bg-transparent">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={isLocked}
                                onClick={addStopToRoute}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:hover:text-gray-500 disabled:hover:border-gray-300 disabled:cursor-not-allowed"
                            >
                                + Add Stop
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full bg-white rounded shadow text-gray-400 py-20">
                        Select a route to manage
                    </div>
                )}
            </div>

            {/* 4. Manifest Modal */}
            {showManifest && selectedRoute && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Driver Manifest Preview</h3>
                            <button onClick={() => setShowManifest(false)} className="text-gray-500 hover:text-gray-700">Close</button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            <ManifestViewer routeId={selectedRoute.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

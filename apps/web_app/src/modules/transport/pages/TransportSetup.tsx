import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { RouteManager } from '../components/RouteManager';
import { StopManager } from '../components/StopManager';
import { DriverManager } from '../components/DriverManager';

import { TransportFeeManager } from '../components/TransportFeeManager';
import { ExceptionManager } from '../components/ExceptionManager';
import { apiClient } from '../../../lib/api-client';
import { BarChart3, AlertOctagon, MapPin, Bus, User, Settings, Users, DollarSign } from 'lucide-react';

import { ImportWizard } from '../../../components/import/ImportWizard';
import { useAuth } from '../../../context/AuthContext';

export const TransportSetup = () => {
    const { user, hasPermission } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'routes' | 'stops' | 'drivers' | 'vehicles' | 'fees' | 'exceptions'>('routes');
    const [lockedRouteIds, setLockedRouteIds] = useState<string[]>([]);

    // Import Wizard State
    const [importOpen, setImportOpen] = useState(false);
    const [importEntity, setImportEntity] = useState<'VEHICLE' | 'DRIVER' | 'DRIVER_VEHICLE_MAP'>('VEHICLE');
    const [importTitle, setImportTitle] = useState('');

    const canImport = hasPermission('TRANSPORT_SETUP');

    const openImport = (entity: 'VEHICLE' | 'DRIVER' | 'DRIVER_VEHICLE_MAP', title: string) => {
        setImportEntity(entity);
        setImportTitle(title);
        setImportOpen(true);
    };

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        const validTabs = ['routes', 'stops', 'drivers', 'vehicles', 'fees', 'exceptions'];
        if (hash && validTabs.includes(hash)) {
            setActiveTab(hash as any);
        }

        const fetchLocks = async () => {
            try {
                const res = await apiClient.get('/transport/trips/live');
                const liveIds = res.data
                    .filter((t: any) => t.status === 'LIVE')
                    .map((t: any) => t.route_id);
                setLockedRouteIds(liveIds || []);
            } catch (e) { console.error("Failed to fetch locks", e); }
        };
        fetchLocks();
    }, [location.hash]);

    const headerInfo = {
        routes: { title: 'Manage Routes', sub: 'Configure transport routes and trip schedules.', icon: MapPin },
        stops: { title: 'Stops & Points', sub: 'Manage pickup and drop-off locations.', icon: Settings },
        drivers: { title: 'Driver Registry', sub: 'Manage bus drivers and licenses.', icon: User },
        vehicles: { title: 'Vehicle Fleet', sub: 'Manage buses and capacity.', icon: Bus },
        fees: { title: 'Transport Fees', sub: 'Configure distance-based fee slabs.', icon: DollarSign },
        exceptions: { title: 'Incident Command', sub: 'Manage emergencies and breakdowns.', icon: AlertOctagon },
    }[activeTab] || { title: 'Transport Operations', sub: 'Manage fleet operations.', icon: Bus };

    const { icon: HeaderIcon, title, sub } = headerInfo;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <ImportWizard
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                entityType={importEntity}
                title={importTitle}
            />

            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <HeaderIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
                        <p className="text-slate-500 font-medium">{sub}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* PHASE 2 BUTTONS */}
                    {canImport && activeTab === 'vehicles' && (
                        <button
                            onClick={() => openImport('VEHICLE', 'Vehicles')}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-200 font-bold transition-all shadow-sm"
                        >
                            Import Fleet
                        </button>
                    )}

                    {canImport && activeTab === 'drivers' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openImport('DRIVER_VEHICLE_MAP', 'Driver Assignments')}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 font-bold transition-all shadow-sm"
                            >
                                Bulk Assign
                            </button>
                            <button
                                onClick={() => openImport('DRIVER', 'Drivers')}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-200 font-bold transition-all shadow-sm"
                            >
                                Import Drivers
                            </button>
                        </div>
                    )}

                    {activeTab === 'routes' && (
                        <Link
                            to="/app/transport/analytics"
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all border border-gray-200"
                        >
                            <BarChart3 className="w-5 h-5" />
                            Operational Insights
                        </Link>
                    )}
                </div>
            </div>

            {/* SAFETY CONTEXT BANNER */}
            {lockedRouteIds.length > 0 && activeTab === 'routes' && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <AlertOctagon className="text-blue-600 w-5 h-5" />
                        <div>
                            <span className="text-blue-900 font-bold block text-sm">Active Fleet Operations Detected</span>
                            <span className="text-blue-700 text-xs">
                                {lockedRouteIds.length} route(s) are currently live. Configuration changes are temporarily restricted for safety.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[500px]">
                {activeTab === 'routes' && <RouteManager lockedRouteIds={lockedRouteIds} />}
                {activeTab === 'fees' && <TransportFeeManager />}
                {activeTab === 'stops' && <StopManager />}
                {activeTab === 'drivers' && <DriverManager />}
                {activeTab === 'vehicles' && <VehicleManager />}
                {activeTab === 'exceptions' && <ExceptionManager />}
            </div>
        </div>
    );

};

// Inline Vehicle Manager (Simplified for now)
const VehicleManager = () => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [formData, setFormData] = useState({ vehicle_no: '', capacity: '' });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        const { data } = await apiClient.get('/transport/vehicles');
        setVehicles(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await apiClient.post('/transport/vehicles', { ...formData, capacity: parseInt(formData.capacity) });
        setFormData({ vehicle_no: '', capacity: '' });
        fetchVehicles();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">Add Vehicle</h3>
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        className="border p-2 rounded flex-1"
                        placeholder="Vehicle No (e.g. KA-01-1234)"
                        value={formData.vehicle_no}
                        onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        className="border p-2 rounded w-32"
                        placeholder="Capacity"
                        value={formData.capacity}
                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                        required
                    />
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save</button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-bold">Vehicle No</th>
                            <th className="p-4 font-bold">Capacity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v.id} className="border-b">
                                <td className="p-4 font-medium">{v.vehicle_no}</td>
                                <td className="p-4">{v.capacity} Seats</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

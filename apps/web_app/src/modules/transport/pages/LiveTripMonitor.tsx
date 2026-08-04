import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Activity, Bus, MapPin, CheckCircle, Navigation, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { TransportMap } from '../components/map/TransportMap';
import { MapMarker } from '../components/map/types';

export const LiveTripMonitor = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');

    useEffect(() => {
        const fetch = () => {
            apiClient.get('/transport/trips/live').then(async (res) => {
                const updated = await Promise.all(res.data.map(async (t: any) => {
                    if (t.status === 'LIVE') {
                        try {
                            const loc = await apiClient.get(`/transport/trips/${t.id}/location`);
                            if (loc.data) return { ...t, location: loc.data };
                        } catch { }
                    }
                    return t;
                }));
                // Sort LIVE first
                updated.sort((a, b) => (a.status === 'LIVE' ? -1 : 1));
                setTrips(updated);
            });
        };
        fetch();
        const interval = setInterval(fetch, 10000);
        return () => clearInterval(interval);
    }, []);

    const mapMarkers = useMemo(() => {
        const markers: MapMarker[] = [];
        trips.forEach(t => {
            if (t.status === 'LIVE' && t.location) {
                markers.push({
                    id: t.id,
                    position: { latitude: t.location.latitude, longitude: t.location.longitude, heading: t.location.heading },
                    type: 'BUS',
                    title: t.route?.name || 'Bus',
                    description: `Driver: ${t.driver?.user?.full_name}`
                });
            }
        });
        return markers;
    }, [trips]);

    // Calculate center based on average of bounds? Or just first bus?
    // If no buses, default.
    const mapCenter = mapMarkers.length > 0 ? mapMarkers[0].position : undefined;

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black flex items-center gap-2">
                    <Activity className="text-green-600" /> Live Trip Monitor
                </h1>

                <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                    <button
                        onClick={() => setViewMode('GRID')}
                        className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-bold ${viewMode === 'GRID' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
                    >
                        <LayoutGrid size={16} /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('MAP')}
                        className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-bold ${viewMode === 'MAP' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
                    >
                        <MapIcon size={16} /> Map
                    </button>
                </div>
            </div>

            {viewMode === 'GRID' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
                    {trips.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-xl shadow border border-dashed border-gray-300 text-center text-gray-400">
                            No active trips found today.
                        </div>
                    )}

                    {trips.map(t => (
                        <div key={t.id} className={`bg-white rounded-xl shadow border-l-4 p-5 ${t.status === 'LIVE' ? 'border-green-500' : 'border-gray-300'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{t.route?.name}</h3>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <Bus className="w-3 h-3" /> {t.vehicle?.vehicle_no}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'LIVE' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                    {t.status}
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Driver</span>
                                    <span className="font-medium">{t.driver?.user?.full_name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Started At</span>
                                    <span className="font-mono">{t.started_at ? new Date(t.started_at).toLocaleTimeString() : '-'}</span>
                                </div>

                                {t.location && (
                                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 font-mono mt-2 flex justify-between items-center">
                                        <span>{t.location.latitude?.toFixed(4)}, {t.location.longitude?.toFixed(4)}</span>
                                        <span className="text-xxs text-blue-400">{new Date(t.location.recorded_at).toLocaleTimeString()}</span>
                                    </div>
                                )}
                            </div>

                            {t.status === 'LIVE' && t.location && (
                                <div className="mt-4 pt-4 border-t flex justify-center">
                                    <button
                                        onClick={() => setViewMode('MAP')}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-green-700 shadow-sm"
                                    >
                                        <Navigation className="w-3 h-3" /> Track on Map
                                    </button>
                                </div>
                            )}

                            {t.status === 'LIVE' && !t.location && (
                                <div className="mt-4 pt-4 border-t flex justify-center text-xs text-gray-400 italic">
                                    Waiting for GPS signal...
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {viewMode === 'MAP' && (
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
                    <TransportMap
                        center={mapCenter}
                        zoom={13}
                        markers={mapMarkers}
                        className="w-full h-full"
                    />

                    {mapMarkers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-[1000] pointer-events-none">
                            <div className="text-gray-500 font-medium">No live buses to display</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

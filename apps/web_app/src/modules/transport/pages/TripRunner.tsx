import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { MapPin, Navigation, UserCheck, UserMinus, List, Map as MapIcon, X } from 'lucide-react';
import { TransportMap } from '../components/map/TransportMap';
import { MapMarker } from '../components/map/types';

export const TripRunner = ({ tripId, onComplete }: { tripId: string, onComplete: () => void }) => {
    const [stops, setStops] = useState<any[]>([]);
    const [currentStopIndex, setCurrentStopIndex] = useState(0);
    const [pathPoints, setPathPoints] = useState<any[]>([]);
    const [gpsActive, setGpsActive] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number, heading?: number } | null>(null);
    const [showManifest, setShowManifest] = useState(false);

    // Initial Load
    useEffect(() => {
        apiClient.get('/transport/trips/today').then(res => {
            const t = res.data.find((x: any) => x.trip?.id === tripId || x.schedule?.id === tripId);
            if (t) {
                const routeId = t.trip?.route_id || t.schedule.route_id;

                // Fetch Manifest (Stops & Students)
                apiClient.get(`/transport/routes/${routeId}/manifest`).then(m => {
                    setStops(m.data.stops || []);
                });

                // Fetch Route Path for Polyline
                apiClient.get(`/transport/routes/${routeId}`).then(r => {
                    if (r.data.path_points) setPathPoints(r.data.path_points);
                }).catch(() => { });
            }
        });
    }, [tripId]);

    // Live Tracking (Phase T5)
    useEffect(() => {
        if (!navigator.geolocation) return;

        // Start Tracking
        setGpsActive(true);
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                // Update Local State for Map
                setCurrentLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: pos.coords.heading || 0
                });

                // Send Ping
                apiClient.post(`/transport/trips/${tripId}/location`, {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    heading: pos.coords.heading
                }).catch(e => console.error("GPS Ping Failed", e));
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [tripId]);


    // Event Logic
    const handleEvent = async (type: string, payload: any = {}) => {
        // Get One-Time Location for Event Log
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await apiClient.post(`/transport/trips/${tripId}/event`, {
                        event_type: type,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        ...payload
                    });
                    if (navigator.vibrate) navigator.vibrate(50);
                } catch (e) { console.error(e); alert("Sync Failed"); }
            },
            (err) => alert("GPS Required for Event Logging")
        );
    };

    const handleStopReached = async (stop: any) => {
        if (!confirm(`Reached ${stop.stop?.name}?`)) return;
        await handleEvent('STOP_REACHED', { stop_id: stop.stop_id });
        setCurrentStopIndex(prev => Math.min(prev + 1, stops.length - 1));
    };

    const handleStudentAction = async (studentId: string, action: 'BOARDED' | 'DROPPED') => {
        await handleEvent(action === 'BOARDED' ? 'STUDENT_BOARDED' : 'STUDENT_DROPPED', { student_id: studentId });
        // Optimistic UI update
        const el = document.getElementById(`stu-${studentId}`);
        if (el) el.style.opacity = '0.5';
    };

    const handleEndTrip = async () => {
        if (!confirm("END TRIP? This cannot be undone.")) return;
        await handleEvent('TRIP_COMPLETED');
        onComplete();
    };

    const mapMarkers = useMemo(() => {
        const m: MapMarker[] = [];

        // Bus Marker (Self)
        if (currentLocation) {
            m.push({
                id: 'my-bus',
                position: currentLocation,
                type: 'BUS',
                title: 'My Bus'
            });
        }

        // Stops
        stops.forEach((s, i) => {
            if (s.stop?.latitude && s.stop?.longitude) {
                m.push({
                    id: s.stop_id,
                    position: { latitude: parseFloat(s.stop.latitude), longitude: parseFloat(s.stop.longitude) },
                    type: 'STOP',
                    title: `${i + 1}. ${s.stop.name}`,
                    description: s.morning_time
                });
            }
        });

        return m;
    }, [currentLocation, stops]);

    const mapPaths = useMemo(() => {
        if (!pathPoints.length) return [];
        return [{
            points: pathPoints,
            color: '#3B82F6' // Blue-500
        }];
    }, [pathPoints]);

    if (!stops.length) return <div className="p-10 text-center text-white">Loading Trip Data...</div>;

    const currentStop = stops[currentStopIndex];

    return (
        <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-gray-900">
            {/* 1. FULL SCREEN MAP */}
            <div className="absolute inset-0 z-0">
                <TransportMap
                    center={currentLocation || undefined}
                    zoom={16}
                    markers={mapMarkers}
                    paths={mapPaths}
                    className="h-full w-full"
                />
            </div>

            {/* 2. TOP HUD (Date/Time & GPS Status) */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold pointer-events-auto">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${gpsActive ? 'bg-green-500/90 text-white border-green-400' : 'bg-red-500/90 text-white border-red-400'} shadow-lg pointer-events-auto`}>
                    {gpsActive ? 'GPS ONLINE' : 'GPS SEEKING'}
                </div>
            </div>

            {/* 3. FLOATING ONSCREEN CONTROLS */}
            <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col gap-4">

                {/* A. NEXT STOP CARD */}
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full">
                                {currentStopIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Next Stop</span>
                        </div>
                        <h2 className="text-lg font-black text-gray-900 truncate leading-tight">
                            {currentStop?.stop?.name}
                        </h2>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {currentStop?.morning_time || '--:--'} • {currentStop?.students?.length || 0} Students
                        </div>
                    </div>

                    <button
                        onClick={() => handleStopReached(currentStop)}
                        className="bg-blue-600 active:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95 shrink-0"
                    >
                        <Navigation className="w-6 h-6" />
                    </button>
                </div>

                {/* B. ACTION BAR */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowManifest(true)}
                        className="flex-1 bg-gray-900/90 backdrop-blur text-white py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <List className="w-4 h-4" /> Manifest
                    </button>

                    <button
                        onClick={handleEndTrip}
                        className="flex-1 bg-red-600/90 backdrop-blur text-white py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        End Trip
                    </button>
                </div>
            </div>

            {/* 4. MANIFEST DRAWER/MODAL */}
            {showManifest && (
                <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center">
                    <div className="bg-white w-full h-[80%] sm:h-[600px] sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">Student Manifest</h3>
                            <button onClick={() => setShowManifest(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Current Stop Highlight */}
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4">
                                <div className="text-xs font-bold text-blue-600 uppercase mb-1">Current Stop</div>
                                <div className="font-bold text-lg">{currentStop?.stop?.name}</div>
                            </div>

                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Students at this stop</h4>

                            {currentStop?.students?.length === 0 ? (
                                <div className="text-center text-gray-400 py-4 italic">No students assigned here.</div>
                            ) : (
                                <div className="space-y-3">
                                    {currentStop?.students?.map((s: any) => (
                                        <div id={`stu-${s.student.id}`} key={s.student.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-gray-900">{s.student.full_name}</div>
                                                <div className="text-xs text-gray-400">{s.student.student_code}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleStudentAction(s.student.id, 'BOARDED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100">
                                                    <UserCheck className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleStudentAction(s.student.id, 'DROPPED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100">
                                                    <UserMinus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Show upcoming stops summary maybe? */}
                            <div className="mt-8 pt-8 border-t border-dashed">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">All Stops</h4>
                                {stops.map((s, i) => (
                                    <div key={s.stop_id} className={`py-2 flex items-center gap-3 ${i === currentStopIndex ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                        <span className="text-xs w-4">{i + 1}</span>
                                        <span className="text-sm truncate">{s.stop.name}</span>
                                        {i === currentStopIndex && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded uppercase">Current</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Clock, MapPin, Bus, CheckCircle, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransportMap } from '../components/map/TransportMap';
import { MapMarker } from '../components/map/types';

export const MyTransport = () => {
    const [infos, setInfos] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [activeTrips, setActiveTrips] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [viewingMap, setViewingMap] = useState<{ location: any, stop: any } | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [infoRes, timelineRes] = await Promise.all([
                    apiClient.get('/transport/my'),
                    apiClient.get('/transport/my/timeline')
                ]);
                setInfos(infoRes.data);
                setTimeline(timelineRes.data);

                infoRes.data.forEach((info: any) => {
                    const todayTrip = timelineRes.data.find((e: any) => e.student_id === info.student.id && e.event_type === 'TRIP_STARTED');
                    if (todayTrip) {
                        pollLocation(todayTrip.trip_id);
                    }
                });

            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
        const interval = setInterval(() => apiClient.get('/transport/my/timeline').then(res => setTimeline(res.data)), 15000);
        return () => clearInterval(interval);
    }, []);

    const pollLocation = async (tripId: string) => {
        try {
            const res = await apiClient.get(`/transport/trips/${tripId}/location`);
            if (res.data && res.data.latitude) {
                setActiveTrips(prev => ({ ...prev, [tripId]: res.data }));
            } else {
                setActiveTrips(prev => ({ ...prev, [tripId]: null }));
            }
        } catch { }
    };

    // Periodic Poll for Active Trips
    useEffect(() => {
        const interval = setInterval(() => {
            Object.keys(activeTrips).forEach(tid => {
                if (activeTrips[tid]) pollLocation(tid);
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [activeTrips]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading transport details...</div>;

    const getMapMarkers = (): MapMarker[] => {
        if (!viewingMap) return [];
        const m: MapMarker[] = [];

        // Bus
        if (viewingMap.location) {
            m.push({
                id: 'bus',
                position: viewingMap.location,
                type: 'BUS',
                title: 'School Bus'
            });
        }
        return m;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Assignment Details */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-black mb-4">My Transport</h2>
                {infos.map((info, i) => {
                    const activeTripEvent = timeline.find(e => e.student_id === info.student.id && new Date(e.timestamp).toDateString() === new Date().toDateString());
                    const tripId = activeTripEvent?.trip_id;
                    const location = tripId ? activeTrips[tripId] : null;

                    return (
                        <div key={i} className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center gap-4 mb-6 cursor-pointer">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                                    {info.student.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{info.student.full_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase ${info.has_assignment ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                            {info.has_assignment ? 'Active' : 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>


                            {info.has_assignment && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl">
                                        <div className="text-xxs font-bold text-indigo-400 uppercase mb-1">Route</div>
                                        <div className="font-bold text-indigo-900">{info.route_name}</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <div className="text-xxs font-bold text-blue-400 uppercase mb-1">Stop</div>
                                        <div className="font-bold text-blue-900">{info.stop_name}</div>
                                    </div>

                                    {/* TRANSPORT ATTENDANCE CONTROL */}
                                    <div className="col-span-2 bg-amber-50 rounded-xl p-4 border border-amber-100 mt-2">
                                        <h4 className="font-bold text-amber-900 mb-2 flex items-center justify-between">
                                            <span>Transport for Today</span>
                                            <div className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </h4>
                                        <TransportAttendanceControl
                                            studentId={info.student.id}
                                            studentName={info.student.full_name}
                                        />
                                    </div>

                                    {location && (
                                        <div className="col-span-2 bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center animate-pulse mt-2">
                                            <div>
                                                <div className="text-xxs font-bold text-green-600 uppercase mb-1 flex items-center gap-1">
                                                    <Navigation className="w-3 h-3" /> Live Tracking
                                                </div>
                                                <button
                                                    onClick={() => setViewingMap({ location, stop: info })}
                                                    className="text-sm font-black underline text-green-800"
                                                >
                                                    Track Bus
                                                </button>
                                            </div>
                                            <div className="text-xs text-green-600 font-mono">
                                                Updated {new Date(location.recorded_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    )}

                                    {!location && (
                                        <div className="col-span-2 bg-gray-50 p-4 rounded-xl flex justify-between items-center mt-2">
                                            <div>
                                                <div className="text-xxs font-bold text-gray-400 uppercase mb-1">Vehicle</div>
                                                <div className="font-mono font-bold text-gray-700">{info.vehicle_no}</div>
                                            </div>
                                            <Bus className="text-gray-300 w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* RIGHT: Timeline Feed */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" /> Live Updates
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Real-time transport activity</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {timeline.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 text-sm">
                                No recent activity.
                            </div>
                        ) : timeline.map((event, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-gray-100 last:border-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${event.event_type === 'TRIP_STARTED' ? 'bg-blue-500' :
                                    event.event_type === 'STUDENT_DROPPED' ? 'bg-green-500' :
                                        'bg-gray-400'
                                    }`}></div>
                                <div className="mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="font-medium text-gray-800 text-sm mb-1">
                                    {event.message}
                                </div>
                                {event.stop_name && (
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {event.stop_name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={!!viewingMap} onOpenChange={(open) => !open && setViewingMap(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-gray-100">
                    <DialogHeader className="p-4 bg-white border-b z-10">
                        <DialogTitle>Live Bus Tracking</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 relative">
                        {viewingMap && (
                            <TransportMap
                                center={viewingMap.location}
                                zoom={15}
                                markers={getMapMarkers()}
                                className="h-full w-full"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

// Sub-component for Transport Attendance Control
const TransportAttendanceControl = ({ studentId, studentName }: { studentId: string, studentName: string }) => {
    const [status, setStatus] = useState<{ pickupDisabled: boolean, dropDisabled: boolean, submitted: boolean }>({
        pickupDisabled: false,
        dropDisabled: false,
        submitted: false
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!status.pickupDisabled && !status.dropDisabled) return; // Nothing to submit if both active
        if (!confirm(`Mark ${studentName} as NOT using transport today?`)) return;

        setLoading(true);
        try {
            await apiClient.post('/transport/attendance/disable', {
                student_id: studentId,
                pickup_disabled: status.pickupDisabled,
                drop_disabled: status.dropDisabled,
                date: new Date().toISOString().split('T')[0] // today YYYY-MM-DD
            });
            setStatus(prev => ({ ...prev, submitted: true }));
        } catch (err: any) {
            alert("Failed to update: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (status.submitted) {
        return (
            <div className="bg-amber-100 text-amber-800 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Update Saved: {status.pickupDisabled ? 'No Pickup' : ''} {status.pickupDisabled && status.dropDisabled ? '&' : ''} {status.dropDisabled ? 'No Drop' : ''}</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex gap-4 mb-3">
                <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${status.pickupDisabled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold uppercase ${status.pickupDisabled ? 'text-red-700' : 'text-gray-500'}`}>Current Status</span>
                        <input
                            type="checkbox"
                            className="accent-red-500 w-4 h-4"
                            checked={status.pickupDisabled}
                            onChange={e => setStatus(prev => ({ ...prev, pickupDisabled: e.target.checked }))}
                        />
                    </div>
                    <div className={`font-bold ${status.pickupDisabled ? 'text-red-900' : 'text-gray-700'}`}>
                        {status.pickupDisabled ? '🚫 No Pickup' : '✅ Pickup Active'}
                    </div>
                </label>

                <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${status.dropDisabled ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold uppercase ${status.dropDisabled ? 'text-red-700' : 'text-gray-500'}`}>Current Status</span>
                        <input
                            type="checkbox"
                            className="accent-red-500 w-4 h-4"
                            checked={status.dropDisabled}
                            onChange={e => setStatus(prev => ({ ...prev, dropDisabled: e.target.checked }))}
                        />
                    </div>
                    <div className={`font-bold ${status.dropDisabled ? 'text-red-900' : 'text-gray-700'}`}>
                        {status.dropDisabled ? '🚫 No Drop' : '✅ Drop Active'}
                    </div>
                </label>
            </div>

            {(status.pickupDisabled || status.dropDisabled) && (
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm"
                >
                    {loading ? 'Saving...' : 'Confirm Changes for Today'}
                </button>
            )}

            <p className="text-xxs text-gray-400 mt-2 text-center">
                Checking "No Pickup/Drop" only affects transport, not school attendance.
            </p>
        </div>
    );
};

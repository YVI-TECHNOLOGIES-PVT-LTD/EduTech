import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Bus, CheckCircle, Clock, ClipboardCheck, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { TripRunner } from './TripRunner';

// Helper to generate Session ID safely without external deps
const generateSessionId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const DriverDashboard = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Checklist State
    const [showChecklist, setShowChecklist] = useState(false);
    const [pendingSchedule, setPendingSchedule] = useState<any>(null);
    const [checklistData, setChecklistData] = useState({
        fuel_level: 'FULL',
        tyres_ok: false,
        brakes_ok: false,
        lights_ok: false,
        cleanliness_ok: false,
        remarks: ''
    });
    const [isSubmittingCheck, setIsSubmittingCheck] = useState(false);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = () => {
        setLoading(true);
        apiClient.get('/transport/trips/today')
            .then(res => {
                setTrips(res.data);
                const live = res.data.find((t: any) => t.status === 'LIVE' || (t.trip?.status === 'LIVE'));
                if (live) setActiveTrip(live.trip || live.schedule);
                else setActiveTrip(null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const initiateTripStart = (schedule: any, type: string) => {
        // Generate a fresh session ID for this specific trip attempt
        const sessionId = generateSessionId();
        setPendingSchedule({ schedule, type, trip_identifier_id: sessionId });
        setShowChecklist(true); // Always suggest checklist first for safety
    };

    const handleChecklistSubmit = async () => {
        if (!pendingSchedule) return;
        setIsSubmittingCheck(true);
        try {
            // 1. Submit Checklist
            await apiClient.post('/transport/trips/check', {
                ...checklistData,
                vehicle_id: pendingSchedule.schedule.vehicle_id,
                trip_identifier_id: pendingSchedule.trip_identifier_id
            });

            // 2. Start Trip with ID
            await executeTripStart(pendingSchedule.trip_identifier_id);
            setShowChecklist(false);
        } catch (err: any) {
            alert("Failed to confirm safety check: " + (err?.response?.data?.error || err.message));
        } finally {
            setIsSubmittingCheck(false);
        }
    };

    const executeTripStart = async (identifierId?: string) => {
        if (!pendingSchedule) return;
        try {
            await apiClient.post('/transport/trips/start', {
                route_id: pendingSchedule.schedule.route_id,
                vehicle_id: pendingSchedule.schedule.vehicle_id,
                trip_type: pendingSchedule.type,
                trip_identifier_id: identifierId // Pass the ID linked to the checklist
            });
            alert("Trip Started Safely!");
            fetchTrips();
        } catch (err: any) {
            // If backend demands checklist and we somehow skipped it (Fail-safe)
            if (err?.response?.data?.code === 'CHECKLIST_REQUIRED') {
                setShowChecklist(true); // Re-open modal
            } else {
                alert(err?.response?.data?.error || "Failed to start trip");
            }
        }
    };

    if (activeTrip) {
        return <TripRunner tripId={activeTrip.id || activeTrip} onComplete={fetchTrips} />;
    }

    // Derived State for UI
    const isChecklistDone = trips.some(t => t.status === 'LIVE' || t.status === 'COMPLETED');
    const assignedVehicle = trips[0]?.schedule?.vehicle;
    const nextTrip = trips.find(t => t.status !== 'COMPLETED' && t.status !== 'LIVE');

    // Format Date
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let statusTitle = "My Trips Console";
    let statusSubtitle = "Welcome back.";
    let statusColor = "bg-blue-600";
    let StatusIcon = ShieldCheck;

    if (loading) {
        statusSubtitle = "Syncing schedule...";
        statusColor = "bg-gray-600";
    } else if (trips.length === 0) {
        statusSubtitle = "No trips assigned today";
        statusColor = "bg-slate-600";
    } else if (activeTrip) {
        statusSubtitle = "Trip in Progress - Drive Safely";
        statusColor = "bg-green-600 animate-pulse";
    } else if (!isChecklistDone) {
        statusSubtitle = "Action Required: Complete Checklist";
        statusColor = "bg-amber-600";
        StatusIcon = AlertTriangle;
    } else {
        const count = trips.filter(t => t.status !== 'COMPLETED').length;
        statusSubtitle = count > 0 ? `${count} Upcoming Trip${count > 1 ? 's' : ''}` : "All trips completed";
        statusColor = count > 0 ? "bg-blue-600" : "bg-green-600";
    }

    return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen p-4 pb-24">
            {/* 1. TOP STATUS CARD */}
            <div className={`${statusColor} text-white p-6 rounded-2xl shadow-lg mb-6 transition-all duration-300`}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs uppercase font-bold opacity-75 mb-1 tracking-wide">{todayStr}</div>
                        <h1 className="text-2xl font-black mb-1">{statusTitle}</h1>
                        <p className="opacity-95 font-medium flex items-center gap-2 text-sm sm:text-base">
                            {statusSubtitle}
                        </p>
                    </div>
                    <StatusIcon className="w-8 h-8 opacity-50" />
                </div>
            </div>

            {/* 2. SAFETY READINESS SECTION */}
            {!loading && trips.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Daily Safety Readiness</h2>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Bus className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold">Vehicle Assigned</div>
                                <div className="font-bold text-gray-900">{assignedVehicle?.vehicle_no || "Pending"}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 font-bold mb-1">Checklist</div>
                            {isChecklistDone ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-black text-sm">
                                    <CheckCircle className="w-4 h-4" /> Passed
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-black text-sm">
                                    <AlertTriangle className="w-4 h-4" /> Pending
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => nextTrip && initiateTripStart(nextTrip.schedule, nextTrip.type)}
                        disabled={isChecklistDone || !nextTrip}
                        className={`w-full py-3 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95
                            ${isChecklistDone || !nextTrip
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isChecklistDone ? (
                            <>
                                <CheckCircle className="w-5 h-5" /> Safety Checklist Completed
                            </>
                        ) : (
                            <>
                                <ClipboardCheck className="w-5 h-5" /> Complete Safety Checklist
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* 3. TODAY'S TRIPS SECTION */}
            <h2 className="font-bold text-gray-700 mb-4 px-2">Today's Schedule</h2>

            {loading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading schedule...</div>
            ) : trips.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow text-center text-gray-400">
                    <Bus className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="font-bold text-gray-900 mb-1">You are on standby today.</p>
                    <p className="text-sm">Please remain available for any ad-hoc assignments.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trips.map((item: any, idx: number) => {
                        const StatusIcon = item.status === 'COMPLETED' ? CheckCircle : Clock;
                        return (
                            <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border ${item.status === 'COMPLETED' ? 'border-green-100 opacity-75' : 'border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className={`px-2 py-1 text-xs font-bold rounded w-fit mb-2 ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-700'}`}>
                                            {item.type} {item.status === 'COMPLETED' && '✓'}
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900">{item.schedule.route?.name}</h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-1">
                                            <Bus className="w-3 h-3" /> {item.schedule.vehicle?.vehicle_no}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-gray-200">
                                            {item.schedule.route?.transport_route_stops?.length || 0}
                                        </div>
                                        <div className="text-xxs font-bold text-gray-400 uppercase">Stops</div>
                                    </div>
                                </div>

                                {item.status === 'LIVE' ? (
                                    <button onClick={() => fetchTrips()} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 animate-pulse">
                                        Resume Trip
                                    </button>
                                ) : item.status !== 'COMPLETED' && (
                                    <button
                                        onClick={() => initiateTripStart(item.schedule, item.type)}
                                        disabled={loading} // Keep disabled if loading
                                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg shadow hover:bg-black flex items-center justify-center gap-3 transition-colors"
                                    >
                                        Start Trip
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* SAFETY CHECKLIST MODAL */}
            {showChecklist && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <ClipboardCheck className="w-6 h-6 text-blue-600" /> Safety Check
                            </h3>
                            <button
                                onClick={() => setShowChecklist(false)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <label className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-200 transition-colors cursor-pointer">
                                <span className="font-bold text-gray-700">Tyres Condition</span>
                                <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={checklistData.tyres_ok}
                                    onChange={e => setChecklistData({ ...checklistData, tyres_ok: e.target.checked })}
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-200 transition-colors cursor-pointer">
                                <span className="font-bold text-gray-700">Brakes & Steering</span>
                                <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={checklistData.brakes_ok}
                                    onChange={e => setChecklistData({ ...checklistData, brakes_ok: e.target.checked })}
                                />
                            </label>
                            <label className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-200 transition-colors cursor-pointer">
                                <span className="font-bold text-gray-700">Lights & Signals</span>
                                <input type="checkbox" className="w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={checklistData.lights_ok}
                                    onChange={e => setChecklistData({ ...checklistData, lights_ok: e.target.checked })}
                                />
                            </label>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fuel Level</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['FULL', 'HALF', 'LOW', 'RESERVE'].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setChecklistData({ ...checklistData, fuel_level: lvl })}
                                            className={`py-2 text-xs font-bold rounded-lg border ${checklistData.fuel_level === lvl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleChecklistSubmit}
                            disabled={!checklistData.tyres_ok || !checklistData.brakes_ok || isSubmittingCheck}
                            className="w-full py-4 bg-green-600 text-white text-lg font-black rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmittingCheck ? 'Verifying...' : 'Confirm & Start Trip'}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4 font-medium">By confirming, you certify the vehicle is safe.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

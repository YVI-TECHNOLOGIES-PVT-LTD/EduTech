import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    AlertOctagon,
    MessageSquare,
    Bus,
    User,
    Send,
    AlertCircle,
    Info
} from 'lucide-react';
import { toast } from 'sonner';

export const ExceptionManager = () => {
    const [liveTrips, setLiveTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<string>('');
    const [exceptionType, setExceptionType] = useState<string>('TRIP_DELAYED');
    const [message, setMessage] = useState<string>('');
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [subVehicle, setSubVehicle] = useState<string>('');
    const [subDriver, setSubDriver] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tripsRes, vehRes, drvRes] = await Promise.all([
                apiClient.get('/transport/trips/live'),
                apiClient.get('/transport/vehicles'),
                apiClient.get('/transport/drivers')
            ]);
            setLiveTrips(tripsRes.data.filter((t: any) => t.status === 'LIVE' || t.status === 'SCHEDULED'));
            setVehicles(vehRes.data);
            setDrivers(drvRes.data);
        } catch (err) {
            toast.error("Failed to load operational data");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !message) return toast.error("Please select a trip and enter a message");

        setLoading(true);
        try {
            await apiClient.post(`/transport/trips/${selectedTrip}/exception`, {
                event_type: exceptionType,
                message,
                new_vehicle_id: subVehicle || undefined,
                new_driver_id: subDriver || undefined
            });
            toast.success("Exception logged and parents notified");
            setMessage('');
            setSubVehicle('');
            setSubDriver('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to trigger exception");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[32px] border border-rose-100 shadow-xl shadow-rose-500/5 p-8">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8">
                        <AlertOctagon className="text-rose-600" /> Crisis Command Center
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Trip Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Affected Trip</label>
                                <select
                                    className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                    value={selectedTrip}
                                    onChange={(e) => setSelectedTrip(e.target.value)}
                                    required
                                >
                                    <option value="">Select active trip...</option>
                                    {liveTrips.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.route?.name} - {t.vehicle?.vehicle_no} ({t.trip_type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Exception Type */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Issue Type</label>
                                <select
                                    className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                    value={exceptionType}
                                    onChange={(e) => setExceptionType(e.target.value)}
                                >
                                    <option value="TRIP_DELAYED">🚌 Trip Delayed (Traffic/Weather)</option>
                                    <option value="VEHICLE_BREAKDOWN">🔧 Vehicle Breakdown</option>
                                    <option value="ROUTE_MODIFIED">🗺️ Route Modified</option>
                                    <option value="DRIVER_CHANGED">👤 Driver Changed</option>
                                </select>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                                Parent Notification Text
                                <span className="text-rose-500 font-bold italic">Sent immediately via Mobile/Email</span>
                            </label>
                            <textarea
                                className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 font-medium text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all outline-none min-h-[120px]"
                                placeholder="e.g. Bus is delayed by 15 mins due to heavy rainfall. We are monitoring live."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        {/* Substitutions (Optional) */}
                        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-4 h-4" /> Operational Adjustments (Optional)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Bus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        className="w-full bg-white border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={subVehicle}
                                        onChange={(e) => setSubVehicle(e.target.value)}
                                    >
                                        <option value="">Assign Sub Vehicle...</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_no}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        className="w-full bg-white border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={subDriver}
                                        onChange={(e) => setSubDriver(e.target.value)}
                                    >
                                        <option value="">Assign Sub Driver...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${loading ? 'bg-slate-100 text-slate-400' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 hover:-translate-y-1 active:scale-95'}`}
                        >
                            {loading ? 'Processing Incident...' : <><Send className="w-5 h-5" /> Broadcast Emergency Alert</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Safety Guidelines */}
            <div className="space-y-6">
                <div className="bg-amber-50 rounded-[32px] border border-amber-100 p-8">
                    <h4 className="text-amber-800 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Safety Protocols
                    </h4>
                    <ul className="space-y-4 text-sm font-medium text-amber-900/70">
                        <li className="flex gap-3">
                            <span className="shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                            Be calm and factual. Avoid words that induce panic (e.g. 'Accident' unless confirmed).
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                            Do not provide specific ETA unless GPS confirmation is manually verified.
                        </li>
                        <li className="flex gap-3">
                            <span className="shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                            Substitutions will update the live tracking dashboard for parents automatically.
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-900 rounded-[32px] p-8 text-white">
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-4">System Audit</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        Every exception logged here creates a non-deletable audit event.
                        Resolving incidents requires manual administrative closure in the Trip Ledger.
                    </p>
                </div>
            </div>
        </div>
    );
};

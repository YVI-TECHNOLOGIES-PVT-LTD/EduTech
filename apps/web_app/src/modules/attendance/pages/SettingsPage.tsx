import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Save, Settings, ShieldAlert, Award } from 'lucide-react';

export function SettingsPage() {
    const [minRate, setMinRate] = useState(75);
    const [lateTime, setLateTime] = useState('08:30 AM');
    const [biometricHour, setBiometricHour] = useState('02:00 PM');

    const handleSave = () => {
        alert('AMS configurations saved successfully!');
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Attendance Module Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure threshold percentages, late checkin timings, and biometric rules.</p>
                </div>
                <Button onClick={handleSave} className="bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Save className="w-4 h-4" /> Save AMS Rules
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-primary" /> Core Threshold Policies
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Minimum Defaulter Threshold (%)</label>
                            <Input type="number" value={minRate} onChange={e => setMinRate(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Late Check-in Mark Cut-off</label>
                            <Input value={lateTime} onChange={e => setLateTime(e.target.value)} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" /> Auto-Sync & Leaves
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Gate Biometric Daily Push Time</label>
                            <Input value={biometricHour} onChange={e => setBiometricHour(e.target.value)} />
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-gray-900">Audit Trail Lock</h4>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    All manual attendance sessions are locked after 48 hours. Any changes post-lock require correction desk authorization.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default SettingsPage;

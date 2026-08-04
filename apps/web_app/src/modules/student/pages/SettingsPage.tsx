import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Save, Settings, ShieldAlert, Award } from 'lucide-react';

export function SettingsPage() {
    const [rollFormat, setRollFormat] = useState('[GRADE]-[SEC]-[YY]-[NUM]');
    const [admFormat, setAdmFormat] = useState('ADM-[YYYY]-[NUM]');
    const [minAttendance, setMinAttendance] = useState(75);

    const handleSave = () => {
        alert('SIS configurations updated successfully!');
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">SIS Module Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure roll numbering formats, promotion rules, and card templates.</p>
                </div>
                <Button onClick={handleSave} className="bg-primary text-white flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Save Settings
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Formats settings */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-primary" /> Auto-Generation Formats
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Roll Number Format</label>
                            <Input value={rollFormat} onChange={e => setRollFormat(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Admission Number Format</label>
                            <Input value={admFormat} onChange={e => setAdmFormat(e.target.value)} />
                        </div>
                    </div>
                </Card>

                {/* Rules setting */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" /> Promotion Passing Criteria
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Minimum Attendance Threshold (%)</label>
                            <Input type="number" value={minAttendance} onChange={e => setMinAttendance(Number(e.target.value))} />
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-gray-900">Passing Grade Limits</h4>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    Promoting is only permitted if the student has verified marks in the system.
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

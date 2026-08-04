import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Save, Calendar, CheckSquare, ShieldCheck, Mail } from 'lucide-react';

export function SettingsPage() {
    const [cycleName, setCycleName] = useState('Admission Cycle 2026-27');
    const [expiryDays, setExpiryDays] = useState(7);
    const [numFormat, setNumFormat] = useState('ADM-YYYY-XXXX');

    const handleSaveSettings = () => {
        alert('Admission configurations updated successfully!');
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Module Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure merit engine schemas, notifications, and form templates.</p>
                </div>
                <Button
                    onClick={handleSaveSettings}
                    className="bg-primary text-white flex items-center gap-1.5"
                >
                    <Save className="w-4 h-4" /> Save Settings
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Cycles */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" /> Active Cycles & Deadlines
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cycle Name</label>
                            <input
                                type="text"
                                value={cycleName}
                                onChange={e => setCycleName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Start Date</label>
                                <input
                                    type="date"
                                    defaultValue="2026-06-01"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">End Date</label>
                                <input
                                    type="date"
                                    defaultValue="2026-08-31"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer rules */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Offer & Verification Rules
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Offer Letter Validity (Days)</label>
                            <input
                                type="number"
                                value={expiryDays}
                                onChange={e => setExpiryDays(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Admission No. Prefix Format</label>
                            <input
                                type="text"
                                value={numFormat}
                                onChange={e => setNumFormat(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Requirements */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-primary" /> Document Requirements
                    </h2>
                    <div className="space-y-2">
                        {[
                            { label: 'Birth Certificate', required: true },
                            { label: 'Prior Year Report Card', required: true },
                            { label: 'Transfer Certificate (TC)', required: false },
                            { label: 'Medical Fitness Form', required: false },
                        ].map((doc, i) => (
                            <label key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                                <span className="text-xs font-bold text-gray-700">{doc.label}</span>
                                <input
                                    type="checkbox"
                                    defaultChecked={doc.required}
                                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Templates */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-primary" /> Notification Templates
                    </h2>
                    <div className="space-y-2">
                        {[
                            { label: 'Offer Dispatch Email Template', ref: 'Offer Dispatch' },
                            { label: 'Document Re-upload Alert SMS', ref: 'Doc Re-upload' },
                            { label: 'Merit List Publish Broadcast', ref: 'Merit Publish' },
                        ].map((temp, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-gray-800">{temp.label}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Template ID: {temp.ref}</p>
                                </div>
                                <button className="text-xs font-bold text-primary hover:underline">Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;

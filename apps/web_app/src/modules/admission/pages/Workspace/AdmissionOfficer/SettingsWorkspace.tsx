import React, { useState } from 'react';
import { Settings, ShieldCheck, ToggleLeft, ToggleRight, Calendar, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SettingsWorkspace() {
    const [examMandatory, setExamMandatory] = useState(false);
    const [interviewMandatory, setInterviewMandatory] = useState(true);
    const [notificationEmail, setNotificationEmail] = useState(true);

    const handleSave = () => {
        toast.success('Admission criteria parameters saved successfully');
    };

    return (
        <div className="max-w-3xl bg-white border rounded-2xl p-6 shadow-sm space-y-6 text-xs text-gray-700">
            <div className="flex items-center gap-2 pb-3 border-b">
                <Settings className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="text-sm font-black text-gray-900">Admission Module Configurations</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Setup mandatory stages, thresholds, & integrations</p>
                </div>
            </div>

            {/* Toggle lists */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-800 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-indigo-500" /> Stage Requirement Toggles
                </h4>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-bold text-gray-800">Entrance Examination Mandate</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Toggle whether the entrance exam step can be bypassed for standard applications.</p>
                        </div>
                        <button onClick={() => setExamMandatory(!examMandatory)} className="text-indigo-600 focus:outline-none">
                            {examMandatory ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-gray-400" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-bold text-gray-800">Interview Evaluation Panel Mandate</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Enforce counselor recommendation scorecard logging before releasing principal approvals.</p>
                        </div>
                        <button onClick={() => setInterviewMandatory(!interviewMandatory)} className="text-indigo-600 focus:outline-none">
                            {interviewMandatory ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-gray-400" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-bold text-gray-800">Automated Parent Email Triggers</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Dispatches real-time status history changes and letters directly to parent inbox.</p>
                        </div>
                        <button onClick={() => setNotificationEmail(!notificationEmail)} className="text-indigo-600 focus:outline-none">
                            {notificationEmail ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-gray-400" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Limits block */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Academic Admissions Calendar Boundaries
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Application Window Close Date</label>
                        <input type="date" defaultValue="2026-08-31" className="w-full border rounded-lg p-2.5 bg-white h-9" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Admissions SLA Breach Alert Limit (Hours)</label>
                        <input type="number" defaultValue="48" className="w-full border rounded-lg p-2.5 bg-white h-9" />
                    </div>
                </div>
            </div>

            <div className="pt-3 border-t">
                <Button onClick={handleSave} className="text-xs bg-indigo-600 hover:bg-indigo-700 h-9 font-bold px-6 rounded-xl">
                    Save Configurations
                </Button>
            </div>
        </div>
    );
}

export default SettingsWorkspace;

import React, { useMemo, useState } from 'react';
import { Send, FileSignature, AlertCircle, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { admissionApi } from '../../../admission.api';
import { toast } from 'sonner';

interface OfferWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    refetch: () => void;
    onSelectApp: (id: string) => void;
}

export function OfferWorkspace({ applications, isLoading, refetch, onSelectApp }: OfferWorkspaceProps) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [template, setTemplate] = useState('Standard_Offer_2026');
    const [submitting, setSubmitting] = useState(false);

    const offerApps = useMemo(() => {
        return applications.filter(a => ['approved', 'offered', 'recommended'].includes(a.status));
    }, [applications]);

    const activeApp = useMemo(() => {
        return applications.find(a => a.id === selectedAppId) || null;
    }, [applications, selectedAppId]);

    const handleOfferAction = async (action: 'generate' | 'send' | 'accept' | 'reject') => {
        if (!selectedAppId) return toast.warning('Select candidate first');
        try {
            setSubmitting(true);
            if (action === 'generate') {
                await admissionApi.generateOffer({ application_id: selectedAppId, template_id: template });
                toast.success('Offer letter generated successfully');
            } else if (action === 'send') {
                await admissionApi.sendOffer({ application_id: selectedAppId });
                toast.success('Offer released to parent');
            } else if (action === 'accept') {
                await admissionApi.acceptOffer({ application_id: selectedAppId });
                toast.success('Offer accepted');
            } else if (action === 'reject') {
                await admissionApi.rejectOffer({ application_id: selectedAppId });
                toast.success('Offer declined');
            }
            refetch();
        } catch {
            toast.error('Offer action failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Candidates List */}
            <div className="bg-white dark:bg-card p-5 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center justify-between pb-2 border-b">
                    <span>Offers Queue</span>
                    <span className="px-2 py-0.5 rounded bg-gray-150 text-[9px] font-black text-gray-700">
                        {offerApps.length}
                    </span>
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-gray-400 animate-pulse">Loading list...</p>
                    ) : offerApps.length === 0 ? (
                        <p className="text-xs text-gray-400">No applicants ready for offer release.</p>
                    ) : (
                        offerApps.map(app => {
                            const isSelected = selectedAppId === app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedAppId(app.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-100 text-gray-700'
                                    }`}
                                >
                                    <p className="font-bold text-[11px] truncate">{app.student_name}</p>
                                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase mt-1">
                                        <span>{app.id.slice(0, 8)} • {app.grade_applied_for}</span>
                                        <span className="text-indigo-600">{app.status}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Action Dashboard */}
            <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-5">
                {activeApp ? (
                    <>
                        <div className="pb-3 border-b">
                            <h3 className="text-sm font-black text-gray-900">{activeApp.student_name}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{activeApp.id} • {activeApp.grade_applied_for}</p>
                        </div>

                        {/* Template Selections */}
                        <div className="space-y-1 text-xs">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Offer Letter Template</label>
                            <select value={template} onChange={e => setTemplate(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white h-9">
                                <option value="Standard_Offer_2026">Standard Offer Letter - Academic Year 2026-27</option>
                                <option value="Scholarship_Offer_2026">Merit Scholarship Offer Letter</option>
                                <option value="Conditional_Offer_2026">Conditional Admission Offer Letter</option>
                            </select>
                        </div>

                        {/* Action Panel */}
                        <div className="p-4 border rounded-xl bg-gray-50/50 space-y-3">
                            <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1">
                                <FileSignature className="w-4 h-4 text-indigo-500" /> Actions Drawer
                            </h4>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button size="sm" onClick={() => handleOfferAction('generate')} disabled={submitting} className="text-xs bg-indigo-600 hover:bg-indigo-700">
                                    Generate Offer PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleOfferAction('send')} disabled={submitting} className="text-xs">
                                    <Send className="w-3.5 h-3.5 mr-1" /> Release Offer to Parent
                                </Button>
                            </div>
                        </div>

                        {/* Parent Portal Response Override simulations */}
                        <div className="p-4 border rounded-xl bg-white space-y-3">
                            <h4 className="text-xs font-black uppercase text-gray-700">Parent Response Override</h4>
                            <p className="text-[10px] text-gray-400 font-medium">Allows manual state updates if parent registers choice via physical signature or callback.</p>
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => handleOfferAction('accept')} disabled={submitting} className="text-xs text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Override Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleOfferAction('reject')} disabled={submitting} className="text-xs text-rose-600 border-rose-100 hover:bg-rose-50">
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Override Decline
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-24 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                        <Send className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold">Select a candidate from the left panel to release or track admissions offer letters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OfferWorkspace;

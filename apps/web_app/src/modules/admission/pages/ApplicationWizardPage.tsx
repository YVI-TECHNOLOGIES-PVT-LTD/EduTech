import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { Button } from '../../../components/ui/button';
import { ChevronRight, ChevronLeft, Save, FileText, Clock, RotateCcw, HelpCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMasterData } from '../context/MasterDataContext';
import { useAdmissionMasterData } from '../context/AdmissionMasterDataContext';

const STEPS = [
    { title: 'Student Info', desc: 'Personal details' },
    { title: 'Parents', desc: 'Contact info' },
    { title: 'Academic', desc: 'Prior education' },
    { title: 'Medical', desc: 'Allergies & record' },
    { title: 'Transport', desc: 'Bus route options' },
    { title: 'Hostel', desc: 'Boarding details' },
    { title: 'Documents', desc: 'File uploads' },
    { title: 'Declaration', desc: 'Signature & submit' },
];

export function ApplicationWizardPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { grades, quotas, bloodGroups, hostelRoomTypes } = useMasterData();
    const { transportRoutes } = useAdmissionMasterData();

    const [formData, setFormData] = useState<any>({
        student_name: '',
        date_of_birth: '',
        gender: 'Male',
        grade_applied_for: 'Grade 1',
        admission_type: 'Regular',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        previous_school: '',
        last_grade_completed: '',
        allergies: '',
        blood_group: 'A+',
        needs_bus: 'No',
        bus_route: '',
        needs_hostel: 'No',
        room_type: '',
    });

    const [draftHistory, setDraftHistory] = useState<any[]>([
        { id: 'v1', timestamp: '10 mins ago', name: 'Auto-saved Draft' },
        { id: 'v2', timestamp: '1 hour ago', name: 'Manual Saved Draft' },
    ]);

    // Handle autosave simulation every 45s
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Autosaving draft...', formData);
            // Simulate adding version
            setDraftHistory(prev => [
                { id: `v-${Date.now()}`, timestamp: 'Just now', name: 'Auto-saved Version' },
                ...prev.slice(0, 4),
            ]);
        }, 45_000);
        return () => clearInterval(interval);
    }, [formData]);

    // Fetch existing draft if editing
    useEffect(() => {
        if (!id) return;
        const fetchExisting = async () => {
            try {
                const data = (await admissionApi.getById(id)).data as any;
                setFormData({
                    student_name: data.student_name || '',
                    date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : '',
                    gender: data.gender || 'Male',
                    grade_applied_for: data.grade_applied_for || 'Grade 1',
                    admission_type: data.admission_type || 'Regular',
                    parent_name: data.parent_name || '',
                    parent_email: data.parent_email || '',
                    parent_phone: data.parent_phone || '',
                    previous_school: data.previous_school || '',
                    last_grade_completed: data.last_grade_completed || '',
                    allergies: data.allergies || '',
                    blood_group: data.blood_group || 'A+',
                    needs_bus: data.needs_bus || 'No',
                    bus_route: data.bus_route || '',
                    needs_hostel: data.needs_hostel || 'No',
                    room_type: data.room_type || '',
                });
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        };
        fetchExisting();
    }, [id]);

    const handleRestoreDraft = (version: any) => {
        alert(`Restoring version: ${version.name} (${version.id})`);
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1);
        }
    };

    const handleSaveDraft = async () => {
        try {
            if (id) {
                await admissionApi.update(id, formData);
            } else {
                await admissionApi.create(formData);
            }
            alert('Draft saved successfully!');
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to save draft';
            alert(errorMsg);
        }
    };

    const handleSubmit = async () => {
        try {
            let appId = id;
            if (id) {
                await admissionApi.update(id, formData);
            } else {
                const res = await admissionApi.create(formData);
                appId = res.data.id;
            }
            await admissionApi.submit(appId!);
            alert('Application submitted successfully!');
            navigate('/app/admissions/my');
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to submit application';
            alert(errorMsg);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Application Wizard</h1>
                    <p className="text-sm text-gray-500 mt-1">Complete admission wizard application.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleSaveDraft} className="flex items-center gap-1">
                        <Save className="w-4 h-4" /> Save Draft
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Stepper Nav */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-wide">Steps Progress</h2>
                    <div className="space-y-3">
                        {STEPS.map((step, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-full flex items-start gap-3 p-2 rounded-xl text-left transition-all ${
                                    idx === currentStep ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                    idx <= currentStep ? 'border-primary bg-primary text-white' : 'border-gray-200'
                                }`}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <p className="text-xs font-bold">{step.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Panels */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div className="pb-4 border-b border-gray-100">
                        <h2 className="text-sm font-black text-gray-900">{STEPS[currentStep].title}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{STEPS[currentStep].desc}</p>
                    </div>

                    <div className="space-y-4 min-h-[300px]">
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Student Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.student_name}
                                            onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Admission Type</label>
                                        <select
                                            id="wizard-admission-type"
                                            value={formData.admission_type}
                                            onChange={e => setFormData({ ...formData, admission_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {quotas.map(q => (
                                                <option key={q} value={q}>{q} Admission</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Grade Applied For</label>
                                        <select
                                            id="wizard-grade"
                                            value={formData.grade_applied_for}
                                            onChange={e => setFormData({ ...formData, grade_applied_for: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                                        >
                                            {grades.map(g => (
                                                <option key={g.id} value={g.name}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Parent/Guardian Name</label>
                                    <input
                                        type="text"
                                        value={formData.parent_name}
                                        onChange={e => setFormData({ ...formData, parent_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Parent Email</label>
                                        <input
                                            type="email"
                                            value={formData.parent_email}
                                            onChange={e => setFormData({ ...formData, parent_email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Parent Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.parent_phone}
                                            onChange={e => setFormData({ ...formData, parent_phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Previous School Name</label>
                                        <input
                                            type="text"
                                            value={formData.previous_school}
                                            onChange={e => setFormData({ ...formData, previous_school: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Last Grade Completed</label>
                                        <input
                                            type="text"
                                            value={formData.last_grade_completed}
                                            onChange={e => setFormData({ ...formData, last_grade_completed: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Blood Group</label>
                                        <select
                                            id="wizard-blood-group"
                                            value={formData.blood_group}
                                            onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                                        >
                                            {bloodGroups.map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Allergies / Special Needs</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Peanut allergy, asthma (or None)"
                                            value={formData.allergies}
                                            onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Requires School Bus?</label>
                                        <select
                                            id="wizard-needs-bus"
                                            value={formData.needs_bus}
                                            onChange={e => setFormData({ ...formData, needs_bus: e.target.value, bus_route: e.target.value === 'No' ? '' : formData.bus_route })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                                        >
                                            <option value="No">No, I will manage self-transport</option>
                                            <option value="Yes">Yes, require school bus service</option>
                                        </select>
                                    </div>
                                    {formData.needs_bus === 'Yes' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Preferred Route / Area</label>
                                            <select
                                                id="wizard-bus-route"
                                                value={formData.bus_route}
                                                onChange={e => setFormData({ ...formData, bus_route: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                                            >
                                                <option value="">Select Route Option</option>
                                                {transportRoutes.map(r => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Requires Hostel Accommodation?</label>
                                        <select
                                            id="wizard-needs-hostel"
                                            value={formData.needs_hostel}
                                            onChange={e => setFormData({ ...formData, needs_hostel: e.target.value, room_type: e.target.value === 'No' ? '' : formData.room_type })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                                        >
                                            <option value="No">No, Day scholar</option>
                                            <option value="Yes">Yes, boarding student</option>
                                        </select>
                                    </div>
                                    {formData.needs_hostel === 'Yes' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Room Type Preference</label>
                                            <select
                                                id="wizard-room-type"
                                                value={formData.room_type}
                                                onChange={e => setFormData({ ...formData, room_type: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                                            >
                                                <option value="">Select Room Type</option>
                                                {hostelRoomTypes.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-500 uppercase">Required Certificates</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="border border-dashed border-gray-200 rounded-2xl p-5 text-center space-y-2">
                                        <p className="text-xs font-bold text-gray-700">Birth Certificate</p>
                                        <p className="text-[10px] text-gray-400">PDF, PNG, or JPG up to 5MB</p>
                                        <input
                                            type="file"
                                            id="wizard-doc-birth"
                                            className="hidden"
                                            onChange={() => alert('Birth certificate uploaded successfully!')}
                                        />
                                        <label htmlFor="wizard-doc-birth" className="inline-block px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:bg-gray-800">
                                            Choose File
                                        </label>
                                    </div>
                                    <div className="border border-dashed border-gray-200 rounded-2xl p-5 text-center space-y-2">
                                        <p className="text-xs font-bold text-gray-700">Transfer Certificate</p>
                                        <p className="text-[10px] text-gray-400">PDF, PNG, or JPG up to 5MB</p>
                                        <input
                                            type="file"
                                            id="wizard-doc-transfer"
                                            className="hidden"
                                            onChange={() => alert('Transfer certificate uploaded successfully!')}
                                        />
                                        <label htmlFor="wizard-doc-transfer" className="inline-block px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:bg-gray-800">
                                            Choose File
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 7 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                    <p className="text-xs font-bold text-gray-700">Declaration Statement</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">
                                        I hereby declare that all the particulars filled in this application form are true, correct, and complete to the best of my knowledge. I understand that if any information is found incorrect or fake, my application/admission is liable to be cancelled at any stage.
                                    </p>
                                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                                        <input
                                            type="checkbox"
                                            id="wizard-declare-checkbox"
                                            required
                                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                                        />
                                        <span className="text-xs font-bold text-gray-700">I accept the declaration</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="flex items-center gap-1.5"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                className="bg-primary text-white"
                            >
                                Submit Application
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                className="bg-primary text-white flex items-center gap-1.5"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Draft History sidebar */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-1.5">
                        <History className="w-4 h-4 text-gray-400" />
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-wide">Draft Recovery</h2>
                    </div>
                    <div className="space-y-2">
                        {draftHistory.map(version => (
                            <div key={version.id} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                                <div className="flex justify-between items-start gap-1">
                                    <p className="text-[10px] font-black text-gray-700 leading-tight">{version.name}</p>
                                    <span className="text-[8px] text-gray-400 font-bold shrink-0">{version.timestamp}</span>
                                </div>
                                <div className="flex justify-end gap-1">
                                    <button
                                        onClick={() => handleRestoreDraft(version)}
                                        className="text-[9px] font-black text-primary hover:underline"
                                    >
                                        Restore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationWizardPage;

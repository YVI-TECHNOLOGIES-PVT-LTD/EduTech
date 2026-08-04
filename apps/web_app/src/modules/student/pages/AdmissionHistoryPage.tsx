import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { Card } from '../../../components/ui/card';
import { ArrowLeft, Clock, FileText, ChevronRight } from 'lucide-react';

export function AdmissionHistoryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { student } = useStudent(id || '');

    const mockAdmissionTimeline = [
        { id: '1', stage: 'Inquiry Submitted', date: '2026-06-10', desc: 'Parent registered inquiry lead.' },
        { id: '2', stage: 'Application Registered', date: '2026-06-15', desc: 'Application form submitted successfully.' },
        { id: '3', stage: 'Documents Verified', date: '2026-06-20', desc: 'Birth certificate and prior year cards verified.' },
        { id: '4', stage: 'Offer Dispatched & Accepted', date: '2026-06-25', desc: 'Accepted the grade admission seat offer.' },
    ];

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Admission History</h1>
                    <p className="text-sm text-gray-500 mt-1">Review original admission forms, files, and milestones.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Admission Record Information</h3>
                        <div className="space-y-3 text-xs font-bold text-gray-700">
                            <div><span className="text-[10px] text-gray-400 block font-black">ORIGINAL APPLICATION ID</span> APP-2026-8942</div>
                            <div><span className="text-[10px] text-gray-400 block font-black">ADMITTED GRADE</span> Grade 10</div>
                            <div><span className="text-[10px] text-gray-400 block font-black">ADMISSION TYPE</span> Regular</div>
                        </div>
                    </Card>

                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Verified Documents</h3>
                        <div className="space-y-2">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-700">Birth Certificate</span>
                                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase">Verified</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-700">Aadhaar Card</span>
                                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase">Verified</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Admission timelines path */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" /> Application Timeline Log
                    </h3>
                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                        {mockAdmissionTimeline.map(step => (
                            <div key={step.id} className="flex gap-3 relative pl-4">
                                <div className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white"></div>
                                <div>
                                    <h4 className="text-xs font-black text-gray-900">{step.stage}</h4>
                                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">{step.date}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default AdmissionHistoryPage;

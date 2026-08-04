import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { useIdentity } from '../hooks/useIdentity';
import { StudentAvatar } from '../components/shared/StudentAvatar';
import { StudentStatusBadge } from '../components/shared/StudentStatusBadge';
import { StudentTimeline } from '../components/timeline/StudentTimeline';
import { StudentDocumentViewer } from '../components/documents/StudentDocumentViewer';
import { IdentityCardPreview } from '../components/identity/IdentityCardPreview';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ArrowLeft, User, Phone, MapPin, Printer, ShieldAlert, Award, FileText, Settings, Heart, Layers } from 'lucide-react';

export function StudentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { student, timeline, history, isLoadingStudent } = useStudent(id || '');
    const { barcode } = useIdentity(id);
    const [activeTab, setActiveTab] = useState('Overview');

    const tabs = [
        'Overview',
        'Personal',
        'Parents',
        'Guardians',
        'Documents',
        'Medical',
        'Academics',
        'Allocation',
        'Promotion History',
        'Transfer History',
        'Identity Card',
        'Timeline',
        'Audit Logs',
        'Print Preview',
    ];

    if (isLoadingStudent) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const mockStudent = student || {
        id: 's1',
        admission_no: 'ADM-2026-001',
        first_name: 'Rahul',
        last_name: 'Soni',
        status: 'ACTIVE',
        grade: 'Grade 10',
        school_id: 'school-1',
        academic_year_id: 'year-1',
        blood_group: 'O+',
        category: 'General',
        admission_type: 'Regular',
        house: 'Red House',
        gender: 'Male',
        address: '123 Vikas Lane, Block C, Jaipur',
        allergies: 'None',
        medical_conditions: 'Asthma (controlled)',
        photo_url: '',
    };

    const mockParents = [
        { name: 'Arun Soni', relation: 'Father', phone: '+91 98765 43210', email: 'arun@mail.com', occupation: 'Engineer' },
        { name: 'Meena Soni', relation: 'Mother', phone: '+91 98765 43211', email: 'meena@mail.com', occupation: 'Teacher' },
    ];

    const mockDocs = [
        { id: 'd1', document_type: 'Birth Certificate', file_url: 'https://umvbyywkojuxnxgkuwbt.supabase.co/storage/v1/object/public/school-erp-assets/demo/birth_cert.png', status: 'verified' as const },
        { id: 'd2', document_type: 'Aadhaar Card', file_url: 'https://umvbyywkojuxnxgkuwbt.supabase.co/storage/v1/object/public/school-erp-assets/demo/aadhaar_doc.png', status: 'pending' as const },
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-6 print:p-0">
            {/* Header / Navigation bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/app/students')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black text-gray-900">{mockStudent.first_name} {mockStudent.last_name}</h1>
                            <StudentStatusBadge status={mockStudent.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Admission Ref No: {mockStudent.admission_no} · {mockStudent.house}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Seamless Navigation link back to Admissions modules */}
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/admissions/${mockStudent.id}`)}
                        className="text-xs font-black flex items-center gap-1.5"
                    >
                        <FileText className="w-4 h-4" /> View Admission File
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary text-white text-xs font-black flex items-center gap-1.5">
                        <Printer className="w-4 h-4" /> Print Dossier
                    </Button>
                </div>
            </div>

            {/* Quick Profile Summary Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-6 items-center print:border-0 print:p-0">
                <StudentAvatar firstName={mockStudent.first_name} lastName={mockStudent.last_name} photoUrl={mockStudent.photo_url} className="w-16 h-16 shrink-0" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block">Academic Grade</span>
                        <span className="text-xs font-black text-gray-900">{mockStudent.grade}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block">Gender</span>
                        <span className="text-xs font-black text-gray-900">{mockStudent.gender}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block">Blood Group</span>
                        <span className="text-xs font-black text-gray-900">{mockStudent.blood_group}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase block">Admission Type</span>
                        <span className="text-xs font-black text-gray-900">{mockStudent.admission_type}</span>
                    </div>
                </div>
            </div>

            {/* Main tab selections */}
            <div className="border-b border-gray-100 flex gap-2 overflow-x-auto pb-1 print:hidden select-none">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 border-b-2 text-xs font-black transition-all shrink-0 ${
                            activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="mt-4">
                {activeTab === 'Overview' && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="p-6 border-0 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Student Parameters</h3>
                                <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                                    <div><span className="text-[10px] text-gray-400 block font-black">ADMISSION YEAR ID</span> {mockStudent.academic_year_id}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">SCHOOL REGISTER CODE</span> {mockStudent.school_id}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">ADDRESS</span> {mockStudent.address}</div>
                                </div>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="p-6 border-0 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Heart className="w-4 h-4 text-red-500" /> Medical Summary
                                </h3>
                                <div className="space-y-2 text-xs font-bold text-gray-700">
                                    <div><span className="text-[10px] text-gray-400 block font-black">ALLERGIES</span> {mockStudent.allergies}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">CONDITIONS</span> {mockStudent.medical_conditions}</div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'Personal' && (
                    <Card className="p-6 border-0 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Personal Profile Details</h3>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-gray-700">
                            <div><span className="text-[10px] text-gray-400 block font-black">FIRST NAME</span> {mockStudent.first_name}</div>
                            <div><span className="text-[10px] text-gray-400 block font-black">LAST NAME</span> {mockStudent.last_name}</div>
                            <div><span className="text-[10px] text-gray-400 block font-black">GENDER</span> {mockStudent.gender}</div>
                            <div><span className="text-[10px] text-gray-400 block font-black">BLOOD GROUP</span> {mockStudent.blood_group}</div>
                        </div>
                    </Card>
                )}

                {activeTab === 'Parents' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {mockParents.map((parent, idx) => (
                            <Card key={idx} className="p-6 border-0 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-primary uppercase tracking-wider">{parent.relation} Info</h4>
                                <div className="space-y-2 text-xs font-bold text-gray-700">
                                    <div><span className="text-[10px] text-gray-400 block font-black">NAME</span> {parent.name}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">PHONE</span> {parent.phone}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">EMAIL</span> {parent.email}</div>
                                    <div><span className="text-[10px] text-gray-400 block font-black">OCCUPATION</span> {parent.occupation}</div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'Documents' && (
                    <StudentDocumentViewer documents={mockDocs} />
                )}

                {activeTab === 'Identity Card' && (
                    <IdentityCardPreview student={mockStudent} barcodeUrl={barcode?.barcode_url} />
                )}

                {activeTab === 'Timeline' && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <StudentTimeline steps={timeline} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDetailsPage;

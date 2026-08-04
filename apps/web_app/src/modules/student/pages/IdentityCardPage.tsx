import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../hooks/useIdentity';
import { IdentityCardPreview } from '../components/identity/IdentityCardPreview';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { ArrowLeft, User, Barcode } from 'lucide-react';

export function IdentityCardPage() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState('');
    const { generateIdCard, isGenerating } = useIdentity(studentId);

    const mockStudent = {
        admission_no: 'ADM-2026-001',
        first_name: 'Rahul',
        last_name: 'Soni',
        grade: 'Grade 10',
        section: 'Sec A',
        blood_group: 'O+',
    };

    const handleGenerate = async () => {
        if (!studentId) {
            alert('Please provide student UUID');
            return;
        }
        try {
            await generateIdCard(studentId);
            alert('ID Card database mappings generated successfully!');
        } catch (err) {
            console.error('ID Card generation failed', err);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 print:hidden">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Identity Cards</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure layout template options and print student barcodes.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 border-0 shadow-sm space-y-4 print:hidden">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Barcode className="w-4 h-4 text-primary" /> Setup Card Parameters
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Student Reference ID</label>
                            <Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student UUID..." />
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-primary text-white text-xs font-bold"
                    >
                        Generate ID Record
                    </Button>
                </Card>

                <div className="md:col-span-2">
                    <IdentityCardPreview student={mockStudent} />
                </div>
            </div>
        </div>
    );
}

export default IdentityCardPage;

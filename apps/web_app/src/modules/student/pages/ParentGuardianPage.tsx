import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Save, ArrowLeft } from 'lucide-react';

export function ParentGuardianPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateParents } = useStudents();

    const [fatherName, setFatherName] = useState('Arun Soni');
    const [fatherPhone, setFatherPhone] = useState('+91 98765 43210');
    const [fatherOccupation, setFatherOccupation] = useState('Engineer');

    const [motherName, setMotherName] = useState('Meena Soni');
    const [motherPhone, setMotherPhone] = useState('+91 98765 43211');
    const [motherOccupation, setMotherOccupation] = useState('Teacher');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateParents({
                id: id!,
                data: [
                    { parent_name: fatherName, relation: 'Father', mobile_number: fatherPhone, occupation: fatherOccupation },
                    { parent_name: motherName, relation: 'Mother', mobile_number: motherPhone, occupation: motherOccupation },
                ],
            });
            alert('Guardian details updated successfully!');
            navigate(`/app/students/${id}`);
        } catch (err) {
            console.error('Update parents failed', err);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Parents & Guardians</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure emergency contacts and parent details.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                {/* Father Info */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-wide">Father Information</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Father's Name</label>
                            <Input value={fatherName} onChange={e => setFatherName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Mobile Number</label>
                            <Input value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Occupation</label>
                            <Input value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)} />
                        </div>
                    </div>
                </Card>

                {/* Mother Info */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-wide">Mother Information</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Mother's Name</label>
                            <Input value={motherName} onChange={e => setMotherName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Mobile Number</label>
                            <Input value={motherPhone} onChange={e => setMotherPhone(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Occupation</label>
                            <Input value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="max-w-4xl flex justify-end gap-2 pt-4">
                <Button type="submit" className="bg-primary text-white flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Save Contacts
                </Button>
            </div>
        </form>
    );
}

export default ParentGuardianPage;

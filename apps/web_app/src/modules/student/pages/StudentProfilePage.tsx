import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { useStudent } from '../hooks/useStudent';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Save, ArrowLeft } from 'lucide-react';

export function StudentProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { student } = useStudent(id || '');
    const { updateProfile } = useStudents();

    const [firstName, setFirstName] = useState(student?.first_name || 'Rahul');
    const [lastName, setLastName] = useState(student?.last_name || 'Soni');
    const [dob, setDob] = useState('2012-05-15');
    const [bloodGroup, setBloodGroup] = useState(student?.blood_group || 'O+');
    const [allergies, setAllergies] = useState(student?.allergies || 'None');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                id: id!,
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    date_of_birth: dob,
                    blood_group: bloodGroup,
                    allergies,
                },
            });
            alert('Profile updated successfully!');
            navigate(`/app/students/${id}`);
        } catch (err) {
            console.error('Update profile failed', err);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Edit Student Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Modify personal, demographic, and medical parameters.</p>
                </div>
            </div>

            <Card className="p-6 border-0 shadow-sm space-y-4 max-w-2xl">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Personal Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">First Name</label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Last Name</label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Date of Birth</label>
                        <Input type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Blood Group</label>
                        <select
                            id="profile-blood-group-select"
                            value={bloodGroup}
                            onChange={e => setBloodGroup(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                        >
                            <option value="A+">A+</option>
                            <option value="O+">O+</option>
                            <option value="B+">B+</option>
                            <option value="AB+">AB+</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Medical Log Details</h3>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Known Allergies</label>
                        <Input value={allergies} onChange={e => setAllergies(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" className="bg-primary text-white flex items-center gap-1.5">
                        <Save className="w-4 h-4" /> Save Profile Details
                    </Button>
                </div>
            </Card>
        </form>
    );
}

export default StudentProfilePage;

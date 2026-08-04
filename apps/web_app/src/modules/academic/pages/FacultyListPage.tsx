import React, { useState, useEffect } from 'react';
import { FacultyApi } from '../../../api/facultyStaff.api';
import { supabase } from '../../../lib/supabase';
import { ImportWizard } from '../../../components/import/ImportWizard';
import { DownloadCloud } from 'lucide-react';

interface FacultyProfile {
    id: string;
    user_id: string;
    employee_code: string;
    designation: string;
    qualification: string;
    joining_date: string;
    status: string;
    user?: { full_name: string; email: string };
    department?: { name: string };
}

interface UserSummary {
    id: string;
    full_name: string;
}

export const FacultyListPage: React.FC = () => {
    const [profiles, setProfiles] = useState<FacultyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        user_id: '',
        employee_code: '',
        designation: '',
        qualification: '',
        joining_date: '',
        department_id: '' // Optional for MVP
    });

    // Available Faculty Users (for dropdown)
    const [facultyUsers, setFacultyUsers] = useState<UserSummary[]>([]);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const data = await FacultyApi.getAllProfiles({ limit: 100 });
            console.log('[FacultyPage] Received data:', data);
            setProfiles(data.data || []);
        } catch (error: any) {
            console.error('Error fetching faculty profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFacultyUsers = async () => {
        // Find users with role FACULTY who don't have a profile yet (optional filtering)
        // For now just fetch all faculty via direct query if possible or admin API
        // Since we don't have a specific API for "Users without profile", we might need to rely on existing APIs
        // or just list all faculty (simplification).

        // Using Supabase client directly for this dropdown to avoid complex backend endpoint creation if not present
        const { data } = await supabase
            .from('users')
            .select(`id, full_name, user_roles!inner(role:roles!inner(name))`)
            .eq('user_roles.role.name', 'FACULTY');

        if (data) {
            setFacultyUsers(data.map((u: any) => ({ id: u.id, full_name: u.full_name })));
        }
    };

    const handleOpenCreate = () => {
        fetchFacultyUsers();
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await FacultyApi.createProfile(formData);
            setIsModalOpen(false);
            fetchProfiles();
            // Reset form
            setFormData({
                user_id: '',
                employee_code: '',
                designation: '',
                qualification: '',
                joining_date: '',
                department_id: ''
            });
        } catch (err: any) {
            alert('Error creating profile: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Faculty Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition flex items-center gap-2"
                    >
                        <DownloadCloud className="w-4 h-4" /> Import Faculty
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                        + Add Faculty Profile
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {profiles.map((profile) => (
                                <tr key={profile.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{profile.user?.full_name || 'Unknown'}</div>
                                        <div className="text-gray-500 text-sm">{profile.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{profile.employee_code || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{profile.designation || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {profile.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Edit link placeholder */}
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No profiles found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Simple Modal Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Create Faculty Profile</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Select User (Faculty Role)</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.user_id}
                                        onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                    >
                                        <option value="">-- Select User --</option>
                                        {facultyUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.employee_code}
                                        onChange={e => setFormData({ ...formData, employee_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Qualification</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.qualification}
                                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.joining_date}
                                        onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Create Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Import Wizard */}
            <ImportWizard
                isOpen={isImportOpen}
                onClose={() => {
                    setIsImportOpen(false);
                }}
                onImportSuccess={fetchProfiles}
                entityType="FACULTY_PROFILE"
                title="Faculty Profiles"
            />
        </div>
    );
};

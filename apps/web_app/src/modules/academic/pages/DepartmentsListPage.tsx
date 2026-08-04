import React, { useEffect, useState } from 'react';
import { departmentsApi, Department } from '../../../api/departments.api';
import { Plus, Edit2, Trash2, Search, Building, Save, X, AlertTriangle } from 'lucide-react';

export const DepartmentsListPage = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const data = await departmentsApi.getAll();
            setDepartments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingDept(null);
        setFormData({ name: '' });
        setError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({ name: dept.name });
        setError(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);
        try {
            if (editingDept) {
                await departmentsApi.update(editingDept.id, formData.name);
            } else {
                await departmentsApi.create(formData.name);
            }
            setIsModalOpen(false);
            fetchDepartments();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Operation failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this department?")) return;
        try {
            await departmentsApi.delete(id);
            fetchDepartments();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building className="w-8 h-8 text-blue-600" />
                        Departments
                    </h1>
                    <p className="text-gray-500 font-medium">Manage academic and administrative departments.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Department
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search departments..."
                    className="flex-1 border-none focus:ring-0 text-sm font-medium placeholder:text-gray-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Department Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Created At</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-400">No departments found.</td></tr>
                        ) : (
                            filtered.map(dept => (
                                <tr key={dept.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-800">{dept.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                        {new Date(dept.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenEdit(dept)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900">
                                {editingDept ? 'Edit Department' : 'New Department'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all font-bold text-gray-900"
                                    placeholder="e.g. Science, Mathematics"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                                    disabled={submitLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Department</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

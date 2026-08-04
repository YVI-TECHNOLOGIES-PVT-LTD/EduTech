import React, { useEffect, useState } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    Building2,
    DoorOpen,
    Users,
    CheckCircle2,
    AlertCircle,
    X,
    Save,
    MapPin,
    Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../lib/api-client';
import { useForm } from 'react-hook-form';

interface ExamHall {
    id: string;
    hall_name: string;
    building?: string;
    floor?: string;
    capacity: number;
    is_active: boolean;
    is_in_use: boolean;
}

export const ExamHallManagement = () => {
    const [halls, setHalls] = useState<ExamHall[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingHall, setEditingHall] = useState<ExamHall | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm();

    const fetchHalls = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/exams/v1/exam-halls');
            setHalls(res.data);
        } catch (err: any) {
            console.error('Failed to fetch halls:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHalls();
    }, []);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        setError(null);
        try {
            if (editingHall) {
                await apiClient.put(`/exams/v1/exam-halls/${editingHall.id}`, data);
            } else {
                await apiClient.post('/exams/v1/exam-halls', data);
            }
            closeModal();
            fetchHalls();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            if (msg.includes('CAPACITY_LOCKED')) {
                setError("Cannot reduce capacity for a hall that has already been allocated to students.");
            } else if (msg.includes('duplicate key')) {
                setError("A hall with this name already exists in your school.");
            } else {
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (hall: ExamHall) => {
        if (hall.is_in_use) {
            alert("HALL_IN_USE_CANNOT_DELETE: This hall is currently used in a published exam seating plan and cannot be deleted.");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${hall.hall_name}? This action cannot be undone.`)) return;

        try {
            await apiClient.delete(`/exams/v1/exam-halls/${hall.id}`);
            fetchHalls();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            alert(msg.includes('HALL_IN_USE') ? "HALL_IN_USE_CANNOT_DELETE" : msg);
        }
    };

    const toggleStatus = async (hall: ExamHall) => {
        try {
            await apiClient.patch(`/exams/v1/exam-halls/${hall.id}/toggle`);
            fetchHalls();
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        }
    };

    const openEditModal = (hall: ExamHall) => {
        setEditingHall(hall);
        setValue('hall_name', hall.hall_name);
        setValue('building', hall.building);
        setValue('floor', hall.floor);
        setValue('capacity', hall.capacity);
        setValue('is_active', hall.is_active);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingHall(null);
        setError(null);
        reset();
    };

    const activeHalls = halls.filter(h => h.is_active).length;
    const totalCapacity = halls.filter(h => h.is_active).reduce((sum, h) => sum + h.capacity, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Exam Hall Configuration</h1>
                    <p className="text-gray-500 font-medium italic">Manage physical exam spaces and capacities for seating generation.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-indigo-100 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Add New Hall</span>
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900">{halls.length}</div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Halls</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900">{activeHalls}</div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Spaces</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900">{totalCapacity}</div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Active Capacity</div>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Hall Name</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Location</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Capacity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Usage</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Loading Hall Registry...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : halls.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-300">
                                            <DoorOpen className="w-16 h-16" />
                                            <p className="font-bold uppercase tracking-widest text-sm">No exam halls configured yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : halls.map((hall) => (
                                <tr key={hall.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <DoorOpen className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-900 text-lg">{hall.hall_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                                {hall.building || 'Main Campus'}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">
                                                {hall.floor ? `Floor ${hall.floor}` : 'Ground Floor'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                            <Users className="w-3.5 h-3.5" />
                                            <span className="font-black text-sm">{hall.capacity}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => toggleStatus(hall)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${hall.is_active
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-600 hover:text-white'
                                                }`}
                                        >
                                            {hall.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        {hall.is_in_use ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-rose-100">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                In Use (Published)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-tight border border-gray-100">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
                                                Available
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(hall)}
                                                className="p-2.5 bg-white text-gray-400 hover:text-indigo-600 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(hall)}
                                                className={`p-2.5 rounded-xl border transition-all ${hall.is_in_use
                                                    ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed'
                                                    : 'bg-white text-gray-400 hover:text-rose-600 border-gray-100 hover:border-rose-100 hover:shadow-lg'
                                                    }`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-10"
                        >
                            <button onClick={closeModal} className="absolute top-8 right-8 p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="mb-8">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                    {editingHall ? 'Edit Exam Hall' : 'Add New Exam Hall'}
                                </h2>
                                <p className="text-gray-500 font-medium italic mt-2">Configure space details and student capacity.</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="text-sm font-bold tracking-tight">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Hall Name / Number</label>
                                    <input
                                        {...register("hall_name", { required: true })}
                                        placeholder="e.g., Auditorium B - 101"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-gray-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Building</label>
                                        <input
                                            {...register("building")}
                                            placeholder="e.g., Block A"
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Floor</label>
                                        <input
                                            {...register("floor")}
                                            placeholder="e.g., 2nd"
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Student Capacity</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register("capacity", { required: true, min: 1 })}
                                            placeholder="Number of seats"
                                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-gray-900 pl-14"
                                        />
                                        <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                <span>{editingHall ? 'Save Changes' : 'Create Hall'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

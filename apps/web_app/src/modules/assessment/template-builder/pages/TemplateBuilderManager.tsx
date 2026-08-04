import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { GraduationCap, Copy, Trash2, Plus, Edit3, Settings, Loader2 } from 'lucide-react';
import { useTemplatesList, useCreateTemplate, useDeleteTemplate, useCloneTemplate } from '../hooks/useTemplateBuilder';
import { useSubjectsList, useActiveAcademicYear } from '../../question-bank/hooks/useQuestionBank';
import { TemplateSectionsDesigner } from '../components/TemplateSectionsDesigner';

export function TemplateBuilderManager() {
    const { data: subjects } = useSubjectsList();
    const { data: activeYear } = useActiveAcademicYear();

    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    // Header creator form states
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [createError, setCreateError] = useState('');

    // Designer context states
    const [activeTemplate, setActiveTemplate] = useState<any | null>(null);

    const createMutation = useCreateTemplate();
    const deleteMutation = useDeleteTemplate();
    const cloneMutation = useCloneTemplate();

    // Default subject choice
    useEffect(() => {
        if (subjects && subjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(subjects[0].id);
        }
    }, [subjects]);

    const { data, isLoading, refetch } = useTemplatesList({
        subjectId: selectedSubjectId || undefined,
        page,
        limit
    });

    const handleCreateHeader = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        if (!selectedSubjectId) {
            setCreateError('Please select a subject first.');
            return;
        }
        try {
            await createMutation.mutateAsync({
                subject_id: selectedSubjectId,
                name: newName,
                description: newDesc
            });
            setNewName('');
            setNewDesc('');
            setCreateOpen(false);
            refetch();
        } catch (err: any) {
            setCreateError(err.response?.data?.error || err.message || 'Failed to create template header.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this template blueprint?')) {
            try {
                await deleteMutation.mutateAsync(id);
                refetch();
            } catch (err: any) {
                alert(err.message || 'Failed to delete template.');
            }
        }
    };

    const handleClone = async (id: string) => {
        try {
            const cloned = await cloneMutation.mutateAsync(id);
            alert(`Template cloned as draft. version: ${cloned.version}`);
            refetch();
        } catch (err: any) {
            alert(err.message || 'Failed to fork template.');
        }
    };

    return (
        <div className="space-y-6 pb-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Assessment Templates Blueprint</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        Active Academic Year: <span className="font-bold text-gray-700">{activeYear?.year_label || 'Seeding Active Year...'}</span>
                    </p>
                </div>
                {!activeTemplate && (
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-primary text-white rounded-xl text-xs font-black px-4 flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> New Blueprint
                    </Button>
                )}
            </div>

            {activeTemplate ? (
                /* SECTION BUILDER SPLIT SCREEN */
                <TemplateSectionsDesigner
                    template={activeTemplate}
                    onSaveSuccess={() => {
                        setActiveTemplate(null);
                        refetch();
                    }}
                    onCancel={() => setActiveTemplate(null)}
                />
            ) : (
                /* MAIN DASHBOARD LIST */
                <div className="space-y-4">
                    {/* Filters controls banner */}
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Subject:</span>
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => { setSelectedSubjectId(e.target.value); setPage(1); }}
                                className="h-9 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3"
                            >
                                <option value="">Select Subject</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {createOpen && (
                        /* CREATE POPUP FORM */
                        <form onSubmit={handleCreateHeader} className="bg-white p-6 border border-primary/20 rounded-2xl shadow-md space-y-4 max-w-md">
                            <h3 className="font-black text-sm text-gray-900">Configure Template Header</h3>
                            {createError && <p className="text-[11px] text-red-500 font-bold">{createError}</p>}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Name</label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Mid Term Exam 2026"
                                        required
                                        className="h-9 border-gray-200 mt-1 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Description</label>
                                    <Input
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Optional description"
                                        className="h-9 border-gray-200 mt-1 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-1.5 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setCreateOpen(false)}
                                    variant="ghost"
                                    className="h-8 text-xs font-bold rounded-lg px-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="bg-primary text-white h-8 text-xs font-black rounded-lg px-4"
                                >
                                    Create Draft
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* TABLE OF BLUEPRINTS */}
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="ml-2 text-sm text-gray-500 font-bold">Querying blueprints repository...</span>
                        </div>
                    ) : !data || data.data.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 font-bold">No templates designed for this subject yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-150">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase">Version</th>
                                        <th scope="col" className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {data.data.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs font-black text-gray-900">{t.name}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{t.description || 'No description'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                    t.status === 'PUBLISHED' 
                                                        ? 'bg-green-50 text-green-700 border border-green-155' 
                                                        : 'bg-amber-50 text-amber-700 border border-amber-155'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold">
                                                v{t.version}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-1">
                                                <Button
                                                    onClick={() => setActiveTemplate(t)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black px-2.5"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5 mr-1 inline" /> Edit Sections
                                                </Button>
                                                {t.status === 'PUBLISHED' && (
                                                    <Button
                                                        onClick={() => handleClone(t.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black px-2.5"
                                                    >
                                                        <Copy className="w-3.5 h-3.5 mr-1 inline" /> Clone Draft
                                                    </Button>
                                                )}
                                                {t.status === 'DRAFT' && (
                                                    <Button
                                                        onClick={() => handleDelete(t.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-black px-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TemplateBuilderManager;

import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Search, Plus, UploadCloud, ChevronLeft, ChevronRight, GraduationCap, Loader2 } from 'lucide-react';
import { FolderTree } from '../components/FolderTree';
import { QuestionListItem } from '../components/QuestionListItem';
import { QuestionEditor } from '../components/QuestionEditor';
import { ImportQuestionsDialog } from '../dialogs/ImportQuestionsDialog';
import { useQuestionsList, useSubjectsList, useActiveAcademicYear } from '../hooks/useQuestionBank';

export function QuestionBankManager() {
    const { data: subjects } = useSubjectsList();
    const { data: activeYear } = useActiveAcademicYear();

    const [activeFolderId, setActiveFolderId] = useState<string | null | 'all' | 'root'>('all');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [selectedBloomLevel, setSelectedBloomLevel] = useState('');
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isEditing, setIsEditing] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchText);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Set first subject as default when list loads
    useEffect(() => {
        if (subjects && subjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(subjects[0].id);
        }
    }, [subjects]);

    const activeFolderFilter = activeFolderId === 'all' ? undefined : (activeFolderId === 'root' ? null : activeFolderId);

    const { data, isLoading, refetch } = useQuestionsList({
        folderId: activeFolderFilter,
        subjectId: selectedSubjectId || undefined,
        difficulty: selectedDifficulty || undefined,
        bloomLevel: selectedBloomLevel || undefined,
        status: undefined,
        search: debouncedSearch || undefined,
        page,
        limit
    });

    const handleCreateClick = () => {
        setEditingQuestion(null);
        setIsEditing(true);
    };

    const handleEditClick = (q: any) => {
        setEditingQuestion(q);
        setIsEditing(true);
    };

    const handleSaveSuccess = () => {
        setIsEditing(false);
        setEditingQuestion(null);
        refetch();
    };

    const totalPages = data ? Math.ceil(data.totalCount / limit) : 1;

    return (
        <div className="space-y-6 pb-6">
            {/* HEADER BLOCK */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Question Bank Repository</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-primary" /> 
                        Academic Year: <span className="font-bold text-gray-700">{activeYear?.year_label || 'Seeding Active Year...'}</span>
                    </p>
                </div>
                {!isEditing && (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setImportOpen(true)}
                            variant="outline"
                            className="border-gray-200 text-gray-600 rounded-xl text-xs font-black px-4 flex items-center gap-1.5"
                        >
                            <UploadCloud className="w-4 h-4" /> Import CSV
                        </Button>
                        <Button
                            onClick={handleCreateClick}
                            className="bg-primary text-white rounded-xl text-xs font-black px-4 flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" /> Add Question
                        </Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                /* EDITOR VIEW */
                <QuestionEditor
                    editingQuestion={editingQuestion}
                    subjectId={selectedSubjectId}
                    academicYearId={activeYear?.id || '990b7888-f25a-49d7-b224-15c0fd0db490'}
                    onCancel={() => setIsEditing(false)}
                    onSaveSuccess={handleSaveSuccess}
                />
            ) : (
                /* MANAGER VIEW */
                <div className="grid md:grid-cols-4 gap-6 items-start">
                    {/* LEFT SIDEBAR TREE */}
                    <div className="md:col-span-1">
                        <FolderTree
                            activeFolderId={activeFolderId}
                            onSelectFolder={(id) => { setActiveFolderId(id); setPage(1); }}
                        />
                    </div>

                    {/* RIGHT QUESTIONS VIEWER */}
                    <div className="md:col-span-3 space-y-4">
                        {/* SEARCH & FILTERS BAR */}
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by keywords..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="pl-9 rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Subject:</span>
                                    <select
                                        value={selectedSubjectId}
                                        onChange={(e) => { setSelectedSubjectId(e.target.value); setPage(1); }}
                                        className="h-8 border border-gray-200 rounded-lg text-xs font-bold bg-white text-gray-700 px-2"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Difficulty:</span>
                                    <select
                                        value={selectedDifficulty}
                                        onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(1); }}
                                        className="h-8 border border-gray-200 rounded-lg text-xs font-bold bg-white text-gray-700 px-2"
                                    >
                                        <option value="">All Difficulties</option>
                                        <option value="EASY">Easy</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HARD">Hard</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Taxonomy:</span>
                                    <select
                                        value={selectedBloomLevel}
                                        onChange={(e) => { setSelectedBloomLevel(e.target.value); setPage(1); }}
                                        className="h-8 border border-gray-200 rounded-lg text-xs font-bold bg-white text-gray-700 px-2"
                                    >
                                        <option value="">All Taxonomy</option>
                                        <option value="REMEMBER">Remember</option>
                                        <option value="UNDERSTAND">Understand</option>
                                        <option value="APPLY">Apply</option>
                                        <option value="ANALYZE">Analyze</option>
                                        <option value="EVALUATE">Evaluate</option>
                                        <option value="CREATE">Create</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* QUESTIONS LIST */}
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="ml-2 text-sm text-gray-500 font-bold">Querying questions database...</span>
                            </div>
                        ) : !data || data.data.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-sm text-gray-500 font-bold">No questions found matching criteria.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.data.map((q) => (
                                    <QuestionListItem
                                        key={q.id}
                                        question={q}
                                        onEdit={handleEditClick}
                                    />
                                ))}

                                {/* PAGINATION CONTROLS */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-400 font-bold">
                                        Showing page {page} of {totalPages} ({data.totalCount} questions total)
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-xl text-xs flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Previous
                                        </Button>
                                        <Button
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-xl text-xs flex items-center gap-1"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* IMPORT CSV MODAL */}
            <ImportQuestionsDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                subjectId={selectedSubjectId}
                academicYearId={activeYear?.id || '990b7888-f25a-49d7-b224-15c0fd0db490'}
                folderId={activeFolderFilter ?? null}
                onImportSuccess={refetch}
            />
        </div>
    );
}

export default QuestionBankManager;

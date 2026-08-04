import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Folder, FolderPlus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useQuestionFolders } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';

interface FolderTreeProps {
    activeFolderId: string | null | 'all' | 'root';
    onSelectFolder: (id: string | null | 'all' | 'root') => void;
}

export function FolderTree({ activeFolderId, onSelectFolder }: FolderTreeProps) {
    const { folders, isLoading, createFolder, updateFolder, deleteFolder } = useQuestionFolders();
    const { toast } = useToast();

    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleCreate = async () => {
        if (!newFolderName.trim()) return;
        try {
            await createFolder({ name: newFolderName.trim(), parent_id: null });
            setNewFolderName('');
            setIsCreating(false);
            toast({ title: 'Success', description: 'Folder created successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        try {
            await updateFolder({ id, name: editingName.trim() });
            setEditingFolderId(null);
            toast({ title: 'Success', description: 'Folder renamed successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this folder? All questions inside will be moved to Unorganized.')) return;
        try {
            await deleteFolder(id);
            if (activeFolderId === id) {
                onSelectFolder('all');
            }
            toast({ title: 'Success', description: 'Folder deleted.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-primary" /> Folder Repositories
                </CardTitle>
                <Button
                    onClick={() => setIsCreating(true)}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-bold border-dashed flex items-center gap-1"
                >
                    <FolderPlus className="w-3.5 h-3.5 text-primary" /> Add Folder
                </Button>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
                {/* CREATE FOLDER FIELD */}
                {isCreating && (
                    <div className="flex gap-1.5 items-center p-2 bg-gray-50 rounded-xl border border-gray-200">
                        <Input
                            type="text"
                            size={20}
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder Name"
                            className="h-8 text-xs rounded-lg border-gray-200 bg-white"
                        />
                        <Button onClick={handleCreate} size="icon" className="w-8 h-8 rounded-lg bg-primary text-white">
                            <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button onClick={() => setIsCreating(false)} variant="outline" size="icon" className="w-8 h-8 rounded-lg border-gray-200 text-gray-400">
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}

                {/* ROOT NAVIGATION NODES */}
                <div className="space-y-1">
                    <button
                        onClick={() => onSelectFolder('all')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            activeFolderId === 'all' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Folder className="w-4 h-4 opacity-75" /> All Questions
                    </button>
                    <button
                        onClick={() => onSelectFolder('root')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            activeFolderId === 'root' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Folder className="w-4 h-4 opacity-75" /> Unorganized Questions
                    </button>
                </div>

                <div className="border-t border-gray-50 my-2 pt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase px-3">Custom Directories</span>
                </div>

                {isLoading ? (
                    <div className="text-center py-4 text-xs text-gray-400 font-semibold">Loading directories...</div>
                ) : !folders || folders.length === 0 ? (
                    <div className="text-center py-4 text-[10px] text-gray-400 font-semibold">No folders created yet.</div>
                ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                        {folders.map((folder) => (
                            <div key={folder.id} className="group flex justify-between items-center rounded-xl hover:bg-gray-50">
                                {editingFolderId === folder.id ? (
                                    <div className="flex gap-1 items-center p-1 w-full">
                                        <Input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-7 text-xs rounded-lg border-gray-200 bg-white py-0"
                                        />
                                        <Button onClick={() => handleRename(folder.id)} size="icon" className="w-7 h-7 rounded-lg bg-primary text-white flex-shrink-0">
                                            <Check className="w-3 h-3" />
                                        </Button>
                                        <Button onClick={() => setEditingFolderId(null)} variant="outline" size="icon" className="w-7 h-7 rounded-lg border-gray-200 text-gray-400 flex-shrink-0">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onSelectFolder(folder.id)}
                                            className={`flex-grow text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                                activeFolderId === folder.id ? 'bg-primary/10 text-primary' : 'text-gray-600'
                                            }`}
                                        >
                                            <Folder className="w-4 h-4 opacity-75" /> {folder.name}
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 pr-2 transition">
                                            <Button
                                                onClick={() => { setEditingFolderId(folder.id); setEditingName(folder.name); }}
                                                size="icon"
                                                variant="ghost"
                                                className="w-6 h-6 rounded-md text-gray-400 hover:text-gray-600"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(folder.id)}
                                                size="icon"
                                                variant="ghost"
                                                className="w-6 h-6 rounded-md text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
export default FolderTree;

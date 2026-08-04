import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionFolders } from '../hooks/useQuestionBank';
import { FolderTree } from '../components/FolderTree';
import { ArrowLeft, Folder, Loader2, BarChart2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';

export const QuestionFolderPage: React.FC = () => {
    const navigate = useNavigate();
    const { folders, stats, isLoading } = useQuestionFolders();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null | 'all' | 'root'>('all');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying hierarchical folder statistics...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/app/assessment/questions')}
                    className="rounded-xl border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                        <Folder className="w-6 h-6 text-primary" /> Folder Tree Structures & Stats
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Audit question volumes and difficulty distributions nested under root/child folders.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1">
                    <FolderTree
                        activeFolderId={selectedFolderId}
                        onSelectFolder={setSelectedFolderId}
                    />
                </div>

                {/* Statistics panel */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-gray-50 p-6 flex flex-row items-center justify-between bg-gray-50/50">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart2 className="w-4 h-4 text-primary" /> Active Platform Ingestion Ratios
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Status Distributions</h5>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between font-bold">
                                        <span>Draft Status</span>
                                        <span>{stats?.statusCounts?.DRAFT || 0} questions</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-gray-50 pt-1">
                                        <span>Under Review</span>
                                        <span>{stats?.statusCounts?.UNDER_REVIEW || 0} questions</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-gray-50 pt-1">
                                        <span>Approved / Published</span>
                                        <span>{(stats?.statusCounts?.APPROVED || 0) + (stats?.statusCounts?.PUBLISHED || 0)} questions</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Difficulty Distributions</h5>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between font-bold text-green-700">
                                        <span>Easy Cutoff</span>
                                        <span>{stats?.difficultyDistribution?.EASY || 0} questions</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-gray-50 pt-1 text-amber-700">
                                        <span>Medium Cutoff</span>
                                        <span>{stats?.difficultyDistribution?.MEDIUM || 0} questions</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t border-gray-50 pt-1 text-rose-700">
                                        <span>Hard Cutoff</span>
                                        <span>{stats?.difficultyDistribution?.HARD || 0} questions</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default QuestionFolderPage;

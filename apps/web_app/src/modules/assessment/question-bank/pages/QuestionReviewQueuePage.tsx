import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestions, useSubjectsList } from '../hooks/useQuestionBank';
import { QuestionCard } from '../components/QuestionCard';
import { ArrowLeft, Loader2, GitPullRequest } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export const QuestionReviewQueuePage: React.FC = () => {
    const navigate = useNavigate();
    const { data: subjects } = useSubjectsList();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuestions({
        status: 'UNDER_REVIEW',
        subjectId: selectedSubject || undefined,
        page,
        limit: 10
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
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
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <GitPullRequest className="w-6 h-6 text-primary" /> Questions Review Queue
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Review and authorize questions submitted to the active registry pool.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <select
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
                        className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full sm:w-auto outline-none"
                    >
                        <option value="">All Subjects</option>
                        {subjects?.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-2 text-sm text-gray-500 font-bold">Querying review queue...</span>
                </div>
            ) : !data || data.data.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-premium-sm">
                    <p className="text-xs text-gray-400 font-bold">Review queue is currently empty. No questions pending proctor checks.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.data.map(q => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            onClick={() => navigate(`/app/assessment/questions/${q.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
export default QuestionReviewQueuePage;

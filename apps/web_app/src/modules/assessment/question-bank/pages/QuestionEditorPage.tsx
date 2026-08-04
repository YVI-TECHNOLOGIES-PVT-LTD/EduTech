import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QuestionEditor } from '../components/QuestionEditor';
import { useActiveAcademicYear, useSubjectsList, useQuestionDetail } from '../hooks/useQuestionBank';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export const QuestionEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: activeYear } = useActiveAcademicYear();
    const { data: subjects } = useSubjectsList();
    const { data: questionDetail, isLoading } = useQuestionDetail(id || '');

    const handleSaveSuccess = () => {
        navigate('/app/assessment/questions');
    };

    if (id && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying question details...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {id ? 'Modify Exam Question' : 'Draft New Question'}
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Setup choices, outcomes constraints, Bloom classification tags, and asset media linkings.
                    </p>
                </div>
            </div>

            <QuestionEditor
                editingQuestion={questionDetail || null}
                subjectId={questionDetail?.subject_id || (subjects && subjects[0]?.id) || ''}
                academicYearId={activeYear?.id || '990b7888-f25a-49d7-b224-15c0fd0db490'}
                onCancel={() => navigate('/app/assessment/questions')}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};
export default QuestionEditorPage;

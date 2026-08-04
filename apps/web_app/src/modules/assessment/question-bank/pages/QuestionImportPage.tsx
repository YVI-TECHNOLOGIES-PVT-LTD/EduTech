import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportQuestions, useSubjectsList, useActiveAcademicYear } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';
import { ArrowLeft, UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';

export const QuestionImportPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const { data: subjects } = useSubjectsList();
    const { data: activeYear } = useActiveAcademicYear();
    const { mutateAsync: importCsv, isPending } = useImportQuestions();

    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [csvContent, setCsvContent] = useState('');
    const [report, setReport] = useState<any | null>(null);

    const handleImport = async () => {
        if (!selectedSubjectId || !csvContent.trim() || !activeYear) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please select a subject and populate the CSV dataset.'
            });
            return;
        }

        try {
            const res = await importCsv({
                academicYearId: activeYear.id,
                subjectId: selectedSubjectId,
                folderId: null,
                csv: csvContent
            });
            
            setReport(res);
            toast({
                title: 'Import Completed',
                description: `Successfully ingested ${res.successCount} questions.`
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Import Error',
                description: error.message
            });
        }
    };

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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bulk Question CSV Ingestion</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Upload CSV lists, resolve duplicates warnings, and preview before importing.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden p-6 space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-gray-400 uppercase">Target Course Subject</Label>
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                className="h-10 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-700 px-3 w-full outline-none"
                            >
                                <option value="">Select Target Subject</option>
                                {subjects?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">CSV Ingestion Datastream</Label>
                                <span className="text-[9px] font-black text-primary">Required headers: question_text, question_type, options_text</span>
                            </div>
                            <Textarea
                                placeholder="question_text,question_type,points,difficulty,bloom_level,options_text,correct_options&#10;What is 2+2?,MCQ,1,EASY,REMEMBER,3|4|5,1"
                                value={csvContent}
                                onChange={(e) => setCsvContent(e.target.value)}
                                className="rounded-xl border-gray-200 min-h-[220px] font-mono text-xs"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleImport}
                                disabled={isPending}
                                className="bg-primary text-white rounded-xl text-xs font-black px-6 shadow-premium-sm"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying File...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4" /> Validate & Ingest
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Import Report Widget */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden p-6 space-y-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Ingestion Report
                        </h4>

                        {!report ? (
                            <p className="text-xs text-gray-400 font-bold text-center py-4">No import run has been executed yet.</p>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between font-bold">
                                    <span>Success Count</span>
                                    <span className="text-emerald-600">{report.successCount} rows</span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-gray-50 pt-2">
                                    <span>Errors/Skipped</span>
                                    <span className="text-destructive">{report.errors?.length || 0} rows</span>
                                </div>
                                {report.errors && report.errors.length > 0 && (
                                    <div className="space-y-1.5 mt-2 max-h-[140px] overflow-y-auto pr-1">
                                        <Label className="text-[9px] font-black text-destructive uppercase">Error Logs</Label>
                                        {report.errors.map((err: any, idx: number) => (
                                            <div key={idx} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-700 leading-tight">
                                                Row {err.row}: {err.error}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default QuestionImportPage;

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { useImportQuestions } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ImportQuestionsDialogProps {
    open: boolean;
    onClose: () => void;
    subjectId: string;
    academicYearId: string;
    folderId: string | null;
    onImportSuccess: () => void;
}

export function ImportQuestionsDialog({ open, onClose, subjectId, academicYearId, folderId, onImportSuccess }: ImportQuestionsDialogProps) {
    const { mutateAsync: importQuestions, isPending } = useImportQuestions();
    const { toast } = useToast();
    const [csvText, setCsvText] = useState('');
    const [results, setResults] = useState<{ successCount: number; errors: { row: number; error: string }[] } | null>(null);

    const handleImport = async () => {
        if (!csvText.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please paste CSV content first.' });
            return;
        }

        try {
            const summary = await importQuestions({
                academicYearId,
                subjectId,
                folderId,
                csv: csvText.trim()
            });
            setResults(summary);
            if (summary.successCount > 0 && summary.errors.length === 0) {
                toast({ title: 'Import Complete', description: `${summary.successCount} questions imported successfully.` });
                setCsvText('');
                onImportSuccess();
                onClose();
            } else {
                toast({
                    variant: summary.successCount > 0 ? 'default' : 'destructive',
                    title: 'Import Completed with logs',
                    description: `Successfully loaded ${summary.successCount} items. Errors: ${summary.errors.length}`
                });
                onImportSuccess();
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
        }
    };

    const handleClose = () => {
        setResults(null);
        setCsvText('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <UploadCloud className="w-5 h-5 text-primary" /> Import Questions in Bulk
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400">
                        Paste CSV content to populate your Question Bank repository.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-[10px] font-black text-gray-600 uppercase">Required CSV Template Format:</span>
                        <pre className="text-[9px] text-gray-500 font-mono overflow-x-auto whitespace-pre p-2 bg-white rounded-lg border border-gray-200">
{`question_text,question_type,points,difficulty,bloom_level,options_text,correct_options
Solve for x: 2x=10,MCQ,2,EASY,APPLY,5|8|10,0
Define photosynthesis,SUBJECTIVE,5,MEDIUM,UNDERSTAND,,`}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Paste CSV Contents</Label>
                        <Textarea
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            placeholder="question_text,question_type,points..."
                            className="rounded-xl border-gray-200 min-h-[140px] font-mono text-[11px]"
                        />
                    </div>

                    {/* IMPORT OUTCOME LOGS */}
                    {results && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs font-black">
                                <span className="flex items-center gap-1 text-green-700">
                                    <CheckCircle className="w-4 h-4" /> Success: {results.successCount}
                                </span>
                                {results.errors.length > 0 && (
                                    <span className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="w-4 h-4" /> Failures: {results.errors.length}
                                    </span>
                                )}
                            </div>

                            {results.errors.length > 0 && (
                                <div className="space-y-1 max-h-[120px] overflow-y-auto pt-1 border-t border-gray-200">
                                    {results.errors.map((err, idx) => (
                                        <div key={idx} className="text-[10px] text-red-500 font-medium">
                                            <span className="font-bold">Row {err.row}:</span> {err.error}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 border-t border-gray-50 pt-4 flex gap-2">
                    <Button onClick={handleClose} variant="outline" className="rounded-xl border-gray-200 text-xs font-bold">
                        Cancel / Close
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={isPending}
                        className="bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 px-4"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Ingesting...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" /> Start Ingestion
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
export default ImportQuestionsDialog;

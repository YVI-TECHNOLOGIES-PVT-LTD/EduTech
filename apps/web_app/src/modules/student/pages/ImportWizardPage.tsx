import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Upload, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export function ImportWizardPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState(1);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStep(2);
        }
    };

    const handleImport = () => {
        setStep(3);
    };

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Student Import Wizard</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload CSV or Excel templates to register students in bulk.</p>
                </div>
            </div>

            <Card className="p-6 border-0 shadow-sm max-w-xl space-y-6">
                {step === 1 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
                        <Upload className="w-10 h-10 text-gray-300 mx-auto animate-bounce" />
                        <div>
                            <p className="text-xs font-bold text-gray-700">Drop your file here or browse</p>
                            <p className="text-[10px] text-gray-400 mt-1">Supports CSV, XLS, XLSX formats (Max 5MB)</p>
                        </div>
                        <input type="file" id="bulk-student-file-input" onChange={handleUpload} className="hidden" />
                        <Button onClick={() => document.getElementById('bulk-student-file-input')?.click()} className="bg-primary text-white text-xs font-bold">
                            Select File
                        </Button>
                    </div>
                )}

                {step === 2 && file && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <FileText className="w-8 h-8 text-primary" />
                            <div>
                                <p className="text-xs font-bold text-gray-800">{file.name}</p>
                                <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        {/* Mapping Preview Table */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Column Mapping Preview</p>
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
                                <div className="p-2 bg-gray-50 rounded-lg">CSV: first_name $\rightarrow$ ERP: First Name</div>
                                <div className="p-2 bg-gray-50 rounded-lg">CSV: last_name $\rightarrow$ ERP: Last Name</div>
                                <div className="p-2 bg-gray-50 rounded-lg">CSV: dob $\rightarrow$ ERP: Date of Birth</div>
                                <div className="p-2 bg-gray-50 rounded-lg">CSV: gender $\rightarrow$ ERP: Gender</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <Button onClick={handleImport} className="bg-primary text-white text-xs font-bold">
                                Proceed with Import
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center p-8 space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Import Completed Successfully!</h3>
                            <p className="text-xs text-gray-500 mt-1">45 student records generated inside Student Master database.</p>
                        </div>
                        <div className="pt-4">
                            <Button onClick={() => navigate('/app/students')} className="bg-slate-900 text-white text-xs font-bold">
                                Go to Student List
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ImportWizardPage;

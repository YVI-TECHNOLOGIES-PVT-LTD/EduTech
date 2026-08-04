import React from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Printer, Download, Award, Shield } from 'lucide-react';

interface IdentityCardPreviewProps {
    student: {
        admission_no: string;
        first_name: string;
        last_name: string;
        grade?: string;
        section?: string;
        blood_group?: string;
        emergency_contact?: string;
    };
    barcodeUrl?: string;
}

export const IdentityCardPreview: React.FC<IdentityCardPreviewProps> = ({ student, barcodeUrl }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4 max-w-sm mx-auto">
            {/* The Badge Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 border-0 shadow-xl aspect-[2/3] flex flex-col justify-between select-none">
                {/* School Header */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black tracking-wider uppercase">Vikas Academy</h4>
                        <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-widest">Student Identity</p>
                    </div>
                </div>

                {/* Body details */}
                <div className="my-6 space-y-4 text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                        <span className="text-xl font-black text-indigo-200">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight leading-tight">
                            {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-1">
                            {student.grade || 'Grade 10'} · {student.section || 'Sec A'}
                        </p>
                    </div>
                </div>

                {/* Footer details */}
                <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-left text-[9px] font-bold text-slate-300 uppercase">
                        <div>
                            <span className="text-[7px] text-indigo-400 block font-black">ADMISSION NO</span>
                            {student.admission_no}
                        </div>
                        <div>
                            <span className="text-[7px] text-indigo-400 block font-black">BLOOD GROUP</span>
                            {student.blood_group || 'O+'}
                        </div>
                    </div>

                    {/* Barcode Mock */}
                    <div className="bg-white p-1 rounded flex justify-center mt-2">
                        {barcodeUrl ? (
                            <img src={barcodeUrl} alt="Barcode" className="h-8 object-contain" />
                        ) : (
                            <div className="h-8 bg-slate-100 flex items-center justify-center w-full">
                                <span className="text-[8px] text-slate-400 font-mono tracking-widest">||| | ||| || | |||</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <div className="flex gap-2">
                <Button
                    onClick={handlePrint}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                    <Printer className="w-4 h-4" /> Print Card
                </Button>
                <Button
                    onClick={() => alert('Downloading PDF layout...')}
                    className="flex-1 bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center justify-center gap-1.5 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-all"
                >
                    <Download className="w-4 h-4" /> Download PDF
                </Button>
            </div>
        </div>
    );
};

export default IdentityCardPreview;

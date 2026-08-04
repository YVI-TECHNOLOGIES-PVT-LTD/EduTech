import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, MapPin, Clock, Calendar, Hash, FileText, AlertOctagon, X } from 'lucide-react';
import { format } from 'date-fns';

interface HallTicketProps {
    data: any;
    onClose?: () => void;
}

export const HallTicketDocument = ({ data, onClose }: HallTicketProps) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `HallTicket_${data.student.student_code}_${data.exam.name}`,
    });

    if (!data) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/90 backdrop-blur-sm flex justify-center overflow-y-auto py-8 animate-in fade-in duration-200">
            <div className="relative w-full max-w-[210mm] mx-auto">
                {/* Actions */}
                <div className="sticky top-0 z-10 flex justify-end gap-3 mb-4 px-4 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                        <Printer className="w-5 h-5" /> Print / Download PDF
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="bg-white/10 text-white font-bold p-2 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Printable Area */}
                <div ref={componentRef} className="bg-white text-gray-900 shadow-2xl min-h-[297mm] p-[15mm] relative">
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                            SMS
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Examination Hall Ticket</h1>
                        <h2 className="text-xl font-bold text-gray-600">{data.exam.name}</h2>
                        <p className="text-xs font-mono mt-2 text-gray-400 uppercase tracking-wide">
                            Generated: {format(new Date(), 'dd MMM yyyy HH:mm')}
                        </p>
                    </div>

                    {/* Student Info */}
                    <div className="flex gap-8 mb-8">
                        <div className="w-[120px] h-[150px] border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Affix Photo</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Student Name</label>
                                <div className="text-lg font-black uppercase leading-tight">{data.student.full_name}</div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Roll No / Reg No</label>
                                <div className="text-lg font-mono font-bold text-indigo-900">{data.student.student_code}</div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Gender</label>
                                <div className="font-bold capitalize">{data.student.gender}</div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">DOB</label>
                                <div className="font-bold">{data.student.date_of_birth || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="mb-8">
                        <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Calendar className="w-4 h-4" /> Exam Schedule
                        </h3>
                        <table className="w-full text-sm border-collapse border border-gray-900">
                            <thead className="bg-gray-100 text-gray-900 text-xs uppercase font-bold">
                                <tr>
                                    <th className="border border-gray-900 p-3 text-left w-32">Date</th>
                                    <th className="border border-gray-900 p-3 text-left w-32">Time</th>
                                    <th className="border border-gray-900 p-3 text-left">Subject</th>
                                    <th className="border border-gray-900 p-3 text-left w-48">Hall</th>
                                    <th className="border border-gray-900 p-3 text-center w-20">Seat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.schedules.map((sch: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-gray-900 p-3 font-semibold">
                                            {format(new Date(sch.exam_date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="border border-gray-900 p-3 font-mono text-xs">
                                            {sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}
                                        </td>
                                        <td className="border border-gray-900 p-3 font-bold">
                                            {sch.subject.name}
                                            <div className="text-[10px] font-normal text-gray-500">{sch.subject.code}</div>
                                        </td>
                                        <td className="border border-gray-900 p-3">
                                            {sch.hall ? (
                                                <>
                                                    <div className="font-bold text-xs">{sch.hall.hall_name}</div>
                                                    <div className="text-[10px] text-gray-500">{sch.hall.location}</div>
                                                </>
                                            ) : (
                                                <span className="text-red-500 font-bold text-[10px] uppercase">Not Seated</span>
                                            )}
                                        </td>
                                        <td className="border border-gray-900 p-3 text-center font-black text-lg">
                                            {sch.seat_number || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Instructions */}
                    <div className="border border-gray-200 bg-gray-50 p-6">
                        <h3 className="font-black text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-gray-400" /> Instructions to Candidates
                        </h3>
                        <ul className="list-disc pl-4 space-y-1.5 text-[11px] font-medium text-gray-600 leading-relaxed text-justify">
                            {data.instructions?.map((ins: string, i: number) => (
                                <li key={i}>{ins}</li>
                            ))}
                            <li>Candidate must carry this Hall Ticket and a valid ID proof to the exam center.</li>
                            <li>Malpractice of any kind will attract severe disciplinary action.</li>
                            <li>Electronic gadgets (Calculators, Mobile Phones, Smart Watches) are strictly prohibited unless specified.</li>
                            <li>Late arrival beyond 15 minutes of commencement will not be entertained.</li>
                        </ul>
                    </div>

                    {/* Signatures */}
                    <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] flex justify-between items-end">
                        <div className="text-center">
                            <div className="w-40 border-b border-gray-400 mb-2"></div>
                            <div className="text-[10px] font-bold uppercase text-gray-400">Student Signature</div>
                        </div>
                        <div className="text-center">
                            <div className="w-40 border-b border-gray-400 mb-2"></div>
                            <div className="text-[10px] font-bold uppercase text-gray-400">Controller of Examinations</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

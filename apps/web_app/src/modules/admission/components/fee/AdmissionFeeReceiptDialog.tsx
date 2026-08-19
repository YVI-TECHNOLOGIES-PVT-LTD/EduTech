import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Building2,
  Receipt,
  User,
  GraduationCap,
  Calendar,
  CreditCard,
  Banknote,
  FileCheck2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  useGetApplicationReceiptQuery,
  ApplicationItem,
} from '@/shared/api/admission.api';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface AdmissionFeeReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationItem | null;
}

export const AdmissionFeeReceiptDialog: React.FC<AdmissionFeeReceiptDialogProps> = ({
  open,
  onOpenChange,
  application,
}) => {
  const applicationId = application?.application_id || application?.id || '';
  const receiptRef = useRef<HTMLDivElement>(null);

  const {
    data: receipt,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetApplicationReceiptQuery(applicationId, {
    skip: !open || !applicationId,
  });

  if (!application) return null;

  const lead = application.lead;
  const studentName =
    receipt?.student_name ||
    application.student_name ||
    lead?.student_name ||
    [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
    'Applicant';
  const applicationNumber =
    receipt?.application_number || application.application_number || 'APP-PENDING';
  const gradeName = receipt?.grade_name || application.grade_name || lead?.grade_name || '—';
  const academicYearName =
    receipt?.academic_year_name || application.academic_year?.academic_year_name || '—';
  const orgName = receipt?.org_name || 'EduTrack International Academy';
  const receiptNumber = receipt?.receipt_number || `REC-${applicationId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/30 backdrop-blur-xs duration-100"
        className="w-[calc(100vw-32px)] sm:w-[650px] max-w-[650px] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        {/* Header Action Bar */}
        <div className="flex-shrink-0 px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Admission Fee Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !receipt}
              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5 shadow-sm"
              title="Print formal receipt document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Receipt Printable Viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 bg-slate-100/70 dark:bg-slate-950 flex flex-col items-center custom-scrollbar">
          {isLoading ? (
            <div className="my-auto text-center p-12 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Generating official receipt...</p>
            </div>
          ) : error || !receipt ? (
            <div className="my-auto text-center p-8 bg-white dark:bg-slate-900 rounded-xl border max-w-sm space-y-3 shadow-sm">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Receipt Unavailable
              </div>
              <p className="text-xs text-slate-500">
                Payment has not been recorded yet, or fee settlement is still pending.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-8">
                Retry
              </Button>
            </div>
          ) : (
            <div
              ref={receiptRef}
              className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 space-y-6 text-xs print:m-0 print:p-0 print:shadow-none print:border-none"
            >
              {/* Institution Header */}
              <div className="border-b border-slate-200 pb-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                      {orgName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Front Office Admission & Enrolment Desk
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Official Fee Acknowledgment & Settlement Voucher
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PAID / SETTLED
                  </span>
                  <div className="font-mono text-[11px] font-bold text-slate-900 mt-1">
                    {receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Date: {new Date(receipt.payment_date || receipt.issued_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Student & Application Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Student Name
                  </span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {studentName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Application #
                  </span>
                  <span className="font-mono font-bold text-blue-700 block mt-0.5">
                    {applicationNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Grade & Year
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {gradeName} ({academicYearName})
                  </span>
                </div>

                {receipt.contact_name && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Parent / Guardian
                    </span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {receipt.contact_name}
                    </span>
                  </div>
                )}

                {receipt.contact_phone && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="font-mono text-slate-800 block mt-0.5">
                      {receipt.contact_phone}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Payment Mode
                  </span>
                  <span className="font-bold uppercase text-slate-800 block mt-0.5">
                    {receipt.payment_mode.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Itemized Fee Breakdown Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Fee Particulars
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 pl-3">Description</th>
                        <th className="p-2.5 text-right pr-3">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr>
                        <td className="p-2.5 pl-3 text-slate-700">
                          Admission Application Registration Fee
                        </td>
                        <td className="p-2.5 text-right pr-3 font-mono font-medium">
                          ₹{receipt.application_fee.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 pl-3 text-slate-700">
                          Administrative & Entrance Processing Fee
                        </td>
                        <td className="p-2.5 text-right pr-3 font-mono font-medium">
                          ₹{receipt.processing_fee.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="p-2.5 pl-3 text-slate-900 uppercase">
                          Total Amount Paid
                        </td>
                        <td className="p-2.5 text-right pr-3 font-mono text-emerald-700 text-sm">
                          ₹{receipt.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Transaction & Settlement Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Transaction Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {receipt.transaction_reference}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Settled On:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(receipt.payment_date).toLocaleString('en-IN')}
                  </span>
                </div>
                {receipt.remarks && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Remarks:</span>
                    <span className="italic text-slate-700">{receipt.remarks}</span>
                  </div>
                )}
              </div>

              {/* Signatures & Footer Note */}
              <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-400">
                <div>
                  <p>Computer-generated receipt issued by EduTrack ERP.</p>
                  <p>No physical signature required for standard verification.</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-300 pb-1 mb-1 text-center font-semibold text-slate-700">
                    Authorized Signatory
                  </div>
                  <p>Front Office Accounts</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

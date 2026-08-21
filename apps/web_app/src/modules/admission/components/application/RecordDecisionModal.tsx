import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useMakeDecisionMutation,
  ApplicationItem,
  AdmissionDecisionStatus,
  DecisionResponseDto,
} from '@/shared/api/admission.api';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Percent,
  Hash,
} from 'lucide-react';

interface RecordDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationItem | null;
  initialDecision?: DecisionResponseDto | null;
  onSuccess?: (decision: DecisionResponseDto) => void;
}

export const RecordDecisionModal: React.FC<RecordDecisionModalProps> = ({
  isOpen,
  onClose,
  application,
  initialDecision,
  onSuccess,
}) => {
  const [decisionStatus, setDecisionStatus] = useState<AdmissionDecisionStatus>('approved');
  const [decisionDate, setDecisionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [offerExpiryDate, setOfferExpiryDate] = useState<string>('');
  const [waitlistPosition, setWaitlistPosition] = useState<string>('');
  const [scholarshipPercentage, setScholarshipPercentage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [makeDecision, { isLoading }] = useMakeDecisionMutation();

  useEffect(() => {
    if (isOpen) {
      if (initialDecision) {
        setDecisionStatus(initialDecision.decision_status as AdmissionDecisionStatus);
        setDecisionDate(
          initialDecision.decision_date
            ? new Date(initialDecision.decision_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        );
        setReason(initialDecision.reason || '');
        setRemarks(initialDecision.remarks || '');
        setOfferExpiryDate(
          initialDecision.offer_expiry_date
            ? new Date(initialDecision.offer_expiry_date).toISOString().split('T')[0]
            : '',
        );
        setWaitlistPosition(
          initialDecision.waitlist_position !== null &&
            initialDecision.waitlist_position !== undefined
            ? String(initialDecision.waitlist_position)
            : '',
        );
        setScholarshipPercentage(
          initialDecision.scholarship_percentage !== null &&
            initialDecision.scholarship_percentage !== undefined
            ? String(initialDecision.scholarship_percentage)
            : '',
        );
      } else {
        setDecisionStatus('approved');
        setDecisionDate(new Date().toISOString().split('T')[0]);
        setReason('');
        setRemarks('');
        // Default offer expiry 14 days out
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 14);
        setOfferExpiryDate(defaultExpiry.toISOString().split('T')[0]);
        setWaitlistPosition('');
        setScholarshipPercentage('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialDecision]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setErrorMsg(null);

    const appId = application.application_id || application.id;
    if (!appId) {
      setErrorMsg('Invalid application identifier.');
      return;
    }

    // Client-side pre-validations
    if (decisionStatus === 'waitlisted' && waitlistPosition) {
      const pos = parseInt(waitlistPosition, 10);
      if (isNaN(pos) || pos < 1) {
        setErrorMsg('Waitlist position must be a positive number.');
        return;
      }
    }

    if (scholarshipPercentage) {
      const pct = parseFloat(scholarshipPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setErrorMsg('Scholarship percentage must be between 0 and 100.');
        return;
      }
    }

    try {
      const payload: any = {
        applicationId: appId,
        decision_status: decisionStatus,
        decision_date: decisionDate ? new Date(decisionDate).toISOString() : undefined,
        reason: reason.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      if (decisionStatus === 'approved') {
        if (offerExpiryDate) {
          payload.offer_expiry_date = new Date(offerExpiryDate).toISOString();
        }
        if (scholarshipPercentage) {
          payload.scholarship_percentage = parseFloat(scholarshipPercentage);
        }
      } else if (decisionStatus === 'waitlisted') {
        if (waitlistPosition) {
          payload.waitlist_position = parseInt(waitlistPosition, 10);
        }
      }

      const result = await makeDecision(payload).unwrap();
      onSuccess?.(result);
      onClose();
    } catch (err: any) {
      console.error('[RecordDecision Error]:', err);
      setErrorMsg(
        err?.data?.error ||
          err?.data?.message ||
          'Failed to record admission decision. Please ensure all documents are verified before approving.',
      );
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {initialDecision ? 'Update Admission Decision' : 'Record Admission Decision'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Render an authoritative committee decision for application{' '}
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {application.application_number}
            </span>{' '}
            ({application.student_name || application.lead?.student_name || 'Applicant'})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800 rounded-lg flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Decision Status Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Decision Status <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecisionStatus('approved')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                  decisionStatus === 'approved'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <div>Approve</div>
                  <div className="text-[10px] font-normal text-slate-400">Offer admission</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionStatus('waitlisted')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                  decisionStatus === 'waitlisted'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <div>Waitlist</div>
                  <div className="text-[10px] font-normal text-slate-400">Hold on waitlist</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionStatus('rejected')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                  decisionStatus === 'rejected'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div>
                  <div>Reject</div>
                  <div className="text-[10px] font-normal text-slate-400">Decline admission</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionStatus('withdrawn')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                  decisionStatus === 'withdrawn'
                    ? 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 ring-2 ring-slate-500/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <div>Withdraw</div>
                  <div className="text-[10px] font-normal text-slate-400">Applicant withdrew</div>
                </div>
              </button>
            </div>
          </div>

          {/* Decision Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Decision Date
            </Label>
            <Input
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Conditional: Approved fields */}
          {decisionStatus === 'approved' && (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Offer Expiry Date
                </Label>
                <Input
                  type="date"
                  value={offerExpiryDate}
                  onChange={(e) => setOfferExpiryDate(e.target.value)}
                  className="text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  Scholarship %
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 15"
                  value={scholarshipPercentage}
                  onChange={(e) => setScholarshipPercentage(e.target.value)}
                  className="text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          {/* Conditional: Waitlisted fields */}
          {decisionStatus === 'waitlisted' && (
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  Waitlist Position
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  value={waitlistPosition}
                  onChange={(e) => setWaitlistPosition(e.target.value)}
                  className="text-xs h-9 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Reason {decisionStatus === 'rejected' && <span className="text-red-500">*</span>}
            </Label>
            <Input
              placeholder={
                decisionStatus === 'approved'
                  ? 'e.g. Academic Excellence & Assessment Merit'
                  : decisionStatus === 'rejected'
                    ? 'e.g. Age criteria not met / Incomplete prerequisite'
                    : 'e.g. High enrollment volume in selected grade'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Remarks / Internal Notes
            </Label>
            <Textarea
              placeholder="Enter official decision notes or committee remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className={`text-xs font-semibold gap-1.5 ${
                decisionStatus === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : decisionStatus === 'rejected'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : decisionStatus === 'waitlisted'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialDecision ? 'Save Decision Changes' : 'Confirm & Record Decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

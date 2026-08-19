import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  Paperclip,
  Save,
  X,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';
import type { Applicant360View } from '../../utils/applicant360.mapper';
import { APPLICATION_FIELDS, isFieldEditable } from '../../utils/applicationFields.registry';
import { useUpdateApplicationMutation } from '@/shared/api/admission.api';

interface ParentReadOnlyApplicationViewProps {
  application: any;
  view?: Applicant360View | null;
  canParentEdit?: boolean;
  editableFields?: string[];
  onRefetch?: () => void;
}

export const ParentReadOnlyApplicationView: React.FC<ParentReadOnlyApplicationViewProps> = ({
  application,
  view,
  canParentEdit = false,
  editableFields = [],
  onRefetch,
}) => {
  const navigate = useNavigate();
  const [updateApplication, { isLoading: isSaving }] = useUpdateApplicationMutation();

  const appId = application?.application_id || application?.id;
  const appNumber =
    application?.application_number ||
    application?.applicationNumber ||
    (appId ? `APP-${appId.slice(0, 8).toUpperCase()}` : 'APP-2026');
  const appStatus = application?.status || 'submitted';

  const isCorrectionAuthorized = canParentEdit && editableFields.length > 0;

  // Local Form State for Authorized Edits
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.keys(APPLICATION_FIELDS).forEach((key) => {
      initial[key] = APPLICATION_FIELDS[key].getValue(application, view);
    });
    return initial;
  });

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCorrections = async () => {
    if (!appId || !isCorrectionAuthorized) return;
    setSaveError(null);
    setSaveSuccess(null);

    // Build payload strictly containing ONLY authorized fields
    const payload: Record<string, any> = {};
    editableFields.forEach((fieldKey) => {
      if (formData[fieldKey] !== undefined) {
        payload[fieldKey] = formData[fieldKey];
      }
    });

    if (Object.keys(payload).length === 0) {
      setSaveError('No authorized changes to submit.');
      return;
    }

    try {
      await updateApplication({ id: appId, body: payload }).unwrap();
      setSaveSuccess('Corrections saved and resubmitted successfully!');
      if (onRefetch) onRefetch();
    } catch (err: any) {
      setSaveError(err?.data?.error || err?.message || 'Failed to save corrections.');
    }
  };

  const renderField = (fieldKey: string) => {
    const def = APPLICATION_FIELDS[fieldKey];
    if (!def) return null;

    const editable = isCorrectionAuthorized && isFieldEditable(fieldKey, editableFields);
    const currentValue = formData[fieldKey] ?? def.getValue(application, view);

    return (
      <div key={fieldKey} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {def.label}
          </span>
          {editable && (
            <Badge
              variant="outline"
              className="text-[9px] font-bold text-amber-600 bg-amber-50 border-amber-300 py-0"
            >
              EDITABLE
            </Badge>
          )}
        </div>

        {editable ? (
          fieldKey === 'previous_school_address' ? (
            <textarea
              rows={2}
              value={currentValue}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 focus:ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-white outline-none resize-none"
            />
          ) : fieldKey === 'previous_school_board' ? (
            <select
              value={currentValue}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-amber-300 focus:ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">-- Select Board --</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="STATE BOARD">State Board</option>
              <option value="IB">IB</option>
              <option value="CAMBRIDGE">Cambridge (IGCSE)</option>
              <option value="NIOS">NIOS</option>
              <option value="OTHER">Other</option>
            </select>
          ) : (
            <Input
              value={currentValue}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              className="h-9 text-xs font-semibold rounded-xl border-amber-300 focus:ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-white"
            />
          )
        ) : (
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
            {currentValue || '—'}
          </span>
        )}
      </div>
    );
  };

  const submittedDate =
    application?.application_date || application?.submitted_at || application?.created_at
      ? new Date(
          application.application_date || application.submitted_at || application.created_at,
        ).toLocaleDateString()
      : 'Recently';

  const documentsList = view?.documentChecklist || [
    { title: "Student's Aadhaar Card", file_name: 'aadhaar_scan.pdf' },
    { title: 'Birth Certificate', file_name: 'birth_certificate.pdf' },
    { title: "Student's Photo", file_name: 'student_photo.jpg' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/app/admissions/my')}
          className="flex items-center gap-2 text-xs font-bold border-border text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Applications</span>
        </Button>

        <Badge
          variant="outline"
          className="text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-200"
        >
          {appNumber}
        </Badge>
      </div>

      {/* Header Banner */}
      <Card className="p-6 rounded-2xl border-border/80 shadow-sm space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Application Details
              </h1>
              <span
                className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(
                  appStatus,
                )}`}
              >
                {formatStatusLabel(appStatus)}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Submitted on <span className="font-bold text-foreground">{submittedDate}</span> •
              Application Number:{' '}
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {appNumber}
              </span>
            </p>
          </div>
        </div>

        {/* Read-Only or Correction Banner */}
        {isCorrectionAuthorized ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-300 text-amber-900 dark:text-amber-200 space-y-1 text-xs">
            <div className="flex items-center space-x-2 font-extrabold">
              <Unlock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Correction Authorized by Front Office</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 font-medium pl-6 leading-relaxed">
              Front Office has requested corrections to this application. Only the highlighted
              fields can be edited. All other fields remain locked.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/80 flex items-center space-x-3 text-muted-foreground text-xs font-medium">
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>
              This application is in <strong className="text-foreground">Read-Only Mode</strong>{' '}
              because it has already been submitted to the admission office.
            </span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{saveError}</span>
          </div>
        )}
      </Card>

      {/* 1. STUDENT INFORMATION */}
      <Card className="p-6 rounded-2xl border-border/80 shadow-sm space-y-5 bg-card">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            1. Student Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {renderField('student_name')}
          {renderField('date_of_birth')}
          {renderField('gender')}
          {renderField('nationality')}
          {renderField('grade_applied_for')}
          {renderField('curriculum_preference')}
          {renderField('academic_year_id')}
        </div>
      </Card>

      {/* 2. PARENT / GUARDIAN INFORMATION */}
      <Card className="p-6 rounded-2xl border-border/80 shadow-sm space-y-5 bg-card">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Phone className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            2. Parent / Guardian Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {renderField('parent_name')}
          {renderField('contact_relationship')}
          {renderField('parent_phone')}
          {renderField('parent_email')}
        </div>
      </Card>

      {/* 3. ACADEMIC INFORMATION */}
      <Card className="p-6 rounded-2xl border-border/80 shadow-sm space-y-5 bg-card">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            3. Academic Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {renderField('previous_school_name')}
          {renderField('previous_school_board')}
          {renderField('previous_grade')}
          {renderField('previous_school_year')}
          <div className="sm:col-span-2 md:col-span-3">
            {renderField('previous_school_address')}
          </div>
        </div>
      </Card>

      {/* 4. SUBMITTED DOCUMENTS RECORD */}
      <Card className="p-6 rounded-2xl border-border/80 shadow-sm space-y-5 bg-card">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Paperclip className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            4. Submitted Documents Record
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {documentsList.map((doc: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex items-center space-x-3"
            >
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground block truncate">
                  {doc.title || doc.name || `Document ${i + 1}`}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Submitted
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Fee & Settlement Record */}
      <Card className="p-6 border border-border/80 shadow-sm rounded-3xl bg-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              5. Fee &amp; Settlement Record
            </h2>
          </div>
          <Badge
            variant={
              application?.payment?.payment_status === 'paid' ||
              (application as any)?.fee_status === 'paid'
                ? 'success'
                : 'warning'
            }
          >
            {(
              application?.payment?.payment_status ||
              (application as any)?.fee_status ||
              'PENDING'
            ).toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              SETTLED AMOUNT
            </span>
            <span className="text-sm font-bold text-foreground block">
              ₹
              {Number(application?.payment?.amount || 1200).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              PAYMENT MODE
            </span>
            <span className="text-sm font-bold text-foreground block uppercase">
              {application?.payment?.payment_mode || 'UPI / CARD'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              TRANSACTION REF
            </span>
            <span className="text-xs font-mono font-bold text-foreground block truncate">
              {application?.payment?.transaction_reference || 'TXN-SETTLED'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              SETTLEMENT DATE
            </span>
            <span className="text-sm font-bold text-foreground block">
              {application?.payment?.payment_date
                ? new Date(application.payment.payment_date).toLocaleDateString('en-IN')
                : application?.created_at
                  ? new Date(application.created_at).toLocaleDateString('en-IN')
                  : '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Action Bar when Corrections are Authorized */}
      {isCorrectionAuthorized && (
        <div className="sticky bottom-4 p-4 bg-card border border-amber-300 shadow-xl rounded-2xl flex items-center justify-between gap-4">
          <div className="text-xs font-bold text-foreground">
            Modifying {editableFields.length} authorized field(s)
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/admissions/my')}
              className="h-9 text-xs font-bold rounded-xl"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSaveCorrections}
              className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Resubmit Corrections'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

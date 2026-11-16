import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calculator,
  UserCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useRecordAssessmentMutation,
  useGetExaminersQuery,
  useGetAssessmentConfigsQuery,
} from '@/shared/api/admission.api';
import { useLanguage } from '@/context/LanguageContext';

export interface MarksEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    application_id: string;
    application_number: string;
    student_name?: string | null;
    grade_name?: string | null;
    academic_year_name?: string | null;
    current_marks?: number | null;
    current_max_marks?: number | null;
    current_result?: string | null;
    current_remarks?: string | null;
    current_assessed_by?: string | null;
    current_date?: string | null;
    config_id?: string | null;
  } | null;
  onSuccess?: () => void;
}

export const MarksEntryModal: React.FC<MarksEntryModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [recordAssessment, { isLoading: isSubmitting }] = useRecordAssessmentMutation();
  const { data: examinersData, isLoading: examinersLoading } = useGetExaminersQuery();
  const { data: configsData } = useGetAssessmentConfigsQuery();

  const [marksObtained, setMarksObtained] = useState<string>('');
  const [maximumMarks, setMaximumMarks] = useState<string>('100');
  const [passMarks, setPassMarks] = useState<number>(40);
  const [result, setResult] = useState<string>('pass');
  const [assessedBy, setAssessedBy] = useState<string>('');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [remarks, setRemarks] = useState<string>('');
  const [manualResultOverride, setManualResultOverride] = useState<boolean>(false);

  const examiners = examinersData?.data || [];
  const configs = configsData?.data || [];

  // Initialize form values when application changes
  useEffect(() => {
    if (application) {
      setMarksObtained(
        application.current_marks !== null && application.current_marks !== undefined
          ? String(application.current_marks)
          : '',
      );
      setMaximumMarks(
        application.current_max_marks !== null && application.current_max_marks !== undefined
          ? String(application.current_max_marks)
          : '100',
      );
      setResult(application.current_result || 'pass');
      setRemarks(application.current_remarks || '');
      setAssessedBy(application.current_assessed_by || '');
      setAssessmentDate(
        application.current_date
          ? application.current_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
      );
      setManualResultOverride(Boolean(application.current_result));

      // Match config to find pass marks
      if (application.config_id) {
        const matched = configs.find((c) => c.config_id === application.config_id);
        if (matched?.pass_marks) setPassMarks(Number(matched.pass_marks));
        if (matched?.maximum_marks && !application.current_max_marks) {
          setMaximumMarks(String(matched.maximum_marks));
        }
      }
    }
  }, [application, configs]);

  // Realtime Percentage & Grade Computation
  const { percentage, grade, gradeBadgeClass } = useMemo(() => {
    const obtained = parseFloat(marksObtained);
    const max = parseFloat(maximumMarks);

    if (isNaN(obtained) || isNaN(max) || max <= 0) {
      return { percentage: null, grade: null, gradeBadgeClass: '' };
    }

    const pct = Number(((obtained / max) * 100).toFixed(2));
    let g = 'F';
    let badgeClass =
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400';

    if (pct >= 90) {
      g = 'A+';
      badgeClass =
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400';
    } else if (pct >= 80) {
      g = 'A';
      badgeClass =
        'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-400';
    } else if (pct >= 70) {
      g = 'B';
      badgeClass =
        'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400';
    } else if (pct >= 60) {
      g = 'C';
      badgeClass =
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400';
    } else if (pct >= 50) {
      g = 'D';
      badgeClass =
        'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400';
    }

    return { percentage: pct, grade: g, gradeBadgeClass: badgeClass };
  }, [marksObtained, maximumMarks]);

  // Auto-suggest result based on pass threshold unless manually overridden
  useEffect(() => {
    if (!manualResultOverride && percentage !== null) {
      const obtained = parseFloat(marksObtained);
      if (!isNaN(obtained)) {
        setResult(obtained >= passMarks ? 'pass' : 'fail');
      }
    }
  }, [percentage, marksObtained, passMarks, manualResultOverride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    const obtainedNum = parseFloat(marksObtained);
    const maxNum = parseFloat(maximumMarks);

    if (isNaN(obtainedNum) || obtainedNum < 0) {
      toast.error('Please enter a valid non-negative marks score');
      return;
    }

    if (isNaN(maxNum) || maxNum <= 0) {
      toast.error('Maximum marks must be greater than 0');
      return;
    }

    if (obtainedNum > maxNum) {
      toast.error(`Marks obtained (${obtainedNum}) cannot exceed maximum marks (${maxNum})`);
      return;
    }

    try {
      await recordAssessment({
        applicationId: application.application_id,
        config_id: application.config_id || undefined,
        assessment_date: assessmentDate,
        maximum_marks: maxNum,
        marks_obtained: obtainedNum,
        percentage: percentage !== null ? percentage : undefined,
        result: result as any,
        remarks: remarks.trim() || undefined,
        assessed_by: assessedBy ? assessedBy : undefined, // Uses selected staff_id
      }).unwrap();

      toast.success(
        t('assessment.recordedSuccess', 'Assessment marks recorded and evaluated successfully!'),
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Record Assessment Error:', err);
      toast.error(err?.data?.error || err?.message || 'Failed to record assessment score');
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border shadow-2xl rounded-2xl bg-card">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white border border-white/30">
                {t('assessment.evaluationDesk', 'Examination & Evaluation Desk')}
              </span>
              <span className="text-xs font-mono opacity-90">{application.application_number}</span>
            </div>
            <DialogTitle className="text-xl font-black text-white tracking-tight pt-2">
              {application.student_name || t('common.candidate', 'Candidate Evaluation')}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-xs font-medium">
              {application.grade_name
                ? `${t('common.grade', 'Grade')}: ${application.grade_name}`
                : ''}{' '}
              {application.academic_year_name ? `• ${application.academic_year_name}` : ''}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Score & Calculation Matrix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.marksObtained', 'Marks Obtained')}{' '}
                <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max={maximumMarks || '100'}
                  placeholder="e.g. 85"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  className="font-bold text-base pr-10 rounded-xl"
                  required
                  autoFocus
                />
                <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.maximumMarks', 'Maximum Marks')}{' '}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="100"
                value={maximumMarks}
                onChange={(e) => setMaximumMarks(e.target.value)}
                className="font-bold text-base rounded-xl"
                required
              />
            </div>
          </div>

          {/* Realtime Grade & Percentage Preview Card */}
          {percentage !== null && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between animate-in fade-in duration-200">
              <div className="space-y-0.5">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  {t('assessment.scorePercentage', 'Percentage & Performance')}
                </div>
                <div className="text-2xl font-black tracking-tight text-foreground">
                  {percentage}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('assessment.passMarksRequired', 'Passing Threshold')}: {passMarks} /{' '}
                  {maximumMarks}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  {t('assessment.gradeAwarded', 'Grade')}
                </div>
                <Badge
                  variant="outline"
                  className={`text-sm font-black px-3 py-1 uppercase border shadow-sm ${gradeBadgeClass}`}
                >
                  <Award className="w-3.5 h-3.5 mr-1" />
                  {t('assessment.gradeLabel', 'Grade')} {grade}
                </Badge>
              </div>
            </div>
          )}

          {/* Assessment Result & Dynamic Examiner Allocation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.resultDecision', 'Assessment Result')}
              </Label>
              <Select
                value={result}
                onValueChange={(val) => {
                  setResult(val);
                  setManualResultOverride(true);
                }}
              >
                <SelectTrigger className="rounded-xl font-semibold text-xs">
                  <SelectValue placeholder="Select Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass" className="font-semibold text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {t('assessment.pass', 'Pass / Qualified')}
                    </span>
                  </SelectItem>
                  <SelectItem value="fail" className="font-semibold text-rose-600">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {t('assessment.fail', 'Fail / Not Qualified')}
                    </span>
                  </SelectItem>
                  <SelectItem value="recommended" className="font-semibold text-blue-600">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      {t('assessment.recommended', 'Recommended for Admission')}
                    </span>
                  </SelectItem>
                  <SelectItem value="not_recommended" className="font-semibold text-amber-600">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {t('assessment.notRecommended', 'Not Recommended')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.examinerEvaluator', 'Assigned Examiner / Staff')}
              </Label>
              <Select value={assessedBy} onValueChange={(val) => setAssessedBy(val)}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue
                    placeholder={
                      examinersLoading
                        ? t('common.loading', 'Loading staff...')
                        : t('assessment.selectExaminer', 'Select Examiner')
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {examiners.map((staff) => (
                    <SelectItem key={staff.staff_id} value={staff.staff_id} className="text-xs">
                      <span className="font-bold">
                        {staff.first_name} {staff.last_name || ''}
                      </span>{' '}
                      {staff.designation_name ? (
                        <span className="text-muted-foreground text-[10px]">
                          ({staff.designation_name})
                        </span>
                      ) : null}
                    </SelectItem>
                  ))}
                  {examiners.length === 0 && !examinersLoading && (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      {t('assessment.noExaminers', 'No staff found in organization')}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assessment Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {t('assessment.assessmentDate', 'Assessment Date')}
            </Label>
            <div className="relative">
              <Input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="rounded-xl text-xs pr-10"
                required
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {t('assessment.evaluatorRemarks', 'Evaluator Remarks & Qualitative Feedback')}
            </Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Demonstrated strong analytical and problem-solving skills in mathematics..."
              className="rounded-xl text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !marksObtained}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isSubmitting
                ? t('common.saving', 'Recording...')
                : t('assessment.saveAndPublish', 'Save Assessment & Grade')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarksEntryModal;

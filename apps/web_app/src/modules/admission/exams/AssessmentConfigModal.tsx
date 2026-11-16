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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveAssessmentConfigMutation, AssessmentConfigDto } from '@/shared/api/admission.api';
import { useLanguage } from '@/context/LanguageContext';

export interface AssessmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AssessmentConfigDto | null;
  onSuccess?: () => void;
}

export const AssessmentConfigModal: React.FC<AssessmentConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [saveConfig, { isLoading: isSaving }] = useSaveAssessmentConfigMutation();

  const [assessmentRequired, setAssessmentRequired] = useState<boolean>(true);
  const [assessmentMode, setAssessmentMode] = useState<string>('written');
  const [resultType, setResultType] = useState<string>('marks');
  const [maximumMarks, setMaximumMarks] = useState<string>('100');
  const [passMarks, setPassMarks] = useState<string>('40');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (config) {
      setAssessmentRequired(config.assessment_required ?? true);
      setAssessmentMode(config.assessment_mode || 'written');
      setResultType(config.result_type || 'marks');
      setMaximumMarks(
        config.maximum_marks !== null && config.maximum_marks !== undefined
          ? String(config.maximum_marks)
          : '100',
      );
      setPassMarks(
        config.pass_marks !== null && config.pass_marks !== undefined
          ? String(config.pass_marks)
          : '40',
      );
      setIsActive(config.is_active ?? true);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.academic_year_grade_id) {
      toast.error('Academic year grade is required for configuration');
      return;
    }

    const maxNum = parseFloat(maximumMarks);
    const passNum = parseFloat(passMarks);

    if (isNaN(maxNum) || maxNum <= 0) {
      toast.error('Maximum marks must be greater than 0');
      return;
    }

    if (isNaN(passNum) || passNum < 0) {
      toast.error('Pass marks cannot be negative');
      return;
    }

    if (passNum > maxNum) {
      toast.error(`Pass marks (${passNum}) cannot exceed maximum marks (${maxNum})`);
      return;
    }

    try {
      await saveConfig({
        academic_year_grade_id: config.academic_year_grade_id,
        assessment_required: assessmentRequired,
        assessment_mode: assessmentMode,
        result_type: resultType,
        maximum_marks: maxNum,
        pass_marks: passNum,
        is_active: isActive,
      }).unwrap();

      toast.success(t('assessment.configSaved', 'Assessment configuration saved successfully!'));
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Save Assessment Config Error:', err);
      toast.error(err?.data?.error || err?.message || 'Failed to save assessment configuration');
    }
  };

  if (!config) return null;

  const gradeName = config.academic_year_grades?.grades?.grade_name || 'Selected Grade';
  const yearName = config.academic_year_grades?.academic_years?.year_name || 'Academic Year';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-border shadow-2xl rounded-2xl bg-card">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-border">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                {t('assessment.gradeConfiguration', 'Grade Assessment Rules')}
              </span>
            </div>
            <DialogTitle className="text-xl font-black text-white tracking-tight pt-1">
              {gradeName}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs font-medium">
              {yearName} •{' '}
              {t('assessment.configSubtitle', 'Configure examination rules & scoring criteria')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Assessment Required Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground cursor-pointer">
                {t('assessment.assessmentRequired', 'Assessment Required for Admission')}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {assessmentRequired
                  ? t(
                      'assessment.requiredActiveNote',
                      'Candidates must complete assessment before admission decision',
                    )
                  : t(
                      'assessment.requiredInactiveNote',
                      'Assessment stage is optional/exempt for this grade',
                    )}
              </p>
            </div>
            <Switch checked={assessmentRequired} onCheckedChange={setAssessmentRequired} />
          </div>

          {/* Assessment Mode & Result Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.mode', 'Assessment Mode')}
              </Label>
              <Select value={assessmentMode} onValueChange={setAssessmentMode}>
                <SelectTrigger className="rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="written">
                    {t('assessment.modeWritten', 'Written Test')}
                  </SelectItem>
                  <SelectItem value="online">
                    {t('assessment.modeOnline', 'Online Portal')}
                  </SelectItem>
                  <SelectItem value="oral">{t('assessment.modeOral', 'Oral / Viva')}</SelectItem>
                  <SelectItem value="observation">
                    {t('assessment.modeObservation', 'Observation')}
                  </SelectItem>
                  <SelectItem value="practical">
                    {t('assessment.modePractical', 'Practical Demo')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.resultType', 'Scoring Type')}
              </Label>
              <Select value={resultType} onValueChange={setResultType}>
                <SelectTrigger className="rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Result Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marks">
                    {t('assessment.typeMarks', 'Numerical Marks')}
                  </SelectItem>
                  <SelectItem value="pass_fail">
                    {t('assessment.typePassFail', 'Pass / Fail')}
                  </SelectItem>
                  <SelectItem value="recommendation">
                    {t('assessment.typeRecommendation', 'Recommendation')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maximum Marks & Pass Marks Threshold */}
          <div className="grid grid-cols-2 gap-4">
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
                className="font-bold text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {t('assessment.passMarks', 'Passing Score Threshold')}{' '}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="40"
                value={passMarks}
                onChange={(e) => setPassMarks(e.target.value)}
                className="font-bold text-sm rounded-xl"
                required
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground cursor-pointer">
                {t('common.status', 'Active Status')}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isActive
                  ? t('common.active', 'Configuration is live and enforced for evaluations')
                  : t('common.inactive', 'Disabled / Not enforced')}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl text-xs"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSaving
                ? t('common.saving', 'Saving...')
                : t('common.saveChanges', 'Save Configuration')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentConfigModal;

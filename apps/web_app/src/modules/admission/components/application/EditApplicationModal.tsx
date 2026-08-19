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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateApplicationMutation, ApplicationItem } from '@/shared/api/admission.api';
import { useGetAcademicYearsQuery } from '@/shared/api/academic.api';
import { AlertCircle, Loader2, School, Globe, FileText } from 'lucide-react';

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationItem | null;
  onSuccess?: () => void;
}

export const EditApplicationModal: React.FC<EditApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [nationality, setNationality] = useState<string>('');
  const [previousSchoolName, setPreviousSchoolName] = useState<string>('');
  const [previousSchoolAddress, setPreviousSchoolAddress] = useState<string>('');
  const [previousSchoolBoard, setPreviousSchoolBoard] = useState<string>('');
  const [previousGrade, setPreviousGrade] = useState<string>('');
  const [previousSchoolYear, setPreviousSchoolYear] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: academicYears = [] } = useGetAcademicYearsQuery();
  const [updateApplication, { isLoading }] = useUpdateApplicationMutation();

  useEffect(() => {
    if (isOpen && application) {
      setAcademicYearId(application.academic_year_id || '');
      setNationality(application.nationality || 'Indian');
      setPreviousSchoolName(application.previous_school_name || '');
      setPreviousSchoolAddress(application.previous_school_address || '');
      setPreviousSchoolBoard(application.previous_school_board || '');
      setPreviousGrade(application.previous_grade || '');
      setPreviousSchoolYear(application.previous_school_year || '');
      setErrorMsg(null);
    }
  }, [isOpen, application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setErrorMsg(null);
    try {
      await updateApplication({
        id: application.application_id || application.id,
        body: {
          academic_year_id: academicYearId || undefined,
          nationality: nationality.trim() || undefined,
          previous_school_name: previousSchoolName.trim() || undefined,
          previous_school_address: previousSchoolAddress.trim() || undefined,
          previous_school_board: previousSchoolBoard.trim() || undefined,
          previous_grade: previousGrade.trim() || undefined,
          previous_school_year: previousSchoolYear.trim() || undefined,
        },
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('[EditApplication Error]:', err);
      setErrorMsg(
        err?.data?.error ||
          err?.data?.message ||
          'Failed to update application. Please check input fields.',
      );
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Edit Application Details
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Editing application <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{application.application_number}</span> for {application.student_name || application.lead?.student_name || 'Applicant'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Academic & Nationality Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b pb-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Academic & Nationality Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Academic Year
                </Label>
                <Select value={academicYearId} onValueChange={setAcademicYearId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((ay: any) => (
                      <SelectItem
                        key={ay.academic_year_id || ay.id}
                        value={ay.academic_year_id || ay.id}
                        className="text-xs"
                      >
                        {ay.academic_year_name || ay.name || ay.year_label || 'Academic Year'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nationality
                </Label>
                <Input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Indian"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Previous School Background */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b pb-1.5">
              <School className="w-3.5 h-3.5 text-blue-600" />
              Previous School History
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Previous School Name
                </Label>
                <Input
                  value={previousSchoolName}
                  onChange={(e) => setPreviousSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Previous School Address / Location
                </Label>
                <Input
                  value={previousSchoolAddress}
                  onChange={(e) => setPreviousSchoolAddress(e.target.value)}
                  placeholder="e.g. Sector 12, RK Puram, New Delhi"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Previous Board
                  </Label>
                  <Select value={previousSchoolBoard} onValueChange={setPreviousSchoolBoard}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE" className="text-xs">CBSE</SelectItem>
                      <SelectItem value="ICSE" className="text-xs">ICSE</SelectItem>
                      <SelectItem value="State Board" className="text-xs">State Board</SelectItem>
                      <SelectItem value="IB" className="text-xs">IB</SelectItem>
                      <SelectItem value="Cambridge" className="text-xs">Cambridge</SelectItem>
                      <SelectItem value="Other" className="text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Last Grade Passed
                  </Label>
                  <Input
                    value={previousGrade}
                    onChange={(e) => setPreviousGrade(e.target.value)}
                    placeholder="e.g. Grade 2"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Academic Year
                  </Label>
                  <Input
                    value={previousSchoolYear}
                    onChange={(e) => setPreviousSchoolYear(e.target.value)}
                    placeholder="e.g. 2024-2025"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

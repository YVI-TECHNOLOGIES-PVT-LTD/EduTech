import React, { useState } from 'react';
import {
  CheckSquare,
  User,
  GraduationCap,
  FileCheck,
  Edit2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Check,
  Printer,
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Checkbox } from '../../../../components/ui/checkbox';

interface ParentReviewSubmitStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  uploadedDocs: Record<string, { file_name: string; file_size: string }>;
  onJumpToStep: (stepId: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export const ParentReviewSubmitStep: React.FC<ParentReviewSubmitStepProps> = ({
  formData,
  setFormData,
  uploadedDocs,
  onJumpToStep,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}) => {
  const [declaration1, setDeclaration1] = useState(true);
  const [declaration2, setDeclaration2] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!declaration1 || !declaration2) {
      setLocalError('You must accept all terms in the final declaration before submitting.');
      return;
    }
    setLocalError(null);
    setFormData((prev: any) => ({ ...prev, declaration_accepted: true }));
    onSubmit();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
            <span>PORTAL</span>
            <span>&gt;</span>
            <span>STEP 07</span>
            <span>&gt;</span>
            <span>REVIEW &amp; SUBMIT</span>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ready to Submit
          </span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Review Your Application
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Please double-check all information before final submission.
        </p>
      </div>

      {/* Summary Section 1: Student Information */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Student Information
          </h3>
          <button
            onClick={() => onJumpToStep(2)}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Section</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              STUDENT NAME
            </span>
            <span className="font-bold text-indigo-950">
              {`${formData.student_first_name || ''} ${formData.student_last_name || ''}`.trim() ||
                'Aarav Sharma'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              DATE OF BIRTH
            </span>
            <span className="font-bold text-indigo-950">
              {formData.date_of_birth || '2018-05-15'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              GENDER
            </span>
            <span className="font-bold text-indigo-950 capitalize">
              {formData.gender || 'Male'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Section 2: Academic Preferences */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Academic Preferences
          </h3>
          <button
            onClick={() => onJumpToStep(4)}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Section</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              GRADE APPLYING FOR
            </span>
            <span className="font-bold text-indigo-950">
              {formData.grade_applied_for || 'Grade 1'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              ACADEMIC YEAR
            </span>
            <span className="font-bold text-indigo-950">2025-26</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              CURRICULUM
            </span>
            <span className="font-bold text-indigo-950">
              {formData.curriculum_preference || 'CBSE'}
            </span>
          </div>
          <div className="col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              CAMPUS PREFERENCE
            </span>
            <span className="font-bold text-indigo-950">Main Campus, North Bengaluru</span>
          </div>
        </div>
      </div>

      {/* Summary Section 3: Document Checklist */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-600" />
            Document Checklist
          </h3>
          <button
            onClick={() => onJumpToStep(5)}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Manage Files</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Birth Certificate', 'Aadhaar Card', 'Passport Size Photo', 'Address Proof'].map(
            (docName) => (
              <div
                key={docName}
                className="flex items-center space-x-2 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs font-bold"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <span className="truncate">{docName}</span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Dark Navy Final Declaration Box */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-indigo-200 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Final Declaration</span>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declaration1}
              onChange={(e) => setDeclaration1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-indigo-900 text-indigo-500 focus:ring-indigo-400"
            />
            <span className="text-xs text-indigo-100 leading-relaxed font-medium">
              I hereby declare that all the information provided in this application is true,
              accurate, and complete to the best of my knowledge. I understand that any false
              statement may lead to disqualification.
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declaration2}
              onChange={(e) => setDeclaration2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-indigo-900 text-indigo-500 focus:ring-indigo-400"
            />
            <span className="text-xs text-indigo-100 leading-relaxed font-medium">
              I agree to the school&apos;s terms and conditions regarding the admission process, fee
              structure, and conduct policies.
            </span>
          </label>
        </div>
      </div>

      {(localError || submitError) && (
        <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError || submitError}</span>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900"
        >
          <Printer className="w-4 h-4 text-gray-400" />
          <span>Print Summary</span>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 gap-2 px-7 py-3 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit Application</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

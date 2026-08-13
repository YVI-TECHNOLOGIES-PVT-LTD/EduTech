import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Calendar,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

interface ParentAcademicsStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  classes: any[];
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

export const ParentAcademicsStep: React.FC<ParentAcademicsStepProps> = ({
  formData,
  setFormData,
  classes = [],
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (!formData.academic_year_grade_id && !formData.grade_applied_for && !formData.grade_id) {
      setError('Please select the Grade Applied For.');
      return;
    }
    setError(null);
    onNext();
  };

  const handleSelectGrade = (cls: any) => {
    if (isReadOnly) return;
    setFormData((prev: any) => ({
      ...prev,
      academic_year_grade_id: cls.academic_year_grade_id || cls.id,
      grade_id: cls.grade_id || cls.id,
      grade_applied_for: cls.name || cls.grade_name || cls.code,
    }));
    setError(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Breadcrumb & Main Heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
          <span>PORTAL</span>
          <span>&gt;</span>
          <span>APPLICATION</span>
          <span>&gt;</span>
          <span>ACADEMICS</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Academic Selection</h1>
        <p className="text-xs text-gray-500 font-medium">
          Organization and Academic Year are set by the school. Select your desired grade and
          curriculum.
        </p>
      </div>

      {/* Immutable Server Context Card */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            SERVER AUTHORITATIVE CONTEXT (IMMUTABLE)
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 text-indigo-200 px-2.5 py-0.5 rounded-full border border-white/10">
            LOCKED BY SCHOOL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/50 flex items-center justify-center font-bold text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-indigo-300 block uppercase font-black tracking-wider">
                SCHOOL BRANCH
              </span>
              <span className="text-xs font-black text-white">Main Campus, North Bengaluru</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/50 flex items-center justify-center font-bold text-white shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-300 block uppercase font-black tracking-wider">
                ACADEMIC YEAR
              </span>
              <span className="text-xs font-black text-white">AY 2025-26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selectable Curriculum & Grade Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Grade &amp; Curriculum Choice</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            STEP 4.1
          </span>
        </div>

        {/* Curriculum Preference */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
            CURRICULUM PREFERENCE <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['CBSE', 'ICSE', 'IB', 'IGCSE'].map((curr) => (
              <button
                key={curr}
                type="button"
                disabled={isReadOnly}
                onClick={() =>
                  setFormData((prev: any) => ({ ...prev, curriculum_preference: curr }))
                }
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                  formData.curriculum_preference === curr
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Grade Selection Grid */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
            SELECT GRADE APPLYING FOR <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              'Grade 1',
              'Grade 2',
              'Grade 3',
              'Grade 4',
              'Grade 5',
              'Grade 6',
              'Grade 7',
              'Grade 8',
              'Grade 9',
              'Grade 10',
            ].map((gName) => {
              const isSelected = formData.grade_applied_for === gName;
              return (
                <button
                  key={gName}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() =>
                    setFormData((prev: any) => ({
                      ...prev,
                      grade_applied_for: gName,
                      grade_id: gName.toLowerCase().replace(' ', '-'),
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-black shadow-sm ring-2 ring-indigo-600/20'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800 font-semibold'
                  }`}
                >
                  <span className="text-xs">{gName}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>

        <span className="text-xs font-bold text-gray-400">Draft Autosaved</span>

        <Button
          onClick={handleProceed}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Documents</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

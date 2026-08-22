import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
} from 'lucide-react';
import { CountrySelect } from '../../../../components/ui/country-select';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

interface ParentStudentDetailsStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

export const ParentStudentDetailsStep: React.FC<ParentStudentDetailsStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (!formData.student_first_name?.trim()) {
      setError('Student First Name is required.');
      return;
    }
    if (!formData.student_last_name?.trim()) {
      setError('Student Last Name is required.');
      return;
    }
    if (!formData.date_of_birth) {
      setError('Student Date of Birth is required.');
      return;
    }
    setError(null);
    onNext();
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
          <span>STUDENT DETAILS</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">Student Information</h1>
        <p className="text-xs text-gray-500 font-medium">
          Enter the student&apos;s personal details exactly as they appear in official records.
        </p>
      </div>

      {/* Section Card 1: Basic Profile */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Basic Profile</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            STEP 2.1
          </span>
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              FIRST NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={formData.student_first_name || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, student_first_name: e.target.value }))
              }
              placeholder="Legal first name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all disabled:bg-gray-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              LAST NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={formData.student_last_name || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, student_last_name: e.target.value }))
              }
              placeholder="Family / Surname"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* DOB, Gender, Nationality & Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              DATE OF BIRTH <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={formData.date_of_birth || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, date_of_birth: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all disabled:bg-gray-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              GENDER <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isReadOnly}
              value={formData.gender || 'male'}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, gender: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer disabled:bg-gray-50"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              NATIONALITY <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={formData.nationality || 'Indian'}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, nationality: e.target.value }))
              }
              placeholder="e.g. Indian"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all disabled:bg-gray-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              COUNTRY <span className="text-red-500">*</span>
            </label>
            <CountrySelect
              disabled={isReadOnly}
              value={formData.country || 'India'}
              onChange={(name) => setFormData((prev: any) => ({ ...prev, country: name }))}
            />
          </div>
        </div>
      </div>

      {/* Section Card 2: Academic Context */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Academic Context</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            STEP 2.2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              APPLYING FOR GRADE <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isReadOnly}
              value={formData.grade_applied_for || 'Grade 1'}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, grade_applied_for: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer disabled:bg-gray-50"
            >
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous: Instructions</span>
        </Button>

        <span className="text-xs font-bold text-gray-400">Draft Autosaved</span>

        <Button
          onClick={handleProceed}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 gap-2 px-6 py-3 rounded-xl"
        >
          <span>Next Step: Parent Details</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

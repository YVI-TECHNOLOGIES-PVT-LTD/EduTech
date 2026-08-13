import React, { useState } from 'react';
import { Users, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

interface ParentDetailsStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onBack: () => void;
  isReadOnly?: boolean;
}

export const ParentDetailsStep: React.FC<ParentDetailsStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  isReadOnly = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleProceed = () => {
    if (!formData.parent_name?.trim()) {
      setError('Parent / Guardian Name is required.');
      return;
    }
    if (!formData.parent_phone?.trim()) {
      setError('Contact Phone number is required.');
      return;
    }
    if (!formData.parent_email?.trim()) {
      setError('Contact Email is required.');
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
          <span>PARENT DETAILS</span>
        </div>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Parent / Guardian Information
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Enter primary guardian contact and occupation details for admission correspondence.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="p-6 border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Primary Contact Details</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            STEP 3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              GUARDIAN FULL NAME <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              disabled={isReadOnly}
              value={formData.parent_name || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, parent_name: e.target.value }))
              }
              placeholder="Full name of parent/guardian"
              className="text-xs font-semibold rounded-xl border-gray-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              RELATIONSHIP <span className="text-red-500">*</span>
            </Label>

            <select
              disabled={isReadOnly}
              value={formData.contact_relationship || 'father'}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, contact_relationship: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all disabled:bg-gray-50 bg-white"
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Legal Guardian</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              CONTACT PHONE <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              disabled={isReadOnly}
              value={formData.parent_phone || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, parent_phone: e.target.value }))
              }
              placeholder="+91 98765 43210"
              className="text-xs font-semibold rounded-xl border-gray-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              OFFICIAL EMAIL <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              disabled={isReadOnly}
              value={formData.parent_email || ''}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, parent_email: e.target.value }))
              }
              placeholder="parent@domain.com"
              className="text-xs font-semibold rounded-xl border-gray-200"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <Label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            OCCUPATION / ORGANISATION
          </Label>
          <Input
            type="text"
            disabled={isReadOnly}
            value={formData.parent_occupation || ''}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, parent_occupation: e.target.value }))
            }
            placeholder="e.g. Software Engineer, Business Owner, Doctor..."
            className="text-xs font-semibold rounded-xl border-gray-200"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

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
          <span>Next Step: Academics</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

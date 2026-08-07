import React, { useState } from 'react';
import { Settings, Hash, Sliders, Save } from 'lucide-react';
import { FormSection } from '@/shared/forms/FormSection';
import { FormField } from '@/shared/forms/FormField';
import { FormFooter } from '@/shared/forms/FormFooter';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [leadPrefix, setLeadPrefix] = useState('LEAD-2026-');
  const [appPrefix, setAppPrefix] = useState('APP-2026-');
  const [admPrefix, setAdmPrefix] = useState('ADM-2026-');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Sequence generators and masters saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Settings & Sequence Masters
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure automated reference sequence generators and system master variables
        </p>
      </div>

      <FormSection
        title="Automated Sequence Code Generators"
        description="Define prefixes for auto-generated reference numbers across Stage-1 modules"
      >
        <FormField label="Lead Reference Prefix" name="leadPrefix">
          <Input
            value={leadPrefix}
            onChange={(e) => setLeadPrefix(e.target.value)}
            className="text-xs h-9 font-mono"
          />
        </FormField>

        <FormField label="Application Number Prefix" name="appPrefix">
          <Input
            value={appPrefix}
            onChange={(e) => setAppPrefix(e.target.value)}
            className="text-xs h-9 font-mono"
          />
        </FormField>

        <FormField label="Admission Number Prefix" name="admPrefix">
          <Input
            value={admPrefix}
            onChange={(e) => setAdmPrefix(e.target.value)}
            className="text-xs h-9 font-mono"
          />
        </FormField>
      </FormSection>

      <FormFooter
        submitLabel="Save Sequence Masters"
        isSubmitting={isSaving}
        onCancel={handleSave}
      />
    </div>
  );
};

export default SettingsPage;

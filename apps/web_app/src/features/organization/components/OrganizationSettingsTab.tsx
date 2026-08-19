import React, { useState } from 'react';
import { FormSection } from '@/shared/forms/FormSection';
import { FormField } from '@/shared/forms/FormField';
import { FormFooter } from '@/shared/forms/FormFooter';
import { toast } from 'sonner';

export const OrganizationSettingsTab: React.FC = () => {
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Organization settings saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="System Preferences"
        description="Default currency, session timeouts and localized settings"
      >
        <FormField label="Default Currency" name="currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
          >
            <option value="INR">INR (₹) - Indian Rupee</option>
            <option value="USD">USD ($) - US Dollar</option>
            <option value="EUR">EUR (€) - Euro</option>
            <option value="GBP">GBP (£) - British Pound</option>
          </select>
        </FormField>

        <FormField label="Timezone" name="timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </FormField>

        <FormField label="Session Timeout (Minutes)" name="sessionTimeout">
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
          >
            <option value="30">30 Minutes</option>
            <option value="60">60 Minutes (Default)</option>
            <option value="120">120 Minutes</option>
          </select>
        </FormField>
      </FormSection>

      <FormFooter
        submitLabel="Save System Preferences"
        isSubmitting={isSaving}
        onCancel={handleSave}
      />
    </div>
  );
};

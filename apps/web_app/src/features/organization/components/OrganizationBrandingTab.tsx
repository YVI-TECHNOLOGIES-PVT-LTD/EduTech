import React, { useState } from 'react';
import { Upload, Palette, Building2 } from 'lucide-react';
import { FormSection } from '@/shared/forms/FormSection';
import { FormField } from '@/shared/forms/FormField';
import { FormFooter } from '@/shared/forms/FormFooter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const OrganizationBrandingTab: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [headerTitle, setHeaderTitle] = useState('EduTrack ERP Admin Portal');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Branding configuration saved successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Brand Customization"
        description="Customize portal branding and color themes"
      >
        <div className="col-span-full space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Institution Logo
          </label>
          <div className="flex items-center space-x-4">
            <img
              src="/EduTrack_logo.png"
              alt="Institution Logo"
              className="h-16 w-16 object-contain rounded-xl shadow-md border border-border p-1 bg-card"
            />
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Upload size={14} className="mr-1.5" />
                Upload New Logo
              </Button>
              <p className="text-[11px] text-slate-400">PNG, JPG or SVG. Max file size 2MB.</p>
            </div>
          </div>
        </div>

        <FormField label="Portal Display Title" name="headerTitle">
          <Input
            id="headerTitle"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            className="text-xs h-9"
          />
        </FormField>

        <FormField label="Primary Theme Color" name="primaryColor">
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-9 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="text-xs h-9 uppercase"
            />
          </div>
        </FormField>
      </FormSection>

      <FormFooter
        submitLabel="Save Branding Settings"
        isSubmitting={isSaving}
        onCancel={handleSave}
      />
    </div>
  );
};

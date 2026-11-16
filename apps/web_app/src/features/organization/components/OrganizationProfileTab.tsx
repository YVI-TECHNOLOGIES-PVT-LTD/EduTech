import React from 'react';
import { z } from 'zod';
import { emailSchema, optionalPhoneSchema } from '@edutrack/validation';
import { FormBuilder } from '@/shared/forms/FormBuilder';
import { FormSection } from '@/shared/forms/FormSection';
import { FormField } from '@/shared/forms/FormField';
import { FormFooter } from '@/shared/forms/FormFooter';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  useUpdateOrganizationProfileMutation,
  OrganizationProfile,
} from '@/shared/api/organization.api';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  legalName: z.string().optional(),
  email: emailSchema,
  phone: optionalPhoneSchema,
  website: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface OrganizationProfileTabProps {
  profile?: OrganizationProfile;
}

export const OrganizationProfileTab: React.FC<OrganizationProfileTabProps> = ({ profile }) => {
  const [updateProfile, { isLoading }] = useUpdateOrganizationProfileMutation();

  const defaultValues: FormData = {
    name: profile?.name || 'Apex International Academy',
    legalName: profile?.legalName || 'Apex Educational Trust Pvt. Ltd.',
    email: profile?.email || 'admin@apexacademy.edu',
    phone: profile?.phone || '+91 98765 43210',
    website: profile?.website || 'https://apexacademy.edu',
    address: profile?.address || '100 Knowledge Park, Sector 62, City Campus',
  };

  const handleSubmit = async (data: FormData) => {
    try {
      await updateProfile({
        ...data,
        phone: data.phone ?? undefined,
      }).unwrap();
      toast.success('Organization profile updated successfully');
    } catch {
      toast.error('Failed to update organization profile');
    }
  };

  return (
    <FormBuilder
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {(methods) => {
        const {
          register,
          control,
          formState: { errors },
        } = methods;

        return (
          <>
            <FormSection
              title="Basic Details"
              description="Primary identification and contact information"
            >
              <FormField
                label="Organization Name"
                name="name"
                required
                error={errors.name?.message}
              >
                <Input id="name" {...register('name')} className="text-xs h-9" />
              </FormField>

              <FormField label="Legal Name" name="legalName" error={errors.legalName?.message}>
                <Input id="legalName" {...register('legalName')} className="text-xs h-9" />
              </FormField>

              <FormField label="Contact Email" name="email" required error={errors.email?.message}>
                <Input id="email" type="email" {...register('email')} className="text-xs h-9" />
              </FormField>

              <FormField label="Phone Number" name="phone" error={errors.phone?.message}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      id="phone"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>

              <FormField label="Official Website" name="website" error={errors.website?.message}>
                <Input id="website" {...register('website')} className="text-xs h-9" />
              </FormField>
            </FormSection>

            <FormSection title="Address Details" description="Physical campus location">
              <div className="col-span-full">
                <FormField label="Campus Address" name="address" error={errors.address?.message}>
                  <Input id="address" {...register('address')} className="text-xs h-9" />
                </FormField>
              </div>
            </FormSection>

            <FormFooter isSubmitting={isLoading} submitLabel="Update Profile" />
          </>
        );
      }}
    </FormBuilder>
  );
};

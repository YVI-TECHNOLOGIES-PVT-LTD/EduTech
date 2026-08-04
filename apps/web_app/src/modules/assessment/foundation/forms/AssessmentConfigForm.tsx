import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { AssessmentConfig } from '../services/assessment.api';

const formSchema = z.object({
    max_upload_size_mb: z.number().int().min(1, 'Must be at least 1MB').max(100, 'Cannot exceed 100MB'),
    autosave_interval_secs: z.number().int().min(5, 'Autosave must be at least 5s').max(60, 'Autosave cannot exceed 60s'),
    default_heartbeat_secs: z.number().int().min(10, 'Heartbeat must be at least 10s').max(120, 'Heartbeat cannot exceed 120s'),
    timezone: z.string().min(1, 'Timezone is required'),
    retention_telemetry_days: z.number().int().min(30, 'Telemetry retention must be at least 30 days'),
    retention_attempts_years: z.number().int().min(1, 'Attempts retention must be at least 1 year')
});

type FormValues = z.infer<typeof formSchema>;

interface AssessmentConfigFormProps {
    initialData: AssessmentConfig;
    onSubmit: (data: FormValues) => Promise<void>;
    isSaving: boolean;
}

export function AssessmentConfigForm({ initialData, onSubmit, isSaving }: AssessmentConfigFormProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            max_upload_size_mb: initialData.max_upload_size_mb,
            autosave_interval_secs: initialData.autosave_interval_secs,
            default_heartbeat_secs: initialData.default_heartbeat_secs,
            timezone: initialData.timezone,
            retention_telemetry_days: initialData.retention_telemetry_days,
            retention_attempts_years: initialData.retention_attempts_years
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="max_upload_size_mb" className="text-xs font-bold text-gray-700">Max Upload Size (MB)</Label>
                    <Input
                        id="max_upload_size_mb"
                        type="number"
                        {...register('max_upload_size_mb', { valueAsNumber: true })}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.max_upload_size_mb && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.max_upload_size_mb.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="autosave_interval_secs" className="text-xs font-bold text-gray-700">Autosave Interval (seconds)</Label>
                    <Input
                        id="autosave_interval_secs"
                        type="number"
                        {...register('autosave_interval_secs', { valueAsNumber: true })}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.autosave_interval_secs && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.autosave_interval_secs.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="default_heartbeat_secs" className="text-xs font-bold text-gray-700">Default Heartbeat (seconds)</Label>
                    <Input
                        id="default_heartbeat_secs"
                        type="number"
                        {...register('default_heartbeat_secs', { valueAsNumber: true })}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.default_heartbeat_secs && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.default_heartbeat_secs.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-xs font-bold text-gray-700">System Timezone</Label>
                    <Input
                        id="timezone"
                        type="text"
                        {...register('timezone')}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.timezone && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.timezone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="retention_telemetry_days" className="text-xs font-bold text-gray-700">Telemetry Retention (Days)</Label>
                    <Input
                        id="retention_telemetry_days"
                        type="number"
                        {...register('retention_telemetry_days', { valueAsNumber: true })}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.retention_telemetry_days && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.retention_telemetry_days.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="retention_attempts_years" className="text-xs font-bold text-gray-700">Attempts Retention (Years)</Label>
                    <Input
                        id="retention_attempts_years"
                        type="number"
                        {...register('retention_attempts_years', { valueAsNumber: true })}
                        className="rounded-xl border-gray-200"
                    />
                    {errors.retention_attempts_years && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.retention_attempts_years.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white flex items-center gap-1.5 rounded-xl text-xs font-black px-4 py-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Save Configuration
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

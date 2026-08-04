import React, { useEffect, useRef } from 'react';
import { useWatch, UseFormReturn } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

// Form Stepper Wizard Component
interface Step {
    title: string;
    description?: string;
}

interface FormStepperProps {
    steps: Step[];
    currentStep: number;
}

export const FormStepper = ({ steps, currentStep }: FormStepperProps) => {
    return (
        <div className="w-full py-4 px-6 bg-white rounded-2xl border border-gray-100 flex items-center justify-between gap-4 mb-6">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <div key={step.title} className="flex items-center gap-3 flex-1 last:flex-initial">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                                isActive
                                    ? 'bg-primary border-primary text-primary-foreground shadow shadow-primary/20 scale-105'
                                    : isCompleted
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                            }`}
                        >
                            {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.title}
                            </p>
                            {step.description && (
                                <p className="text-[10px] text-gray-400 font-medium">{step.description}</p>
                            )}
                        </div>
                        {index < steps.length - 1 && (
                            <div className="hidden sm:block flex-1 h-[1px] bg-gray-200 mx-2" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Form Field Input Wrapper
interface FormFieldWrapperProps {
    label: string;
    description?: string;
    error?: string;
    children: React.ReactNode;
}

export const FormFieldWrapper = ({ label, description, error, children }: FormFieldWrapperProps) => {
    return (
        <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-xs font-bold text-gray-700 tracking-wide select-none">{label}</label>
            {description && (
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{description}</p>
            )}
            <div className="relative mt-0.5">
                {children}
            </div>
            {error && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-500 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </span>
            )}
        </div>
    );
};

// Hook: Debounced Form Autosave
export const useFormAutosave = (
    form: UseFormReturn<any>,
    onSave: (data: any) => Promise<void>,
    delay = 1500
) => {
    const values = useWatch({ control: form.control });
    const timerRef = useRef<any>(null);

    useEffect(() => {
        const isDirty = form.formState.isDirty;
        if (!isDirty) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(async () => {
            const currentValues = form.getValues();
            console.debug('[Autosave] Triggered saving current form state...');
            try {
                await onSave(currentValues);
                form.reset(currentValues, { keepValues: true }); // Resets dirty state
            } catch (err) {
                console.error('[Autosave] Failed to execute background save:', err);
            }
        }, delay);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [values, form, onSave, delay]);
};

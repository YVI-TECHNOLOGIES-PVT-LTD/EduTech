import React from 'react';
import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormBuilderProps<TSchema extends z.ZodType<any, any>> {
  schema: TSchema;
  defaultValues?: DefaultValues<z.infer<TSchema>>;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;
  children: (methods: UseFormReturn<z.infer<TSchema>>) => React.ReactNode;
  className?: string;
}

export function FormBuilder<TSchema extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormBuilderProps<TSchema>) {
  const methods = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
      {children(methods)}
    </form>
  );
}

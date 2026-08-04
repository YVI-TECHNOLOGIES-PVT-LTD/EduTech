import React from 'react';
import { ModuleShell } from '../../src/components/ui/templates/ModuleShell';

export default function AdmissionModuleScreen() {
  return (
    <ModuleShell
      moduleName="Admission Management"
      description="Process new student applications, entrance tests, and enrollments"
      icon="📝"
    />
  );
}

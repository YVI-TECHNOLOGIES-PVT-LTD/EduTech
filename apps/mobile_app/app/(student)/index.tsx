import React from 'react';
import { ModuleShell } from '../../src/components/ui/templates/ModuleShell';

export default function StudentModuleScreen() {
  return (
    <ModuleShell
      moduleName="Student Information System"
      description="Manage student profiles, attendance, grades, and academic records"
      icon="🎓"
    />
  );
}

import React from 'react';
import { ModuleShell } from '../../src/components/ui/templates/ModuleShell';

export default function ParentModuleScreen() {
  return (
    <ModuleShell
      moduleName="Parent Portal"
      description="Track ward progress, pay fees, view attendance, and communicate with school staff"
      icon="👪"
    />
  );
}

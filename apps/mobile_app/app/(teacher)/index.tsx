import React from 'react';
import { ModuleShell } from '../../src/components/ui/templates/ModuleShell';

export default function TeacherModuleScreen() {
  return (
    <ModuleShell
      moduleName="Teacher Portal"
      description="Manage class schedules, student attendance, lesson plans, and grading"
      icon="👩‍🏫"
    />
  );
}

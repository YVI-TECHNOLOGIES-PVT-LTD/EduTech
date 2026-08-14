export interface ApplicationFieldDef {
  key: string;
  label: string;
  section: 'student' | 'parent' | 'academic' | 'documents';
  getValue: (application: any, view?: any) => string;
}

export const APPLICATION_FIELDS: Record<string, ApplicationFieldDef> = {
  student_name: {
    key: 'student_name',
    label: 'Student Name',
    section: 'student',
    getValue: (app, view) =>
      view?.name ||
      app?.student_name ||
      (app?.leads
        ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
        : app?.lead
        ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
        : 'Applicant'),
  },
  date_of_birth: {
    key: 'date_of_birth',
    label: 'Date of Birth',
    section: 'student',
    getValue: (app, view) => {
      const raw =
        (view as any)?.dob || app?.date_of_birth || app?.lead?.date_of_birth;
      return raw ? new Date(raw).toLocaleDateString() : '';
    },
  },
  gender: {
    key: 'gender',
    label: 'Gender',
    section: 'student',
    getValue: (app) => app?.gender || app?.lead?.gender || '',
  },
  grade_applied_for: {
    key: 'grade_applied_for',
    label: 'Grade Applied For',
    section: 'student',
    getValue: (app, view) =>
      view?.grade || app?.grade_applied_for || app?.lead?.grade_applied_for || '',
  },
  curriculum_preference: {
    key: 'curriculum_preference',
    label: 'Curriculum Preference',
    section: 'student',
    getValue: (app) =>
      app?.curriculum_preference || app?.lead?.curriculum_preference || 'CBSE',
  },
  parent_name: {
    key: 'parent_name',
    label: 'Parent / Guardian Name',
    section: 'parent',
    getValue: (app) =>
      app?.parent_name ||
      app?.lead?.parent_name ||
      app?.lead?.parents?.father_name ||
      app?.lead?.parents?.mother_name ||
      '',
  },
  contact_relationship: {
    key: 'contact_relationship',
    label: 'Relationship',
    section: 'parent',
    getValue: (app) =>
      app?.contact_relationship || app?.lead?.parents?.relationship || 'Parent / Guardian',
  },
  parent_phone: {
    key: 'parent_phone',
    label: 'Primary Phone',
    section: 'parent',
    getValue: (app, view) =>
      view?.phone ||
      app?.parent_phone ||
      app?.lead?.parent_phone ||
      app?.lead?.parents?.phone ||
      '',
  },
  parent_email: {
    key: 'parent_email',
    label: 'Primary Email',
    section: 'parent',
    getValue: (app, view) =>
      view?.email ||
      app?.parent_email ||
      app?.lead?.parent_email ||
      app?.lead?.parents?.email ||
      '',
  },
  academic_year_id: {
    key: 'academic_year_id',
    label: 'Academic Year',
    section: 'academic',
    getValue: (app) =>
      app?.academic_years?.year_label || app?.academic_year_id || '2026-2027',
  },
  previous_school_name: {
    key: 'previous_school_name',
    label: 'Previous School',
    section: 'academic',
    getValue: (app) =>
      app?.previous_school_name || app?.lead?.previous_school || '',
  },
  previous_grade: {
    key: 'previous_grade',
    label: 'Previous Grade / Class',
    section: 'academic',
    getValue: (app) => app?.previous_grade || app?.lead?.previous_grade || '',
  },
};

export function isFieldEditable(fieldName: string, editableFields?: string[]): boolean {
  if (!editableFields || editableFields.length === 0) return false;
  return editableFields.includes(fieldName);
}

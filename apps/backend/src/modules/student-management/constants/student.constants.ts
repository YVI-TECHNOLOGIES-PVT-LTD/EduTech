/**
 * Student Management Constants (Stage-1)
 * Re-exports native Prisma Client enums directly.
 */

import * as PrismaClientPkg from '@prisma/client';

export const enrollment_status = (PrismaClientPkg as any).enrollment_status || {
  active: 'active',
  transferred_out: 'transferred_out',
  graduated: 'graduated',
  withdrawn: 'withdrawn',
};

export const gender_type = (PrismaClientPkg as any).gender_type || {
  male: 'male',
  female: 'female',
  other: 'other',
  undisclosed: 'undisclosed',
};

export const relationship_type = (PrismaClientPkg as any).relationship_type || {
  father: 'father',
  mother: 'mother',
  guardian: 'guardian',
  grandparent: 'grandparent',
  other: 'other',
};

export type enrollment_status = keyof typeof enrollment_status;
export type gender_type = keyof typeof gender_type;
export type relationship_type = keyof typeof relationship_type;

export { enrollment_status as EnrollmentStatus };
export { gender_type as GenderType };
export { relationship_type as RelationshipType };

export const ALLOWED_ENROLLMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  [enrollment_status.active]: [
    enrollment_status.transferred_out,
    enrollment_status.graduated,
    enrollment_status.withdrawn,
  ],
  [enrollment_status.transferred_out]: [
    enrollment_status.active,
  ],
  [enrollment_status.graduated]: [],
  [enrollment_status.withdrawn]: [
    enrollment_status.active,
  ],
};

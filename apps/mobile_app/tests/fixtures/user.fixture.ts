import { UserProfile } from '../../src/types';

export const mockUserFixture: UserProfile = {
  id: 'usr_test_1',
  email: 'admin@edutrack.com',
  firstName: 'Test',
  lastName: 'Admin',
  fullName: 'Test Admin',
  role: 'SCHOOL_ADMIN',
  permissions: [],
  isActive: true,
  tenantId: 'tnt_test_1',
  schoolId: 'sch_test_1',
};

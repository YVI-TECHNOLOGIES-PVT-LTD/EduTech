const API_VERSION_PREFIX = 'v1';

export const CacheKeyFactory = {
  rbac: {
    permissions: (role: string) => `${API_VERSION_PREFIX}:cache:rbac:permissions:${role.toLowerCase()}`,
    userRoles: (userId: string) => `${API_VERSION_PREFIX}:cache:rbac:user_roles:${userId}`,
  },
  auth: {
    session: (sessionId: string) => `${API_VERSION_PREFIX}:cache:auth:session:${sessionId}`,
  },
  admission: {
    masterData: () => `${API_VERSION_PREFIX}:cache:admission:master_data`,
    enquiries: (queryHash?: string) => `${API_VERSION_PREFIX}:cache:admission:enquiries:${queryHash || 'all'}`,
    leads: (queryHash?: string) => `${API_VERSION_PREFIX}:cache:admission:leads:${queryHash || 'all'}`,
  },
  students: {
    detail: (id: string) => `${API_VERSION_PREFIX}:cache:students:detail:${id}`,
    list: (queryHash?: string) => `${API_VERSION_PREFIX}:cache:students:list:${queryHash || 'all'}`,
  },
};

export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  admission: {
    enquiries: (params?: object) => ['admission', 'enquiries', params] as const,
    visitors: (params?: object) => ['admission', 'visitors', params] as const,
    leads: (params?: object) => ['admission', 'leads', params] as const,
    applications: (params?: object) => ['admission', 'applications', params] as const,
  },
  students: {
    all: ['students'] as const,
    list: (filters?: object) => ['students', 'list', filters] as const,
    detail: (id: string) => ['students', id] as const,
  },
  staff: {
    all: ['staff'] as const,
    list: (filters?: object) => ['staff', 'list', filters] as const,
    detail: (id: string) => ['staff', id] as const,
  },
  finance: {
    fees: (params?: object) => ['finance', 'fees', params] as const,
    transactions: (params?: object) => ['finance', 'transactions', params] as const,
  },
};

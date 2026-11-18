import { supabase } from '../supabase';

export const authRequestInterceptor = async (config: any) => {
  // 1. Read Native EduTrack JWT Token from localStorage
  let token = localStorage.getItem('edutrack_access_token');

  // 2. Fallback to Supabase session access_token if native token not found
  if (!token) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }
    } catch (error) {
      // Ignore
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 3. Attach Tenant ID if present in localStorage and not explicitly provided in headers
  if (!config.headers['x-tenant-id'] && !config.headers['X-Tenant-Id']) {
    const tenantId =
      localStorage.getItem('edutrack_tenant_id') || localStorage.getItem('tenant_org_id');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }

  // If payload is FormData, remove Content-Type header so the browser automatically computes the boundary
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  return config;
};
export default authRequestInterceptor;

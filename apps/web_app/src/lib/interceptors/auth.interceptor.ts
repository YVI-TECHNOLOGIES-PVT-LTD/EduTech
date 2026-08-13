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

  return config;
};
export default authRequestInterceptor;

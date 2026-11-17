import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface TransportStop {
  stopName: string;
  pickupTime: string;
  dropTime: string;
}

export interface TransportAllocation {
  studentId: string;
  isAssigned: boolean;
  routeNumber?: string;
  routeName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  pickupStop?: string;
  dropStop?: string;
  pickupTime?: string;
  dropTime?: string;
  stops?: TransportStop[];
}

const transportCache = new Map<string, { data: TransportAllocation | null; cachedAt: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

export const transportApi = {
  /**
   * Fetch transport allocation and route details for a student (3m cached)
   */
  async getStudentTransport(studentId: string, force = false): Promise<TransportAllocation | null> {
    if (!studentId) return null;

    const cached = transportCache.get(studentId);
    if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await apiClient.get<any>(ENDPOINTS.TRANSPORT.ALLOCATION(studentId));
      const data = res?.data || res || null;
      transportCache.set(studentId, { data, cachedAt: Date.now() });
      return data;
    } catch {
      // Graceful fallback
    }
    return null;
  },
};

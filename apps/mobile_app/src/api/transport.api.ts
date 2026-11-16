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

export const transportApi = {
  /**
   * Fetch transport allocation and route details for a student
   */
  async getStudentTransport(studentId: string): Promise<TransportAllocation | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.TRANSPORT.ALLOCATION(studentId));
      return res?.data || res || null;
    } catch {
      // Graceful fallback
    }
    return null;
  },
};

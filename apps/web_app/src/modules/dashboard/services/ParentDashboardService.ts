import { apiClient } from '../../../lib/api-client';
import { DashboardCard, DashboardFilter } from '../types/dashboard.types';
import { StudentDashboardService } from './StudentDashboardService';

export class ParentDashboardService {
  private static overviewCache: { data: any; timestamp: number } | null = null;
  private static overviewPromise: Promise<any> | null = null;

  private static feesCache: { data: any; timestamp: number } | null = null;
  private static feesPromise: Promise<any> | null = null;

  private static readonly CACHE_TTL_MS = 30000; // 30 seconds stale-while-revalidate

  public static setCachedOverview(data: any): void {
    ParentDashboardService.overviewCache = {
      data,
      timestamp: Date.now(),
    };
  }

  public static invalidateCache(): void {
    ParentDashboardService.overviewCache = null;
    ParentDashboardService.overviewPromise = null;
    ParentDashboardService.feesCache = null;
    ParentDashboardService.feesPromise = null;
  }

  public static async getKPIs(filters: DashboardFilter): Promise<DashboardCard[]> {
    // Parents share student statistics for their active children
    return StudentDashboardService.getKPIs(filters);
  }

  public static async getOverview(forceRefresh = false): Promise<any> {
    const now = Date.now();
    if (
      !forceRefresh &&
      ParentDashboardService.overviewCache &&
      now - ParentDashboardService.overviewCache.timestamp < ParentDashboardService.CACHE_TTL_MS
    ) {
      return ParentDashboardService.overviewCache.data;
    }

    if (ParentDashboardService.overviewPromise) {
      return ParentDashboardService.overviewPromise;
    }

    ParentDashboardService.overviewPromise = apiClient
      .get('/dashboard/parent/overview')
      .then((response) => {
        ParentDashboardService.overviewCache = {
          data: response.data,
          timestamp: Date.now(),
        };
        ParentDashboardService.overviewPromise = null;
        return response.data;
      })
      .catch((error) => {
        ParentDashboardService.overviewPromise = null;
        throw error;
      });

    return ParentDashboardService.overviewPromise;
  }

  public static async getMyFees(forceRefresh = false): Promise<any> {
    const now = Date.now();
    if (
      !forceRefresh &&
      ParentDashboardService.feesCache &&
      now - ParentDashboardService.feesCache.timestamp < ParentDashboardService.CACHE_TTL_MS
    ) {
      return ParentDashboardService.feesCache.data;
    }

    if (ParentDashboardService.feesPromise) {
      return ParentDashboardService.feesPromise;
    }

    ParentDashboardService.feesPromise = apiClient
      .get('/fees/my')
      .then((response) => {
        ParentDashboardService.feesCache = {
          data: response.data,
          timestamp: Date.now(),
        };
        ParentDashboardService.feesPromise = null;
        return response.data;
      })
      .catch((error) => {
        ParentDashboardService.feesPromise = null;
        throw error;
      });

    return ParentDashboardService.feesPromise;
  }
}

export default ParentDashboardService;

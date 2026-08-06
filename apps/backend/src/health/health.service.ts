import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';

export interface HealthIndicatorResult {
  status: 'up' | 'down';
  details?: Record<string, any>;
}

export interface HealthIndicator {
  name: string;
  check(): Promise<HealthIndicatorResult>;
}

export class HealthService {
  private indicators: HealthIndicator[] = [];

  constructor() {
    this.registerIndicator({
      name: 'database',
      check: async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return { status: 'up' };
        } catch (err: any) {
          return { status: 'down', details: { message: err.message } };
        }
      },
    });
  }

  public registerIndicator(indicator: HealthIndicator): void {
    this.indicators.push(indicator);
  }

  public async getHealthStatus(): Promise<{
    status: 'ok' | 'error';
    checks: Record<string, HealthIndicatorResult>;
  }> {
    const checks: Record<string, HealthIndicatorResult> = {};
    let overallHealthy = true;

    for (const indicator of this.indicators) {
      const result = await indicator.check();
      checks[indicator.name] = result;
      if (result.status === 'down') {
        overallHealthy = false;
      }
    }

    return {
      status: overallHealthy ? 'ok' : 'error',
      checks,
    };
  }
}

export class HealthController {
  private healthService = new HealthService();

  public check = async (req: Request, res: Response): Promise<void> => {
    const health = await this.healthService.getHealthStatus();
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  };
}

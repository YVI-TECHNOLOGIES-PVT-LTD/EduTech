import { Request, Response } from 'express';
import { prisma } from '../lib/prismaClient';
import { configuration } from '../config';

export interface HealthStatusResult {
  status: 'ok' | 'error';
  timestamp: string;
  checks: Record<string, { status: 'up' | 'down'; message?: string }>;
}

export class HealthPlatformService {
  public static async getLive(): Promise<{ status: 'ok'; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  public static async getReady(): Promise<HealthStatusResult> {
    const checks: Record<string, { status: 'up' | 'down'; message?: string }> = {};
    let isReady = true;

    // Check Configuration Loaded
    if (configuration && configuration.app) {
      checks.config = { status: 'up' };
    } else {
      checks.config = { status: 'down', message: 'Configuration not initialized' };
      isReady = false;
    }

    // Check Database Reachability (Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up' };
    } catch (err: any) {
      checks.database = { status: 'down', message: err.message };
      isReady = false;
    }

    return {
      status: isReady ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

export class HealthPlatformController {
  public live = async (req: Request, res: Response): Promise<void> => {
    const result = await HealthPlatformService.getLive();
    res.status(200).json(result);
  };

  public ready = async (req: Request, res: Response): Promise<void> => {
    const result = await HealthPlatformService.getReady();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(result);
  };

  public check = async (req: Request, res: Response): Promise<void> => {
    const result = await HealthPlatformService.getReady();
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(result);
  };
}

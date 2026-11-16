import { Router, Request, Response } from 'express';
import prisma from '../lib/prismaClient';
import { cacheService } from '../cache/cache.service';
import { jobService } from '../jobs/job.service';
import { metricsService } from '../observability/metrics.service';

export const healthRouter = Router();

// Overall Health Status
healthRouter.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  let dbError = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e: any) {
    dbStatus = 'error';
    dbError = e.message;
  }

  const cacheMetrics = await cacheService.getMetrics();
  const queueMetrics = await jobService.getMetrics();
  const queueRuntime = jobService.getRuntimeStatus();
  const apiMetrics = metricsService.getMetrics();

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      error: dbError,
    },
    cache: cacheMetrics,
    queues: queueMetrics,
    queueRuntime,
    metrics: apiMetrics,
  });
});

// Liveness Probe (process is alive)
healthRouter.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness Probe (ready to serve traffic)
healthRouter.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const cacheMetrics = await cacheService.getMetrics();
    const queueMetrics = await jobService.getMetrics();
    const queueRuntime = jobService.getRuntimeStatus();
    const apiMetrics = metricsService.getMetrics();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: cacheMetrics.status,
      queues: queueMetrics,
      queueRuntime,
      metrics: apiMetrics,
    });
  } catch (e: any) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: e.message,
    });
  }
});

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { cacheService } from '../cache/cache.service';
import { jobService } from '../jobs/job.service';
import { metricsService } from '../observability/metrics.service';

export const healthRouter = Router();

// Overall Health Status
healthRouter.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  let dbError = null;

  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) {
      dbStatus = 'error';
      dbError = error.message;
    }
  } catch (e: any) {
    dbStatus = 'error';
    dbError = e.message;
  }

  const cacheMetrics = await cacheService.getMetrics();
  const queueMetrics = await jobService.getMetrics();
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
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) throw error;

    const cacheMetrics = await cacheService.getMetrics();
    const queueMetrics = await jobService.getMetrics();
    const apiMetrics = metricsService.getMetrics();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: cacheMetrics.status,
      queues: queueMetrics,
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

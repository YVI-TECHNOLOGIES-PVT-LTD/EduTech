import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import prisma from '../lib/prismaClient';
import { cacheService } from '../cache/cache.service';
import { jobService } from '../jobs/job.service';
import { metricsService } from '../observability/metrics.service';

export const healthRouter = Router();

// Checks the Supabase (PostgREST) connection used by the JS client.
async function checkSupabase(): Promise<{ status: string; error: string | null }> {
  try {
    const { error, status } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) {
      // Supabase issues this query as an HTTP HEAD request, which per the HTTP
      // spec can never carry a response body — so PostgREST error bodies
      // (error.message/details/hint) are dropped by the client and come back
      // empty. Fall back to the HTTP status and error code, which are always
      // present, so the failure is never silently reported as an empty string.
      return {
        status: 'error',
        error: error.message || error.details || error.hint || `Supabase request failed (HTTP ${status}, code: ${error.code || 'unknown'})`,
      };
    }
    return { status: 'connected', error: null };
  } catch (e: any) {
    return { status: 'error', error: e.message || String(e) };
  }
}

// Checks the direct Postgres connection used by Prisma (independent of Supabase/PostgREST).
async function checkPrisma(): Promise<{ status: string; error: string | null }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', error: null };
  } catch (e: any) {
    return { status: 'error', error: e.message || String(e) };
  }
}

// Overall Health Status
healthRouter.get('/', async (req: Request, res: Response) => {
  const [supabaseHealth, prismaHealth] = await Promise.all([checkSupabase(), checkPrisma()]);
  const dbStatus = supabaseHealth.status === 'connected' ? 'connected' : 'error';

  const cacheMetrics = await cacheService.getMetrics();
  const queueMetrics = await jobService.getMetrics();
  const apiMetrics = metricsService.getMetrics();

  res.json({
    status: dbStatus === 'connected' && prismaHealth.status === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      // Preserved for backward compatibility: existing top-level shape (status/error)
      // reflects the Supabase connection, exactly as before.
      status: dbStatus,
      error: supabaseHealth.error,
      // Additive: independent Prisma (direct Postgres) connectivity, previously unchecked.
      supabase: supabaseHealth,
      prisma: prismaHealth,
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
  const [supabaseHealth, prismaHealth] = await Promise.all([checkSupabase(), checkPrisma()]);

  if (supabaseHealth.status !== 'connected' || prismaHealth.status !== 'connected') {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: supabaseHealth.error || prismaHealth.error,
      supabase: supabaseHealth,
      prisma: prismaHealth,
    });
    return;
  }

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
});

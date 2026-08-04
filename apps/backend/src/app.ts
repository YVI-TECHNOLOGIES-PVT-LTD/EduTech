import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { requestLoggerMiddleware } from './utils/logger';
import { publicRateLimiter, authRateLimiter } from './middlewares/rate-limit.middleware';
import { errorHandlerMiddleware } from './middlewares/error.middleware';
import { healthRouter } from './routes/health.routes';
import { router } from './routes';
import { env } from './config/env';

export const app = express();

// Trust Proxy (Required for Render/Heroku/Reverse Proxies)
app.set('trust proxy', 1);

// Gzip Compression
app.use(compression());

// 1. Request ID Correlation Middleware
app.use(requestIdMiddleware);

// 2. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 3. Centralized CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://appsms.netlify.app',
  'https://appsms-076a.onrender.com',
  env.FRONTEND_URL || '',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
      if (isLocal || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api', publicRateLimiter);

// 5. Structured Request Logger
app.use(requestLoggerMiddleware);

// Health Check Probes
app.use('/health', healthRouter);

// API Routes
app.use('/api', router);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'RESOURCE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    requestId: (req as any).id || 'req-unknown',
  });
});

// 6. Centralized Error Handler (Phase 2.3 Compliant)
app.use(errorHandlerMiddleware);

import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { TraceContext, ISpan } from '../contracts/obs.contracts';

const traceStorage = new AsyncLocalStorage<TraceContext>();

export class TraceContextProviderStore {
  public static run(context: TraceContext, callback: () => void): void {
    traceStorage.run(context, callback);
  }

  public static current(): TraceContext | undefined {
    return traceStorage.getStore();
  }
}

export class Span implements ISpan {
  public readonly startTime = process.hrtime.bigint();

  constructor(public readonly spanId: string, public readonly name: string) {}

  public finish(): number {
    const end = process.hrtime.bigint();
    return Number(end - this.startTime) / 1000000; // ms
  }
}

export class TraceContextManager {
  public static createTrace(): TraceContext {
    const traceId = `tr_${crypto.randomUUID().replace(/-/g, '')}`;
    const spanId = `sp_${crypto.randomBytes(8).toString('hex')}`;
    return { traceId, spanId };
  }

  public static createSpan(name: string): ISpan {
    const spanId = `sp_${crypto.randomBytes(8).toString('hex')}`;
    return new Span(spanId, name);
  }

  public static getCurrentTrace(): TraceContext | undefined {
    return TraceContextProviderStore.current();
  }
}

export function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingTraceId = (req.headers['x-trace-id'] as string) || (req.headers['x-correlation-id'] as string);
  const traceId = incomingTraceId || `tr_${crypto.randomUUID().replace(/-/g, '')}`;
  const spanId = `sp_${crypto.randomBytes(8).toString('hex')}`;

  const traceCtx: TraceContext = Object.freeze({
    traceId,
    spanId,
  });

  (req as any).traceContext = traceCtx;
  res.setHeader('x-trace-id', traceId);

  TraceContextProviderStore.run(traceCtx, () => next());
}

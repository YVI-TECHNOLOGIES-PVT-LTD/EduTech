import { Server } from 'http';
import { prisma } from '../../lib/prismaClient';

export class LifecycleManager {
  private static isShuttingDown = false;

  public static async startup(): Promise<void> {
    console.log('🚀 Executing Application Startup Sequence...');
    await prisma.$connect();
    console.log('✅ Database (Prisma) Connection Initialized');
  }

  public static async shutdown(server?: Server): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('⚠️ Graceful Shutdown Signal Received. Cleaning resources...');

    if (server) {
      server.close(() => {
        console.log('✅ HTTP Server closed');
      });
    }

    try {
      await prisma.$disconnect();
      console.log('✅ Database Connection Closed');
    } catch (err) {
      console.error('❌ Error during Prisma disconnect:', err);
    }

    process.exit(0);
  }

  public static registerGracefulShutdown(server: Server): void {
    process.on('SIGINT', () => this.shutdown(server));
    process.on('SIGTERM', () => this.shutdown(server));
  }
}

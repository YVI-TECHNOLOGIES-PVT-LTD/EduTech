import { Express } from 'express';
import { configuration } from '../../config';
import { composeCoreProviders } from '../providers/provider.registry';
import { LifecycleManager } from '../lifecycle/lifecycle';
import { loggerService } from '../../observability/logger.service';
import { CacheHealthService } from '../../cache/health/cache.health';
import { QueueHealthService } from '../../queue/health/queue.health';
import { SecurityHealthService } from '../../security/health/security.health';
import { StorageHealthService } from '../../storage/health/storage.health';
import { NotificationHealthService } from '../../notification/health/notification.health';
import { IntegrationHealthService } from '../../integration/health/integration.health';
import { FeatureFlagHealthService } from '../../feature-flags/health/feature-flag.health';
import { SearchHealthService } from '../../search/health/search.health';
import { WorkflowHealthService } from '../../workflow/health/workflow.health';
import { ReportingHealthService } from '../../reporting/health/reporting.health';
import { AuditComplianceHealthService } from '../../audit-compliance/health/audit-compliance.health';

export interface BootstrapResult {
  port: number;
  envName: string;
  config: typeof configuration;
}

export async function bootstrapApplication(app: Express): Promise<BootstrapResult> {
  loggerService.info('1. Environment Configuration Loaded & Validated (Zod)');

  const providers = composeCoreProviders();
  loggerService.info('2. Core Providers Registered via Composition');

  await LifecycleManager.startup();
  loggerService.info('3. Prisma Database Connection Ready');

  loggerService.info(
    '4. Enterprise Observability Platform Active (Structured Logging, Tracing & Metrics)',
  );

  const cacheHealth = await CacheHealthService.getStatus();
  loggerService.info(
    `5. Enterprise Cache Platform Active (Provider: ${cacheHealth.provider}, Status: ${cacheHealth.status})`,
  );

  const queueHealth = await QueueHealthService.getStatus();
  loggerService.info(
    `6. Enterprise Queue & Background Jobs Platform Active (Provider: ${queueHealth.provider}, Status: ${queueHealth.status})`,
  );

  const securityHealth = await SecurityHealthService.getStatus();
  loggerService.info(
    `7. Enterprise Security Hardening Platform Active (Status: ${securityHealth.status})`,
  );

  const storageHealth = await StorageHealthService.getStatus();
  loggerService.info(
    `8. Enterprise Storage Platform Active (Provider: ${storageHealth.provider}, Status: ${storageHealth.status})`,
  );

  const notifHealth = await NotificationHealthService.getStatus();
  loggerService.info(`9. Enterprise Notification Platform Active (Status: ${notifHealth.status})`);

  const integHealth = await IntegrationHealthService.getStatus();
  loggerService.info(
    `10. Enterprise Integration Platform Active (Connector: ${integHealth.connector}, Status: ${integHealth.status})`,
  );

  const flagHealth = await FeatureFlagHealthService.getStatus();
  loggerService.info(
    `11. Enterprise Feature Flags & Configuration Platform Active (Provider: ${flagHealth.provider}, Registered Flags: ${flagHealth.registeredFlagsCount}, Status: ${flagHealth.status})`,
  );

  const searchHealth = await SearchHealthService.getStatus();
  loggerService.info(
    `12. Enterprise Search Platform Active (Provider: ${searchHealth.provider}, Status: ${searchHealth.status})`,
  );

  const wfHealth = await WorkflowHealthService.getStatus();
  loggerService.info(
    `13. Enterprise Workflow & Rules Engine Platform Active (Engine: ${wfHealth.engine}, Status: ${wfHealth.status})`,
  );

  const rptHealth = await ReportingHealthService.getStatus();
  loggerService.info(
    `14. Enterprise Reporting & Analytics Platform Active (Engine: ${rptHealth.engine}, Status: ${rptHealth.status})`,
  );

  const auditHealth = await AuditComplianceHealthService.getStatus();
  loggerService.info(
    `15. Enterprise Audit & Compliance Platform Active (Provider: ${auditHealth.provider}, Status: ${auditHealth.status})`,
  );

  const port = configuration.app.port;
  const envName = configuration.app.nodeEnv;

  return {
    port,
    envName,
    config: configuration,
  };
}

import { runNotificationModuleTests } from './notification.service.spec';
import { runEndToEndRealtimeVerification } from './e2e-realtime.spec';

async function main() {
  await runNotificationModuleTests();
  await runEndToEndRealtimeVerification();
}

main()
  .then(() => {
    console.log('[Notification Module Tests] Completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Notification Module Tests] Failed:', err);
    process.exit(1);
  });

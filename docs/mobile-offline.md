# EduTrack Mobile Offline Architecture

## Offline Platform Capabilities
1. **Network Connectivity Detection**: Monitored via `NetworkProvider`.
2. **Offline Banner**: Renders top-level notification when connection is lost.
3. **Query Cache Persistence**: TanStack Query cache persisted to device storage for offline read access.
4. **Offline Queue Sync**: Background sync processor (`SyncManager`) queues offline mutations and retries upon reconnection.

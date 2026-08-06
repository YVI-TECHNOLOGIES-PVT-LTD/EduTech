export const SERVICE_TOKENS = {
  LOGGER: Symbol('ILogger'),
  CACHE: Symbol('ICache'),
  QUEUE: Symbol('IQueue'),
  STORAGE: Symbol('IStorage'),
  NOTIFICATION: Symbol('INotification'),
  AUDIT: Symbol('IAudit'),
  CLOCK: Symbol('IClock'),
  ID_GENERATOR: Symbol('IIdGenerator'),
} as const;

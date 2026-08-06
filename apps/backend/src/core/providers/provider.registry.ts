import { SERVICE_TOKENS } from './service.tokens';
import { TimeProvider, UUIDProvider } from './core.providers';

export interface ProviderComposition {
  clock: TimeProvider;
  idGenerator: UUIDProvider;
  tokens: typeof SERVICE_TOKENS;
}

export function composeCoreProviders(): ProviderComposition {
  const clock = new TimeProvider();
  const idGenerator = new UUIDProvider();

  return Object.freeze({
    clock,
    idGenerator,
    tokens: SERVICE_TOKENS,
  });
}

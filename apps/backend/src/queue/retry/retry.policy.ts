export type BackoffStrategy = 'exponential' | 'linear' | 'fixed' | 'none';

export class RetryPolicy {
  public static calculateBackoff(
    attempt: number,
    strategy: BackoffStrategy = 'exponential',
    baseDelayMs = 1000,
  ): number {
    if (strategy === 'none') return 0;
    if (strategy === 'fixed') return baseDelayMs;
    if (strategy === 'linear') return attempt * baseDelayMs;

    // Exponential backoff with max cap at 30 minutes
    const delay = Math.pow(2, attempt - 1) * baseDelayMs;
    return Math.min(delay, 30 * 60 * 1000);
  }
}

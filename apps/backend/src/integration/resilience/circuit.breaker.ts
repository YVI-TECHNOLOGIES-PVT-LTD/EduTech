export type CircuitState = 'Closed' | 'Open' | 'Half-Open';

export class CircuitBreaker {
  private state: CircuitState = 'Closed';
  private failureCount = 0;
  private lastStateChange = Date.now();

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 30000,
  ) {}

  public canExecute(): boolean {
    const now = Date.now();
    if (this.state === 'Open') {
      if (now - this.lastStateChange > this.resetTimeoutMs) {
        this.state = 'Half-Open';
        this.lastStateChange = now;
        return true;
      }
      return false;
    }
    return true;
  }

  public onSuccess(): void {
    this.failureCount = 0;
    this.state = 'Closed';
  }

  public onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'Open';
      this.lastStateChange = Date.now();
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

export class DashboardRefreshManager {
    private static listeners: Set<() => void> = new Set();
    private static isInitialized = false;

    public static initialize() {
        if (this.isInitialized) return;

        window.addEventListener('focus', () => {
            this.triggerRefresh();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.triggerRefresh();
            }
        });

        this.isInitialized = true;
    }

    public static subscribe(listener: () => void): () => void {
        this.initialize();
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public static triggerRefresh() {
        this.listeners.forEach((listener) => {
            try {
                listener();
            } catch (e) {
                console.error('[DashboardRefreshManager] Listener failed', e);
            }
        });
    }
}

export default DashboardRefreshManager;

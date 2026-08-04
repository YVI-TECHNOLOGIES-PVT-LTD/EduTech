import { DashboardRegistry } from './DashboardRegistry';
import { DashboardRefreshManager } from './DashboardRefresh';

export class DashboardBootstrap {
    private static isBootstrapped = false;

    public static bootstrap(): void {
        if (this.isBootstrapped) return;

        console.log('[DashboardBootstrap] Initializing Dashboard Data Engine...');
        
        // Initialize focus and visibility event loops
        DashboardRefreshManager.initialize();

        this.isBootstrapped = true;
        console.log('[DashboardBootstrap] Dashboard Data Engine bootstrapped successfully.');
    }
}

export default DashboardBootstrap;

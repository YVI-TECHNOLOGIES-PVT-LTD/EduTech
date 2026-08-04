import { ErpModule } from '../config/module_registry';

export const LandingResolver = {
    resolveLandingRoute(visibleModules: ErpModule[]): string {
        if (visibleModules.length === 0) {
            return '/unauthorized';
        }
        // Sort visible modules by priority descending
        const sorted = [...visibleModules].sort((a, b) => b.priority - a.priority);
        return sorted[0].route;
    }
};

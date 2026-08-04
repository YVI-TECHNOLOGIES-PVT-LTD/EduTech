import { PermissionProfileResolver } from './PermissionProfileResolver';
import { DashboardRegistry } from './DashboardRegistry';
import { DashboardLayout, DashboardWidget } from '../types/dashboard.types';

export class DashboardEngine {
    public static resolveDashboard(permissions: string[]): {
        role: string;
        layout: DashboardLayout | undefined;
        widgets: DashboardWidget[];
    } {
        const resolved = PermissionProfileResolver.resolve(permissions);
        const layout = resolved.layouts;
        const widgets = DashboardRegistry.getWidgetsForRole(resolved.profile);

        return {
            role: resolved.profile,
            layout,
            widgets
        };
    }
}

export default DashboardEngine;

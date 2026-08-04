import { useAuth } from '../context/AuthContext';
import { MODULE_REGISTRY, ErpModule } from '../config/module_registry';

export const useModuleVisibility = () => {
    const { hasPermission } = useAuth();

    const getVisibleModules = (): ErpModule[] => {
        return MODULE_REGISTRY.filter(mod => hasPermission(mod.permission));
    };

    const isModuleVisible = (moduleId: string): boolean => {
        const mod = MODULE_REGISTRY.find(m => m.id === moduleId);
        if (!mod) return false;
        return hasPermission(mod.permission);
    };

    return {
        getVisibleModules,
        isModuleVisible
    };
};

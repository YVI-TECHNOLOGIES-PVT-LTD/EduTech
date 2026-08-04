import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function IdentityProvisioning({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Identity Provisioning" />;
}

export default IdentityProvisioning;

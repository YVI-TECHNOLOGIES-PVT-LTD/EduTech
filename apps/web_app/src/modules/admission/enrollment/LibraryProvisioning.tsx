import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function LibraryProvisioning({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Library Provisioning" />;
}

export default LibraryProvisioning;

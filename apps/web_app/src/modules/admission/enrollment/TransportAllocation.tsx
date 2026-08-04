import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function TransportAllocation({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Transport Allocation" />;
}

export default TransportAllocation;

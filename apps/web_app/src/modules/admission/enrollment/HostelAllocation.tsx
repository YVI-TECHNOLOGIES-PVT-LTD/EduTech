import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function HostelAllocation({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Hostel Allocation" />;
}

export default HostelAllocation;

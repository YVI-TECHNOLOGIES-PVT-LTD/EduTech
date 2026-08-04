import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function GuardianAssignment({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Guardian Assignment" />;
}

export default GuardianAssignment;

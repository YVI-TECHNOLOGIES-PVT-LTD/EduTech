import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';

export function AcademicAllocation({ step }: { step?: ProvisioningStep }) {
    return <ProvisioningStepPanel step={step} title="Academic Allocation" />;
}

export default AcademicAllocation;

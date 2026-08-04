import type { ProvisioningStep, EnrollmentValidationItem } from '../utils/enrollment.mapper';
import { ProvisioningStepPanel } from './ProvisioningStepPanel';
import { GuardianAssignment } from './GuardianAssignment';
import { AcademicAllocation } from './AcademicAllocation';
import { FeeActivation } from './FeeActivation';
import { TransportAllocation } from './TransportAllocation';
import { HostelAllocation } from './HostelAllocation';
import { LibraryProvisioning } from './LibraryProvisioning';
import { IdentityProvisioning } from './IdentityProvisioning';
import { getProvisioningStep } from '../utils/enrollment.mapper';

interface StudentProvisioningProps {
    steps: ProvisioningStep[];
    validation?: EnrollmentValidationItem[];
    phase?: string;
}

export function StudentProvisioning({ steps, validation, phase }: StudentProvisioningProps) {
    const feeItem = validation?.find(v => v.key === 'fee_activation');

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">ERP Student Provisioning</h3>
            <div className="space-y-2">
                <ProvisioningStepPanel step={getProvisioningStep(steps, 'student_master')} title="Student Master" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
                <AcademicAllocation step={getProvisioningStep(steps, 'academic_allocation')} />
                <GuardianAssignment step={getProvisioningStep(steps, 'guardian')} />
                <FeeActivation feeActive={feeItem?.passed} enrolled={phase === 'enrolled'} />
                <TransportAllocation step={getProvisioningStep(steps, 'transport')} />
                <HostelAllocation step={getProvisioningStep(steps, 'hostel')} />
                <LibraryProvisioning step={getProvisioningStep(steps, 'library')} />
                <IdentityProvisioning step={getProvisioningStep(steps, 'identity')} />
            </div>
        </div>
    );
}

export default StudentProvisioning;

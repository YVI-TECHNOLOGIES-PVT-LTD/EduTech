import { ProvisioningStepPanel } from './ProvisioningStepPanel';
import type { ProvisioningStepStatus } from '../utils/enrollment.mapper';

export function FeeActivation({ feeActive, enrolled }: { feeActive?: boolean; enrolled?: boolean }) {
    let status: ProvisioningStepStatus = 'PENDING';
    if (enrolled) status = 'COMPLETED';
    else if (feeActive) status = 'COMPLETED';

    return (
        <ProvisioningStepPanel
            step={{
                key: 'fee_activation',
                backendStep: 'Fee',
                label: 'Fee Ledger Activation',
                status,
            }}
            title="Fee Activation"
        />
    );
}

export default FeeActivation;

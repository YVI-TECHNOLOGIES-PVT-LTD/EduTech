import { AttendanceSession } from '../../../domain/attendance/AttendanceSession';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class SessionValidator {
    public validateOpen(session: AttendanceSession): void {
        if (session.status !== 'OPEN') {
            throw new BusinessRuleError(`Attendance session is "${session.status}". Records cannot be modified.`);
        }
    }
}

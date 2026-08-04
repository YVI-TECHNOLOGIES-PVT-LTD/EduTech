"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class SessionValidator {
    validateOpen(session) {
        if (session.status !== 'OPEN') {
            throw new BusinessRuleError_1.BusinessRuleError(`Attendance session is "${session.status}". Records cannot be modified.`);
        }
    }
}
exports.SessionValidator = SessionValidator;

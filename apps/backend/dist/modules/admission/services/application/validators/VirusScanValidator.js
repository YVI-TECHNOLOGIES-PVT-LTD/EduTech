"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirusScanValidator = exports.NoOpVirusScanner = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class NoOpVirusScanner {
    async scan(fileBuffer) {
        // No-Op placeholder for Sprint 4
        return true;
    }
}
exports.NoOpVirusScanner = NoOpVirusScanner;
class VirusScanValidator {
    constructor(scanner) {
        this.scanner = scanner;
    }
    async validate(fileBuffer) {
        const isSafe = await this.scanner.scan(fileBuffer);
        if (!isSafe) {
            throw new BusinessRuleError_1.BusinessRuleError('Security alert: A potential security threat was detected in the uploaded file.');
        }
    }
}
exports.VirusScanValidator = VirusScanValidator;

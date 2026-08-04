import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export interface IVirusScanner {
    scan(fileBuffer: Buffer): Promise<boolean>;
}

export class NoOpVirusScanner implements IVirusScanner {
    public async scan(fileBuffer: Buffer): Promise<boolean> {
        // No-Op placeholder for Sprint 4
        return true;
    }
}

export class VirusScanValidator {
    constructor(private readonly scanner: IVirusScanner) {}

    public async validate(fileBuffer: Buffer): Promise<void> {
        const isSafe = await this.scanner.scan(fileBuffer);
        if (!isSafe) {
            throw new BusinessRuleError('Security alert: A potential security threat was detected in the uploaded file.');
        }
    }
}

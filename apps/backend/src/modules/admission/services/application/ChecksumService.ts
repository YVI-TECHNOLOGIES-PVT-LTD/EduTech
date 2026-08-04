import * as crypto from 'crypto';

export class ChecksumService {
    public calculate(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
}

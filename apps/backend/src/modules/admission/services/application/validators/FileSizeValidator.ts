import { ValidationError } from '../../../errors/ValidationError';

export class FileSizeValidator {
    public validate(fileSize: number, maxBytes: number): void {
        if (fileSize > maxBytes) {
            const mbLimit = (maxBytes / (1024 * 1024)).toFixed(1);
            const mbUploaded = (fileSize / (1024 * 1024)).toFixed(2);
            throw new ValidationError(
                `File size exceeds limit. Allowed maximum: ${mbLimit}MB. Uploaded: ${mbUploaded}MB.`
            );
        }
    }
}

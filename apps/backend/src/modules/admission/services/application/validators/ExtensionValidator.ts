import { ValidationError } from '../../../errors/ValidationError';

export class ExtensionValidator {
    public validate(extension: string, allowedExtensions: string[]): void {
        const extLower = extension.toLowerCase().replace(/^\./, '');
        const allowedLower = allowedExtensions.map(e => e.toLowerCase().replace(/^\./, ''));
        
        if (!allowedLower.includes(extLower)) {
            throw new ValidationError(
                `Unsupported File Extension: ".${extLower}". Allowed extensions: ${allowedExtensions.join(', ')}`
            );
        }
    }
}

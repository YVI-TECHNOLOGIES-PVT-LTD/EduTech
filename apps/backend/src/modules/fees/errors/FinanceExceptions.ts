export class StructureNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StructureNotFoundException';
    }
}

export class ApplicantNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApplicantNotFoundException';
    }
}

export class ClassMappingException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ClassMappingException';
    }
}

export class PaymentValidationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaymentValidationException';
    }
}

export class DuplicateDemandException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DuplicateDemandException';
    }
}

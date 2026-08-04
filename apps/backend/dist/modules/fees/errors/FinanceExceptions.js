"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateDemandException = exports.PaymentValidationException = exports.ClassMappingException = exports.ApplicantNotFoundException = exports.StructureNotFoundException = void 0;
class StructureNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'StructureNotFoundException';
    }
}
exports.StructureNotFoundException = StructureNotFoundException;
class ApplicantNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApplicantNotFoundException';
    }
}
exports.ApplicantNotFoundException = ApplicantNotFoundException;
class ClassMappingException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ClassMappingException';
    }
}
exports.ClassMappingException = ClassMappingException;
class PaymentValidationException extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaymentValidationException';
    }
}
exports.PaymentValidationException = PaymentValidationException;
class DuplicateDemandException extends Error {
    constructor(message) {
        super(message);
        this.name = 'DuplicateDemandException';
    }
}
exports.DuplicateDemandException = DuplicateDemandException;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarcodeService = void 0;
class BarcodeService {
    constructor(identityRepo) {
        this.identityRepo = identityRepo;
    }
    async getBarcode(studentId) {
        return this.identityRepo.findBarcodeByStudentId(studentId);
    }
}
exports.BarcodeService = BarcodeService;

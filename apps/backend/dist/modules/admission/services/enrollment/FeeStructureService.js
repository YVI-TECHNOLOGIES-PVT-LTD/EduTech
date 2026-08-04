"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeStructureService = void 0;
class FeeStructureService {
    constructor(feeRepo) {
        this.feeRepo = feeRepo;
    }
    async getStructure(id) {
        return this.feeRepo.findStructureById(id);
    }
}
exports.FeeStructureService = FeeStructureService;

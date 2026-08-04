"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualAssignmentStrategy = void 0;
class ManualAssignmentStrategy {
    constructor(counselorId) {
        this.counselorId = counselorId;
    }
    async assign(lead) {
        if (!this.counselorId) {
            throw new Error('Counselor ID must be provided for manual assignment');
        }
        return this.counselorId;
    }
}
exports.ManualAssignmentStrategy = ManualAssignmentStrategy;

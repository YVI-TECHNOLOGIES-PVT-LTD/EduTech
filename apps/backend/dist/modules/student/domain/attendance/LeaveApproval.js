"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveApproval = void 0;
class LeaveApproval {
    constructor(id, requestId, approvedBy, approvedAt, remarks) {
        this.id = id;
        this.requestId = requestId;
        this.approvedBy = approvedBy;
        this.approvedAt = approvedAt;
        this.remarks = remarks;
    }
}
exports.LeaveApproval = LeaveApproval;

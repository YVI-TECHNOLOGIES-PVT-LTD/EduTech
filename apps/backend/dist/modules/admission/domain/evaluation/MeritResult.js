"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeritResult = void 0;
class MeritResult {
    constructor(id, applicationId, finalScore, rank, selectionStatus, waitlistPriority, waitlistGroup, recommendation, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.finalScore = finalScore;
        this.rank = rank;
        this.selectionStatus = selectionStatus;
        this.waitlistPriority = waitlistPriority;
        this.waitlistGroup = waitlistGroup;
        this.recommendation = recommendation;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.MeritResult = MeritResult;

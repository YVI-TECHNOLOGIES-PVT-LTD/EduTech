"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewScore = void 0;
class InterviewScore {
    constructor(id, interviewId, criterionId, score, remarks, createdAt) {
        this.id = id;
        this.interviewId = interviewId;
        this.criterionId = criterionId;
        this.score = score;
        this.remarks = remarks;
        this.createdAt = createdAt;
    }
}
exports.InterviewScore = InterviewScore;

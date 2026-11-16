"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentSessionService = void 0;
const BaseService_1 = require("../BaseService");
const crypto = __importStar(require("crypto"));
class AssessmentSessionService extends BaseService_1.BaseService {
    constructor(examRepo) {
        super();
        this.examRepo = examRepo;
    }
    async generateOTP(candidateAllocationId, schoolId) {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        // Expires in 15 minutes
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        // Check if session exists, else create new
        let session = await this.examRepo.findSessionByCandidateId(candidateAllocationId);
        if (!session) {
            session = {
                id: crypto.randomUUID(),
                school_id: schoolId,
                candidate_allocation_id: candidateAllocationId,
                otp_hash: otpHash,
                otp_expires_at: expiresAt,
                status: 'CREATED'
            };
        }
        else {
            session.otp_hash = otpHash;
            session.otp_expires_at = expiresAt;
            session.status = 'CREATED';
        }
        await this.examRepo.saveSession(session);
        // Log notification dispatch (simulate email/SMS)
        console.log(`[Notification Engine] Dispatched OTP ${otp} to Candidate Allocation ID ${candidateAllocationId}`);
        return otp;
    }
    async verifyOTP(candidateAllocationId, otp) {
        const session = await this.examRepo.findSessionByCandidateId(candidateAllocationId);
        if (!session) {
            throw new Error('No active assessment session found for candidate.');
        }
        if (new Date() > new Date(session.otp_expires_at)) {
            throw new Error('OTP has expired. Please request a new one.');
        }
        const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
        if (inputHash !== session.otp_hash) {
            throw new Error('Invalid OTP code. Please try again.');
        }
        // Generate temporary cryptographic exam token
        const examToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(examToken).digest('hex');
        session.exam_token_hash = tokenHash;
        session.status = 'ACTIVE';
        session.last_heartbeat_at = new Date();
        await this.examRepo.saveSession(session);
        return examToken;
    }
    async registerHeartbeat(sessionId) {
        const session = await this.examRepo.findSessionById(sessionId);
        if (!session) {
            throw new Error('Session not found.');
        }
        session.last_heartbeat_at = new Date();
        session.status = 'ACTIVE';
        await this.examRepo.saveSession(session);
    }
}
exports.AssessmentSessionService = AssessmentSessionService;

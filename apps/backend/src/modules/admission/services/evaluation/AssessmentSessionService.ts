import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { BaseService } from '../BaseService';
import * as crypto from 'crypto';

export class AssessmentSessionService extends BaseService {
    constructor(private readonly examRepo: ExamRepository) {
        super();
    }

    public async generateOTP(candidateAllocationId: string, schoolId: string): Promise<string> {
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
        } else {
            session.otp_hash = otpHash;
            session.otp_expires_at = expiresAt;
            session.status = 'CREATED';
        }

        await this.examRepo.saveSession(session);

        // Log notification dispatch (simulate email/SMS)
        console.log(`[Notification Engine] Dispatched OTP ${otp} to Candidate Allocation ID ${candidateAllocationId}`);

        return otp;
    }

    public async verifyOTP(candidateAllocationId: string, otp: string): Promise<string> {
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

    public async registerHeartbeat(sessionId: string): Promise<void> {
        const session = await this.examRepo.findSessionById(sessionId);
        if (!session) {
            throw new Error('Session not found.');
        }

        session.last_heartbeat_at = new Date();
        session.status = 'ACTIVE';

        await this.examRepo.saveSession(session);
    }
}

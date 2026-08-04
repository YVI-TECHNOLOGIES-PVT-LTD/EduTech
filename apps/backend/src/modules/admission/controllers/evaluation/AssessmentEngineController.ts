import { Request, Response } from 'express';
import { AssessmentSessionService } from '../../services/evaluation/AssessmentSessionService';
import { AssessmentAttemptService } from '../../services/evaluation/AssessmentAttemptService';
import { AssessmentEvaluationService } from '../../services/evaluation/AssessmentEvaluationService';
import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { FeatureFlagRepository } from '../../repositories/FeatureFlagRepository';

const examRepo = new ExamRepository();
const sessionService = new AssessmentSessionService(examRepo);
const attemptService = new AssessmentAttemptService(examRepo);
const evaluationService = new AssessmentEvaluationService(examRepo);
const flagService = new FeatureFlagService(new FeatureFlagRepository());

export class AssessmentEngineController {
    private async checkFeatureFlag(req: Request, res: Response): Promise<boolean> {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const enabled = await flagService.isEnabled('admission', 'admission_assessment', envMode, schoolId);
        if (!enabled) {
            res.status(403).json({ error: 'Admission Assessment feature is currently disabled.' });
            return false;
        }
        return true;
    }

    public requestOTP = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { candidate_id } = req.body;
            const schoolId = req.context?.user?.school_id;

            if (!candidate_id || !schoolId) {
                return res.status(400).json({ error: 'Candidate ID is required.' });
            }

            const otp = await sessionService.generateOTP(candidate_id, schoolId);
            return res.status(200).json({ message: 'OTP code generated successfully.', otp }); // OTP returned for dev sandbox verification
        } catch (error: any) {
            console.error('requestOTP Error:', error);
            return res.status(500).json({ error: error.message || 'Failed to request OTP.' });
        }
    };

    public verifyOTP = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { candidate_id, otp } = req.body;

            if (!candidate_id || !otp) {
                return res.status(400).json({ error: 'Candidate ID and OTP are required.' });
            }

            const token = await sessionService.verifyOTP(candidate_id, otp);
            return res.status(200).json({ message: 'OTP verified successfully.', token });
        } catch (error: any) {
            console.error('verifyOTP Error:', error);
            return res.status(400).json({ error: error.message || 'OTP verification failed.' });
        }
    };

    public startAttempt = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { session_id } = req.body;
            const schoolId = req.context?.user?.school_id;

            if (!session_id || !schoolId) {
                return res.status(400).json({ error: 'Session ID is required.' });
            }

            const attempt = await attemptService.startAttempt(session_id, schoolId);
            return res.status(200).json({ message: 'Assessment attempt started.', attempt });
        } catch (error: any) {
            console.error('startAttempt Error:', error);
            return res.status(400).json({ error: error.message || 'Failed to start attempt.' });
        }
    };

    public loadQuestions = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { attemptId } = req.params;

            if (!attemptId) {
                return res.status(400).json({ error: 'Attempt ID is required.' });
            }

            const questions = await attemptService.loadQuestions(attemptId);
            return res.status(200).json({ questions });
        } catch (error: any) {
            console.error('loadQuestions Error:', error);
            return res.status(400).json({ error: error.message || 'Failed to load questions.' });
        }
    };

    public autosaveResponses = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { attemptId } = req.params;
            const { responses } = req.body;

            if (!attemptId || !responses) {
                return res.status(400).json({ error: 'Attempt ID and responses list are required.' });
            }

            await attemptService.saveResponses(attemptId, responses);
            return res.status(200).json({ message: 'Responses autosaved successfully.' });
        } catch (error: any) {
            console.error('autosaveResponses Error:', error);
            return res.status(400).json({ error: error.message || 'Autosave failed.' });
        }
    };

    public logTelemetryEvent = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { session_id, event_type, details } = req.body;

            if (!session_id || !event_type) {
                return res.status(400).json({ error: 'Session ID and Event Type are required.' });
            }

            await attemptService.logTelemetryEvent(session_id, event_type, details);
            return res.status(200).json({ message: 'Telemetry event logged.' });
        } catch (error: any) {
            console.error('logTelemetryEvent Error:', error);
            return res.status(400).json({ error: error.message || 'Failed to log event.' });
        }
    };

    public heartbeat = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { session_id } = req.body;

            if (!session_id) {
                return res.status(400).json({ error: 'Session ID is required.' });
            }

            await sessionService.registerHeartbeat(session_id);
            return res.status(200).json({ message: 'Heartbeat registered.' });
        } catch (error: any) {
            console.error('heartbeat Error:', error);
            return res.status(400).json({ error: error.message || 'Heartbeat registration failed.' });
        }
    };

    public submitAttempt = async (req: Request, res: Response) => {
        try {
            if (!await this.checkFeatureFlag(req, res)) return;
            const { attemptId } = req.params;

            if (!attemptId) {
                return res.status(400).json({ error: 'Attempt ID is required.' });
            }

            await evaluationService.evaluateAttempt(attemptId);
            return res.status(200).json({ message: 'Assessment submitted and evaluated.' });
        } catch (error: any) {
            console.error('submitAttempt Error:', error);
            return res.status(400).json({ error: error.message || 'Submission failed.' });
        }
    };
}

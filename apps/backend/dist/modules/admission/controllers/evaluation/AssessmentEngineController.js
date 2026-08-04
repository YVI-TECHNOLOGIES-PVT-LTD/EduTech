"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentEngineController = void 0;
const AssessmentSessionService_1 = require("../../services/evaluation/AssessmentSessionService");
const AssessmentAttemptService_1 = require("../../services/evaluation/AssessmentAttemptService");
const AssessmentEvaluationService_1 = require("../../services/evaluation/AssessmentEvaluationService");
const ExamRepository_1 = require("../../repositories/evaluation/ExamRepository");
const FeatureFlagService_1 = require("../../services/FeatureFlagService");
const FeatureFlagRepository_1 = require("../../repositories/FeatureFlagRepository");
const examRepo = new ExamRepository_1.ExamRepository();
const sessionService = new AssessmentSessionService_1.AssessmentSessionService(examRepo);
const attemptService = new AssessmentAttemptService_1.AssessmentAttemptService(examRepo);
const evaluationService = new AssessmentEvaluationService_1.AssessmentEvaluationService(examRepo);
const flagService = new FeatureFlagService_1.FeatureFlagService(new FeatureFlagRepository_1.FeatureFlagRepository());
class AssessmentEngineController {
    constructor() {
        this.requestOTP = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { candidate_id } = req.body;
                const schoolId = req.context?.user?.school_id;
                if (!candidate_id || !schoolId) {
                    return res.status(400).json({ error: 'Candidate ID is required.' });
                }
                const otp = await sessionService.generateOTP(candidate_id, schoolId);
                return res.status(200).json({ message: 'OTP code generated successfully.', otp }); // OTP returned for dev sandbox verification
            }
            catch (error) {
                console.error('requestOTP Error:', error);
                return res.status(500).json({ error: error.message || 'Failed to request OTP.' });
            }
        };
        this.verifyOTP = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { candidate_id, otp } = req.body;
                if (!candidate_id || !otp) {
                    return res.status(400).json({ error: 'Candidate ID and OTP are required.' });
                }
                const token = await sessionService.verifyOTP(candidate_id, otp);
                return res.status(200).json({ message: 'OTP verified successfully.', token });
            }
            catch (error) {
                console.error('verifyOTP Error:', error);
                return res.status(400).json({ error: error.message || 'OTP verification failed.' });
            }
        };
        this.startAttempt = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { session_id } = req.body;
                const schoolId = req.context?.user?.school_id;
                if (!session_id || !schoolId) {
                    return res.status(400).json({ error: 'Session ID is required.' });
                }
                const attempt = await attemptService.startAttempt(session_id, schoolId);
                return res.status(200).json({ message: 'Assessment attempt started.', attempt });
            }
            catch (error) {
                console.error('startAttempt Error:', error);
                return res.status(400).json({ error: error.message || 'Failed to start attempt.' });
            }
        };
        this.loadQuestions = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { attemptId } = req.params;
                if (!attemptId) {
                    return res.status(400).json({ error: 'Attempt ID is required.' });
                }
                const questions = await attemptService.loadQuestions(attemptId);
                return res.status(200).json({ questions });
            }
            catch (error) {
                console.error('loadQuestions Error:', error);
                return res.status(400).json({ error: error.message || 'Failed to load questions.' });
            }
        };
        this.autosaveResponses = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { attemptId } = req.params;
                const { responses } = req.body;
                if (!attemptId || !responses) {
                    return res.status(400).json({ error: 'Attempt ID and responses list are required.' });
                }
                await attemptService.saveResponses(attemptId, responses);
                return res.status(200).json({ message: 'Responses autosaved successfully.' });
            }
            catch (error) {
                console.error('autosaveResponses Error:', error);
                return res.status(400).json({ error: error.message || 'Autosave failed.' });
            }
        };
        this.logTelemetryEvent = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { session_id, event_type, details } = req.body;
                if (!session_id || !event_type) {
                    return res.status(400).json({ error: 'Session ID and Event Type are required.' });
                }
                await attemptService.logTelemetryEvent(session_id, event_type, details);
                return res.status(200).json({ message: 'Telemetry event logged.' });
            }
            catch (error) {
                console.error('logTelemetryEvent Error:', error);
                return res.status(400).json({ error: error.message || 'Failed to log event.' });
            }
        };
        this.heartbeat = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { session_id } = req.body;
                if (!session_id) {
                    return res.status(400).json({ error: 'Session ID is required.' });
                }
                await sessionService.registerHeartbeat(session_id);
                return res.status(200).json({ message: 'Heartbeat registered.' });
            }
            catch (error) {
                console.error('heartbeat Error:', error);
                return res.status(400).json({ error: error.message || 'Heartbeat registration failed.' });
            }
        };
        this.submitAttempt = async (req, res) => {
            try {
                if (!await this.checkFeatureFlag(req, res))
                    return;
                const { attemptId } = req.params;
                if (!attemptId) {
                    return res.status(400).json({ error: 'Attempt ID is required.' });
                }
                await evaluationService.evaluateAttempt(attemptId);
                return res.status(200).json({ message: 'Assessment submitted and evaluated.' });
            }
            catch (error) {
                console.error('submitAttempt Error:', error);
                return res.status(400).json({ error: error.message || 'Submission failed.' });
            }
        };
    }
    async checkFeatureFlag(req, res) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const enabled = await flagService.isEnabled('admission', 'admission_assessment', envMode, schoolId);
        if (!enabled) {
            res.status(403).json({ error: 'Admission Assessment feature is currently disabled.' });
            return false;
        }
        return true;
    }
}
exports.AssessmentEngineController = AssessmentEngineController;

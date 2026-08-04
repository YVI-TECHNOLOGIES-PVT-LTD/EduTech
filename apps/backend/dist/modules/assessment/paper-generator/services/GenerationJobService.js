"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationJobService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const GenerationJobRepository_1 = require("../repositories/GenerationJobRepository");
const PaperGeneratorService_1 = require("./PaperGeneratorService");
const supabase_1 = require("../../../../config/supabase");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
class GenerationJobService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.jobRepo = new GenerationJobRepository_1.GenerationJobRepository();
        this.generator = new PaperGeneratorService_1.PaperGeneratorService();
    }
    async queueGenerationJob(schoolId, userId, payload, correlationId) {
        this.logInfo(`Queueing generation job for template: ${payload.template_id}`, correlationId);
        // 1. Check concurrent generation lock
        const { data: lock } = await supabase_1.supabase
            .from('assessment_generation_locks')
            .select('*')
            .eq('resource_id', payload.blueprint_id)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        if (lock) {
            throw new Error('This blueprint is currently locked by another generation job.');
        }
        // Set lock
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes lock expiration
        await supabase_1.supabase
            .from('assessment_generation_locks')
            .insert({
            resource_type: 'BLUEPRINT',
            resource_id: payload.blueprint_id,
            locked_by: userId,
            expires_at: expiresAt.toISOString()
        });
        // 2. Create job in queue
        const job = await this.jobRepo.createJob(schoolId, payload.blueprint_id, payload.template_id, userId);
        // Process generation job asynchronously
        this.processJobAsync(job.id, schoolId, userId, payload, correlationId);
        return job;
    }
    async processJobAsync(jobId, schoolId, userId, payload, correlationId) {
        const logs = ['Job started. Acquiring locks...'];
        try {
            await this.jobRepo.updateJobStatus(jobId, 'RUNNING', logs);
            logs.push('Resolving blueprints rules...');
            const paper = await this.generator.generatePaper(schoolId, userId, payload, correlationId);
            logs.push(`Successfully generated paper ID: ${paper.id}`);
            await this.jobRepo.updateJobStatus(jobId, 'COMPLETED', logs);
            // Release lock
            await supabase_1.supabase
                .from('assessment_generation_locks')
                .delete()
                .eq('resource_id', payload.blueprint_id);
            await event_bus_service_1.EventBus.publish('PaperGenerated', { paperId: paper.id, schoolId, userId });
        }
        catch (error) {
            logs.push(`Error: ${error.message}`);
            await this.jobRepo.updateJobStatus(jobId, 'FAILED', logs, error.message);
            // Release lock on failure
            await supabase_1.supabase
                .from('assessment_generation_locks')
                .delete()
                .eq('resource_id', payload.blueprint_id);
            await event_bus_service_1.EventBus.publish('PaperGenerationFailed', { schoolId, userId, error: error.message });
        }
    }
}
exports.GenerationJobService = GenerationJobService;
exports.default = GenerationJobService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperPublishingService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PaperRepository_1 = require("../repositories/PaperRepository");
const PublishedPaperRepository_1 = require("../repositories/PublishedPaperRepository");
const PublishedSectionRepository_1 = require("../repositories/PublishedSectionRepository");
const PublishedQuestionRepository_1 = require("../repositories/PublishedQuestionRepository");
const PaperPackageRepository_1 = require("../repositories/PaperPackageRepository");
const crypto_1 = require("crypto");
class PaperPublishingService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.paperRepo = new PaperRepository_1.PaperRepository();
        this.pubRepo = new PublishedPaperRepository_1.PublishedPaperRepository();
        this.pubSecRepo = new PublishedSectionRepository_1.PublishedSectionRepository();
        this.pubQRepo = new PublishedQuestionRepository_1.PublishedQuestionRepository();
        this.packageRepo = new PaperPackageRepository_1.PaperPackageRepository();
    }
    async publishGeneratedPaper(paperId, schoolId, userId, correlationId) {
        this.logInfo(`Publishing generated paper: ${paperId} as immutable aggregate`, correlationId);
        // 1. Resolve paper detail
        const paper = await this.paperRepo.findPaperById(paperId, schoolId);
        if (!paper)
            throw new Error('Paper not found.');
        // 2. Generate paper integrity hash
        const componentsStr = JSON.stringify({
            blueprint_id: paper.blueprint_id,
            template_id: paper.template_id,
            sections: paper.sections
        });
        const paperHash = (0, crypto_1.createHash)('sha256').update(componentsStr).digest('hex');
        // 3. Save published paper master
        const publishedPaper = await this.pubRepo.publishPaper(schoolId, {
            generated_paper_id: paperId,
            blueprint_id: paper.blueprint_id,
            template_id: paper.template_id,
            name: paper.name,
            description: paper.description,
            total_marks: paper.total_marks,
            paper_hash: paperHash,
            published_by: userId
        });
        // 4. Save published sections and serialize questions snapshots
        for (const sec of paper.sections || []) {
            const savedSections = await this.pubSecRepo.savePublishedSections(publishedPaper.id, [sec]);
            const newSecId = savedSections[0].id;
            // Save question snapshots
            await this.pubQRepo.savePublishedQuestions(newSecId, sec.questions || []);
        }
        // 5. Generate package artifacts checksum
        const packageChecksum = (0, crypto_1.createHash)('sha256').update(publishedPaper.id + paperHash).digest('hex');
        await this.packageRepo.savePackage(publishedPaper.id, {
            candidate_pdf: `/exports/candidate_${publishedPaper.id}.pdf`,
            moderator_pdf: `/exports/moderator_${publishedPaper.id}.pdf`,
            answer_key_pdf: `/exports/key_${publishedPaper.id}.pdf`,
            checksum: packageChecksum,
            metadata: {
                algorithm: 'SHA256',
                version: 1
            }
        });
        return publishedPaper;
    }
}
exports.PaperPublishingService = PaperPublishingService;
exports.default = PaperPublishingService;

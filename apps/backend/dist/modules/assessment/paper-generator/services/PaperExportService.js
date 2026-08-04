"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperExportService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PaperExportRepository_1 = require("../repositories/PaperExportRepository");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
class PaperExportService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.exportRepo = new PaperExportRepository_1.PaperExportRepository();
    }
    async triggerExport(paperId, format, type, userId, correlationId) {
        this.logInfo(`Triggering paper export for: ${paperId} in format: ${format}`, correlationId);
        // Simulation output filePath path mapping
        const mockFilePath = `/exports/paper_${paperId}_${type}.${format.toLowerCase()}`;
        const log = await this.exportRepo.saveExportLog(paperId, format, type, mockFilePath, userId);
        await event_bus_service_1.EventBus.publish('PaperExported', { paperId, format, type, userId });
        return log;
    }
}
exports.PaperExportService = PaperExportService;
exports.default = PaperExportService;

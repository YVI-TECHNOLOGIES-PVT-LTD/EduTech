"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const BaseService_1 = require("./BaseService");
class TransactionManager extends BaseService_1.BaseService {
    /**
     * Executes a series of database operations sequentially.
     * If any step fails, runs the rollbacks of all successfully completed steps in reverse order.
     */
    async executeTransaction(steps, correlationId) {
        const completedSteps = [];
        const results = [];
        for (const step of steps) {
            try {
                this.logInfo(`Executing transaction step: ${step.name}`, correlationId);
                const result = await step.execute();
                results.push(result);
                completedSteps.push(step);
            }
            catch (error) {
                this.logError(`Transaction step failed: ${step.name}. Initiating rollback sequence.`, error, correlationId);
                await this.rollback(completedSteps, correlationId);
                throw error;
            }
        }
        return results;
    }
    async rollback(completedSteps, correlationId) {
        // Rollback completed steps in reverse order
        for (let i = completedSteps.length - 1; i >= 0; i--) {
            const step = completedSteps[i];
            try {
                this.logInfo(`Compensating step: ${step.name}`, correlationId);
                await step.rollback();
            }
            catch (rollbackError) {
                this.logError(`Failed to compensate step: ${step.name}`, rollbackError, correlationId);
            }
        }
    }
}
exports.TransactionManager = TransactionManager;

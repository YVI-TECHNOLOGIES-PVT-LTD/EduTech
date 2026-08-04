import { BaseService } from './BaseService';

export interface TransactionStep {
    name: string;
    execute: () => Promise<any>;
    rollback: () => Promise<void>;
}

export class TransactionManager extends BaseService {
    /**
     * Executes a series of database operations sequentially. 
     * If any step fails, runs the rollbacks of all successfully completed steps in reverse order.
     */
    public async executeTransaction(steps: TransactionStep[], correlationId?: string): Promise<any[]> {
        const completedSteps: TransactionStep[] = [];
        const results: any[] = [];

        for (const step of steps) {
            try {
                this.logInfo(`Executing transaction step: ${step.name}`, correlationId);
                const result = await step.execute();
                results.push(result);
                completedSteps.push(step);
            } catch (error: any) {
                this.logError(`Transaction step failed: ${step.name}. Initiating rollback sequence.`, error, correlationId);
                await this.rollback(completedSteps, correlationId);
                throw error;
            }
        }

        return results;
    }

    private async rollback(completedSteps: TransactionStep[], correlationId?: string): Promise<void> {
        // Rollback completed steps in reverse order
        for (let i = completedSteps.length - 1; i >= 0; i--) {
            const step = completedSteps[i];
            try {
                this.logInfo(`Compensating step: ${step.name}`, correlationId);
                await step.rollback();
            } catch (rollbackError) {
                this.logError(`Failed to compensate step: ${step.name}`, rollbackError, correlationId);
            }
        }
    }
}

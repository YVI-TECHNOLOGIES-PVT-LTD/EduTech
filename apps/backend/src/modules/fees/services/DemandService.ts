import { supabase } from '../../../config/supabase';
import { DocumentNumberService } from './DocumentNumberService';
import { LedgerPostingService } from './LedgerPostingService';
import { EventPublisher } from './EventPublisher';

export class DemandService {
    /**
     * Allocates a fee demand for an application or student.
     */
    public static async generateDemand(params: {
        application_id?: string;
        student_id?: string;
        fee_structure_id: string;
        due_date: string;
        performedBy: string;
    }): Promise<any> {
        const { application_id, student_id, fee_structure_id, due_date, performedBy } = params;

        let resolvedStructureId = fee_structure_id;
        
        // Check if the provided fee_structure_id exists in finance_fee_structures; if not, map via LegacyStructureAdapter
        const { data: isFinance } = await supabase
            .from('finance_fee_structures')
            .select('id')
            .eq('id', fee_structure_id)
            .maybeSingle();

        if (!isFinance) {
            const { LegacyStructureAdapter } = await import('./LegacyStructureAdapter');
            resolvedStructureId = await LegacyStructureAdapter.mapLegacyToFinanceStructure(fee_structure_id);
        }

        // 1. Fetch template components to snapshot
        const { data: components, error: compErr } = await supabase
            .from('finance_fee_structure_components')
            .select('*')
            .eq('fee_structure_id', resolvedStructureId)
            .order('display_order', { ascending: true });

        if (compErr || !components || components.length === 0) {
            throw new Error(`No components found under this Fee Structure template: ${resolvedStructureId}`);
        }

        // Sum up total amount
        const totalAmount = components.reduce((sum, c) => sum + Number(c.amount), 0);

        // 2. Generate demand number
        const schoolId = 'GWH001';
        const demand_no = await DocumentNumberService.generateNextNumber('DEM', schoolId);

        // 3. Create Demand Record
        const { data: demand, error: demErr } = await supabase
            .from('fee_demands')
            .insert({
                demand_no,
                application_id: application_id || null,
                student_id: student_id || null,
                fee_structure_id: resolvedStructureId,
                amount: totalAmount,
                balance_amount: totalAmount,
                due_date,
                status: 'PENDING'
            })
            .select()
            .single();

        if (demErr || !demand) {
            throw new Error(`Failed to create fee demand: ${demErr?.message}`);
        }

        // 4. Copy components into historical snapshot demand items
        const itemsToInsert = components.map(c => ({
            demand_id: demand.id,
            name: c.name,
            category: c.category,
            amount: c.amount
        }));

        const { error: itemsErr } = await supabase.from('fee_demand_items').insert(itemsToInsert);
        if (itemsErr) throw itemsErr;

        // 5. Post to Ledger (Debit increases the outstanding balance)
        await LedgerPostingService.postEntry({
            application_id: application_id || null,
            student_id: student_id || null,
            transaction_type: 'DEMAND',
            debit: totalAmount,
            credit: 0,
            reference_type: 'FEE_DEMAND',
            reference_id: demand.id
        });

        // 6. Log Finance Audit Log
        await supabase.from('finance_audit_logs').insert({
            action: 'DEMAND_GENERATED',
            entity_type: 'fee_demands',
            entity_id: demand.id,
            performed_by: performedBy,
            details: { demand_no, amount: totalAmount }
        });

        // 7. Emit Domain Event
        await EventPublisher.publish('FeeDemandCreated', {
            demand_id: demand.id,
            demand_no,
            application_id,
            student_id,
            amount: totalAmount
        });

        return demand;
    }
}

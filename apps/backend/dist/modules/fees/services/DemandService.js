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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandService = void 0;
const supabase_1 = require("../../../config/supabase");
const DocumentNumberService_1 = require("./DocumentNumberService");
const LedgerPostingService_1 = require("./LedgerPostingService");
const EventPublisher_1 = require("./EventPublisher");
class DemandService {
    /**
     * Allocates a fee demand for an application or student.
     */
    static async generateDemand(params) {
        const { application_id, student_id, fee_structure_id, due_date, performedBy } = params;
        let resolvedStructureId = fee_structure_id;
        // Check if the provided fee_structure_id exists in finance_fee_structures; if not, map via LegacyStructureAdapter
        const { data: isFinance } = await supabase_1.supabase
            .from('finance_fee_structures')
            .select('id')
            .eq('id', fee_structure_id)
            .maybeSingle();
        if (!isFinance) {
            const { LegacyStructureAdapter } = await Promise.resolve().then(() => __importStar(require('./LegacyStructureAdapter')));
            resolvedStructureId = await LegacyStructureAdapter.mapLegacyToFinanceStructure(fee_structure_id);
        }
        // 1. Fetch template components to snapshot
        const { data: components, error: compErr } = await supabase_1.supabase
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
        const demand_no = await DocumentNumberService_1.DocumentNumberService.generateNextNumber('DEM', schoolId);
        // 3. Create Demand Record
        const { data: demand, error: demErr } = await supabase_1.supabase
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
        const { error: itemsErr } = await supabase_1.supabase.from('fee_demand_items').insert(itemsToInsert);
        if (itemsErr)
            throw itemsErr;
        // 5. Post to Ledger (Debit increases the outstanding balance)
        await LedgerPostingService_1.LedgerPostingService.postEntry({
            application_id: application_id || null,
            student_id: student_id || null,
            transaction_type: 'DEMAND',
            debit: totalAmount,
            credit: 0,
            reference_type: 'FEE_DEMAND',
            reference_id: demand.id
        });
        // 6. Log Finance Audit Log
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'DEMAND_GENERATED',
            entity_type: 'fee_demands',
            entity_id: demand.id,
            performed_by: performedBy,
            details: { demand_no, amount: totalAmount }
        });
        // 7. Emit Domain Event
        await EventPublisher_1.EventPublisher.publish('FeeDemandCreated', {
            demand_id: demand.id,
            demand_no,
            application_id,
            student_id,
            amount: totalAmount
        });
        return demand;
    }
}
exports.DemandService = DemandService;

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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandService = void 0;
const prismaClient_1 = __importDefault(require("../../../lib/prismaClient"));
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
        let components = [];
        // 1. First check if fee_structure_id exists in schema.prisma fee_structures
        const prismaStruct = await prismaClient_1.default.fee_structures.findUnique({
            where: { fee_structure_id },
            include: { fee_components: { orderBy: { display_order: 'asc' } } },
        });
        if (prismaStruct && prismaStruct.fee_components.length > 0) {
            components = prismaStruct.fee_components.map((c) => ({
                id: c.fee_component_id,
                name: c.component_name,
                code: c.component_code,
                amount: Number(c.amount),
            }));
        }
        else {
            // Fallback for legacy adapters
            const { data: isFinance } = await supabase_1.supabase
                .from('finance_fee_structures')
                .select('id')
                .eq('id', fee_structure_id)
                .maybeSingle();
            if (!isFinance) {
                const { LegacyStructureAdapter } = await Promise.resolve().then(() => __importStar(require('./LegacyStructureAdapter')));
                resolvedStructureId =
                    await LegacyStructureAdapter.mapLegacyToFinanceStructure(fee_structure_id);
            }
            const { data: legacyComponents } = await supabase_1.supabase
                .from('finance_fee_structure_components')
                .select('*')
                .eq('fee_structure_id', resolvedStructureId)
                .order('display_order', { ascending: true });
            if (legacyComponents && legacyComponents.length > 0) {
                components = legacyComponents;
            }
        }
        if (!components || components.length === 0) {
            throw new Error(`No components found under this Fee Structure template: ${fee_structure_id}`);
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
            status: 'PENDING',
        })
            .select()
            .single();
        if (demErr || !demand) {
            throw new Error(`Failed to create fee demand: ${demErr?.message}`);
        }
        // 4. Copy components into historical snapshot demand items
        const itemsToInsert = components.map((c) => ({
            demand_id: demand.id,
            name: c.name,
            category: c.category,
            amount: c.amount,
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
            reference_id: demand.id,
        });
        // 6. Log Finance Audit Log
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'DEMAND_GENERATED',
            entity_type: 'fee_demands',
            entity_id: demand.id,
            performed_by: performedBy,
            details: { demand_no, amount: totalAmount },
        });
        // 7. Emit Domain Event
        await EventPublisher_1.EventPublisher.publish('FeeDemandCreated', {
            demand_id: demand.id,
            demand_no,
            application_id,
            student_id,
            amount: totalAmount,
        });
        return demand;
    }
}
exports.DemandService = DemandService;

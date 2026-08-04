"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferRepository = void 0;
const OfferLetter_1 = require("../../domain/evaluation/OfferLetter");
const supabase_1 = require("../../../../config/supabase");
class OfferRepository {
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_offer_letters')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new OfferLetter_1.OfferLetter(data.id, data.application_id, data.offer_number, data.template_id, new Date(data.issue_date), data.acceptance_date ? new Date(data.acceptance_date) : null, new Date(data.expiry_date), data.status, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async findByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_offer_letters')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new OfferLetter_1.OfferLetter(data.id, data.application_id, data.offer_number, data.template_id, new Date(data.issue_date), data.acceptance_date ? new Date(data.acceptance_date) : null, new Date(data.expiry_date), data.status, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async save(offer) {
        const { error } = await supabase_1.supabase
            .from('admission_offer_letters')
            .upsert({
            id: offer.id,
            application_id: offer.applicationId,
            offer_number: offer.offerNumber,
            template_id: offer.templateId,
            issue_date: offer.issueDate.toISOString().substring(0, 10),
            acceptance_date: offer.acceptanceDate?.toISOString().substring(0, 10) || null,
            expiry_date: offer.expiryDate.toISOString().substring(0, 10),
            status: offer.status,
            updated_at: offer.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async findTemplateById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_offer_templates')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async findActiveTemplates() {
        const { data, error } = await supabase_1.supabase
            .from('admission_offer_templates')
            .select('*')
            .eq('active', true);
        if (error)
            throw error;
        return data || [];
    }
    async saveTemplate(template) {
        const { error } = await supabase_1.supabase
            .from('admission_offer_templates')
            .upsert({
            id: template.id,
            name: template.name,
            content_body: template.content_body,
            active: template.active
        });
        if (error)
            throw error;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('offer_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
}
exports.OfferRepository = OfferRepository;

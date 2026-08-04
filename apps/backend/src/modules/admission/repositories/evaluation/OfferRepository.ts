import { OfferLetter, OfferStatus } from '../../domain/evaluation/OfferLetter';
import { supabase } from '../../../../config/supabase';

export class OfferRepository {
    public async findById(id: string): Promise<OfferLetter | null> {
        const { data, error } = await supabase
            .from('admission_offer_letters')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new OfferLetter(
            data.id,
            data.application_id,
            data.offer_number,
            data.template_id,
            new Date(data.issue_date),
            data.acceptance_date ? new Date(data.acceptance_date) : null,
            new Date(data.expiry_date),
            data.status as OfferStatus,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async findByApplicationId(applicationId: string): Promise<OfferLetter | null> {
        const { data, error } = await supabase
            .from('admission_offer_letters')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data ? new OfferLetter(
            data.id,
            data.application_id,
            data.offer_number,
            data.template_id,
            new Date(data.issue_date),
            data.acceptance_date ? new Date(data.acceptance_date) : null,
            new Date(data.expiry_date),
            data.status as OfferStatus,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async save(offer: OfferLetter): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async findTemplateById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_offer_templates')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findActiveTemplates(): Promise<any[]> {
        const { data, error } = await supabase
            .from('admission_offer_templates')
            .select('*')
            .eq('active', true);

        if (error) throw error;
        return data || [];
    }

    public async saveTemplate(template: any): Promise<void> {
        const { error } = await supabase
            .from('admission_offer_templates')
            .upsert({
                id: template.id,
                name: template.name,
                content_body: template.content_body,
                active: template.active
            });

        if (error) throw error;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('offer_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }
}

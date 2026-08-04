import { supabase } from '../../../../config/supabase';

export class DocumentTypeRepository {
    public async findByCode(code: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .eq('code', code)
            .eq('active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .eq('id', id)
            .eq('active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findActiveMandatory(): Promise<any[]> {
        const { data, error } = await supabase
            .from('document_types')
            .select('*')
            .eq('active', true)
            .eq('mandatory', true);

        if (error) throw error;
        return data ?? [];
    }
}

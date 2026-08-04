"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTypeRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
class DocumentTypeRepository {
    async findByCode(code) {
        const { data, error } = await supabase_1.supabase
            .from('document_types')
            .select('*')
            .eq('code', code)
            .eq('active', true)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('document_types')
            .select('*')
            .eq('id', id)
            .eq('active', true)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async findActiveMandatory() {
        const { data, error } = await supabase_1.supabase
            .from('document_types')
            .select('*')
            .eq('active', true)
            .eq('mandatory', true);
        if (error)
            throw error;
        return data ?? [];
    }
}
exports.DocumentTypeRepository = DocumentTypeRepository;

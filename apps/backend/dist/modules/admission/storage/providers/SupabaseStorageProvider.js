"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageProvider = void 0;
const supabase_1 = require("../../../../config/supabase");
class SupabaseStorageProvider {
    async upload(bucket, path, fileBuffer, mimeType) {
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .upload(path, fileBuffer, {
            contentType: mimeType,
            upsert: true
        });
        if (error)
            throw error;
        return data.path;
    }
    async download(bucket, path) {
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .download(path);
        if (error)
            throw error;
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    async delete(bucket, path) {
        const { error } = await supabase_1.supabase.storage
            .from(bucket)
            .remove([path]);
        if (error)
            throw error;
    }
    async exists(bucket, path) {
        const dir = path.substring(0, path.lastIndexOf('/'));
        const filename = path.substring(path.lastIndexOf('/') + 1);
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .list(dir || undefined, {
            search: filename
        });
        if (error)
            return false;
        return (data || []).some((f) => f.name === filename);
    }
    async generateSignedUrl(bucket, path, expiresInSeconds) {
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresInSeconds);
        if (error)
            throw error;
        return data.signedUrl;
    }
}
exports.SupabaseStorageProvider = SupabaseStorageProvider;

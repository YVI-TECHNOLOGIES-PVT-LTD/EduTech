import { IDocumentStorageProvider } from '../interfaces/IDocumentStorageProvider';
import { supabase } from '../../../../config/supabase';

export class SupabaseStorageProvider implements IDocumentStorageProvider {
    public async upload(bucket: string, path: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) throw error;
        return data.path;
    }

    public async download(bucket: string, path: string): Promise<Buffer> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);

        if (error) throw error;
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    public async delete(bucket: string, path: string): Promise<void> {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    }

    public async exists(bucket: string, path: string): Promise<boolean> {
        const dir = path.substring(0, path.lastIndexOf('/'));
        const filename = path.substring(path.lastIndexOf('/') + 1);
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(dir || undefined, {
                search: filename
            });

        if (error) return false;
        return (data || []).some((f: any) => f.name === filename);
    }

    public async generateSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string> {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresInSeconds);

        if (error) throw error;
        return data.signedUrl;
    }
}

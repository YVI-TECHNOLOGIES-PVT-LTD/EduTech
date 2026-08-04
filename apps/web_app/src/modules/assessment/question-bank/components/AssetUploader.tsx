import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { UploadCloud, Paperclip, Trash2, FileText, FileAudio, FileVideo } from 'lucide-react';
import { useToast } from '../../../../components/ui/use-toast';
import { useQuestionAssets } from '../hooks/useQuestionBank';

interface AssetUploaderProps {
    questionId?: string;
    onAssetsChange?: (assets: any[]) => void;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({ questionId, onAssetsChange }) => {
    const { toast } = useToast();
    const { assets, uploadAsset, deleteAsset } = useQuestionAssets(questionId);
    const [dragging, setDragging] = useState(false);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file types
            const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'audio/mpeg', 'video/mp4'];
            if (!allowed.includes(file.type)) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File',
                    description: `${file.name} format is not supported.`
                });
                continue;
            }

            try {
                // Register asset metadata
                const payload = {
                    file_name: file.name,
                    file_path: `https://supabase.co/storage/v1/object/public/assets/${file.name}`,
                    mime_type: file.type,
                    file_size: file.size
                };
                
                await uploadAsset(payload);
                toast({
                    title: 'Asset Uploaded',
                    description: `${file.name} registered successfully.`
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message
                });
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this attachment?')) return;
        try {
            await deleteAsset(id);
            toast({
                title: 'Deleted',
                description: 'Attachment removed successfully.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        }
    };

    const getIcon = (mime: string) => {
        if (mime.startsWith('image/')) return Paperclip;
        if (mime.startsWith('audio/')) return FileAudio;
        if (mime.startsWith('video/')) return FileVideo;
        return FileText;
    };

    return (
        <div className="space-y-4">
            <Label className="text-[10px] font-black text-gray-400 uppercase">Question media attachments</Label>
            
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileUpload(e.dataTransfer.files); }}
                className={`border border-dashed p-6 rounded-2xl text-center flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    dragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:bg-gray-50/55'
                }`}
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                    input.click();
                }}
            >
                <UploadCloud className="w-8 h-8 text-gray-400" />
                <div>
                    <p className="text-xs font-black text-gray-800">Drag & Drop files here</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">Supports JPEG, PNG, PDF, MP3, MP4 up to 10MB</p>
                </div>
            </div>

            {assets.length > 0 && (
                <div className="space-y-2">
                    {assets.map((asset) => {
                        const Icon = getIcon(asset.mime_type);
                        return (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-premium-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{asset.file_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{(asset.file_size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(asset.id)}
                                    className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/5 rounded-lg shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
export default AssetUploader;

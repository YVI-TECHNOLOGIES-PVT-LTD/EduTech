import React, { useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface AttachmentPickerProps {
    files: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
}

export function AttachmentPicker({ files, onChange, maxFiles = 5 }: AttachmentPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        onChange([...files, ...newFiles].slice(0, maxFiles));
        e.target.value = '';
    };

    const removeFile = (idx: number) => {
        onChange(files.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-2">
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleAdd} />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1 h-8"
                onClick={() => inputRef.current?.click()}
                disabled={files.length >= maxFiles}
            >
                <Paperclip className="w-3.5 h-3.5" />
                Attach ({files.length}/{maxFiles})
            </Button>
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                        <span
                            key={`${f.name}-${i}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-[10px] font-semibold"
                        >
                            {f.name}
                            <button type="button" onClick={() => removeFile(i)}>
                                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

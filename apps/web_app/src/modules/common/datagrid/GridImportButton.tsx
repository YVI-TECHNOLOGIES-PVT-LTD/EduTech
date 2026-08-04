import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface GridImportButtonProps {
    onImport: (file: File) => void | Promise<void>;
    accept?: string;
}

export function GridImportButton({ onImport, accept = '.csv,.json,.xlsx' }: GridImportButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            void onImport(file);
            e.target.value = '';
        }
    };

    return (
        <>
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
            <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl text-xs gap-2"
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="w-3.5 h-3.5" />
                Import
            </Button>
        </>
    );
}

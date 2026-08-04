import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface DocumentDownloadProps {
    label?: string;
    onDownload: () => void;
}

export function DocumentDownload({ label = 'Download', onDownload }: DocumentDownloadProps) {
    return (
        <Button variant="outline" size="sm" onClick={onDownload} className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            {label}
        </Button>
    );
}

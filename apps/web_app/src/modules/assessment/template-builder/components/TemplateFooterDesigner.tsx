import React from 'react';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Footprints } from 'lucide-react';
import { TemplateFooterConfig } from '../services/template.api';

interface TemplateFooterDesignerProps {
    footer: TemplateFooterConfig;
    onChange: (footer: TemplateFooterConfig) => void;
}

export const TemplateFooterDesigner: React.FC<TemplateFooterDesignerProps> = ({ footer, onChange }) => {
    const handleToggle = (key: keyof TemplateFooterConfig) => {
        onChange({
            ...footer,
            [key]: !footer[key]
        });
    };

    const footerFields: { key: keyof TemplateFooterConfig; label: string }[] = [
        { key: 'invigilator_signature', label: 'Invigilator Signature' },
        { key: 'chief_superintendent', label: 'Chief Superintendent block' },
        { key: 'generated_timestamp', label: 'Generated Timestamp label' },
        { key: 'page_number', label: 'Page Numbers indicator' },
        { key: 'confidential_watermark', label: 'Confidential Watermark' },
        { key: 'qr_verification', label: 'QR Verification details' },
        { key: 'instructions_footer', label: 'Instructions Footer note' }
    ];

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-5 flex flex-row items-center gap-2">
                <Footprints className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider">Footer Component Designer</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
                {footerFields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                        <Label className="text-xs font-bold text-gray-700">{field.label}</Label>
                        <Switch
                            checked={footer[field.key]}
                            onCheckedChange={() => handleToggle(field.key)}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
export default TemplateFooterDesigner;

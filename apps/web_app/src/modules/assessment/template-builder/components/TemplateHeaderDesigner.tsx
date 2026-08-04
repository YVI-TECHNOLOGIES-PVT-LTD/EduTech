import React from 'react';
import { Switch } from '../../../../components/ui/switch';
import { Label } from '../../../../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Heading } from 'lucide-react';
import { TemplateHeaderConfig } from '../services/template.api';

interface TemplateHeaderDesignerProps {
    header: TemplateHeaderConfig;
    onChange: (header: TemplateHeaderConfig) => void;
}

export const TemplateHeaderDesigner: React.FC<TemplateHeaderDesignerProps> = ({ header, onChange }) => {
    const handleToggle = (key: keyof TemplateHeaderConfig) => {
        onChange({
            ...header,
            [key]: !header[key]
        });
    };

    const headerFields: { key: keyof TemplateHeaderConfig; label: string }[] = [
        { key: 'institution_logo', label: 'Institution Logo' },
        { key: 'school_name', label: 'School Name label' },
        { key: 'exam_name', label: 'Exam Name label' },
        { key: 'subject', label: 'Subject Classification' },
        { key: 'class', label: 'Target Class Section' },
        { key: 'academic_year', label: 'Academic Year' },
        { key: 'exam_date', label: 'Exam Date' },
        { key: 'duration', label: 'Exam Duration' },
        { key: 'max_marks', label: 'Maximum Marks' },
        { key: 'student_name', label: 'Candidate Name Input field' },
        { key: 'hall_ticket', label: 'Hall Ticket Roll number block' },
        { key: 'signature_block', label: 'Signature block input' },
        { key: 'qr_code', label: 'QR Code Verification' },
        { key: 'barcode', label: 'Barcode identification' }
    ];

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-5 flex flex-row items-center gap-2">
                <Heading className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider">Header Component Designer</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
                {headerFields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-100 rounded-xl">
                        <Label className="text-xs font-bold text-gray-700">{field.label}</Label>
                        <Switch
                            checked={header[field.key]}
                            onCheckedChange={() => handleToggle(field.key)}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
export default TemplateHeaderDesigner;

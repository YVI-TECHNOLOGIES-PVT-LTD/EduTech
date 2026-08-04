import React from 'react';
import { FileText } from 'lucide-react';

const TEMPLATES: Record<string, { id: string; name: string; subject?: string; body: string }[]> = {
    email: [
        { id: 'welcome', name: 'Welcome', subject: 'Welcome to EduTrack', body: 'Dear {{name}},\n\nWelcome to our institution.' },
        { id: 'fee-reminder', name: 'Fee Reminder', subject: 'Fee Payment Reminder', body: 'Dear {{name}},\n\nThis is a reminder regarding pending fee payment.' },
        { id: 'admission-update', name: 'Admission Update', subject: 'Application Status Update', body: 'Dear {{name}},\n\nYour application status has been updated.' },
    ],
    sms: [
        { id: 'otp', name: 'OTP', body: 'Your OTP is {{otp}}. Valid for 10 minutes.' },
        { id: 'fee-due', name: 'Fee Due', body: 'Fee of Rs.{{amount}} is due on {{date}}. - EduTrack' },
    ],
    whatsapp: [
        { id: 'welcome-wa', name: 'Welcome', body: 'Hello {{name}}! Welcome to EduTrack ERP.' },
        { id: 'transport-update', name: 'Transport Update', body: 'Bus route update: {{details}}' },
    ],
};

interface TemplateSelectorProps {
    channel: 'email' | 'sms' | 'whatsapp';
    onSelect: (template: { subject?: string; body: string }) => void;
}

export function TemplateSelector({ channel, onSelect }: TemplateSelectorProps) {
    const templates = TEMPLATES[channel] || [];

    return (
        <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <select
                defaultValue=""
                onChange={e => {
                    const t = templates.find(tpl => tpl.id === e.target.value);
                    if (t) onSelect(t);
                    e.target.value = '';
                }}
                className="flex-1 bg-muted/30 border border-border rounded-lg px-2 py-1.5 text-xs"
            >
                <option value="" disabled>
                    Insert template...
                </option>
                {templates.map(t => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

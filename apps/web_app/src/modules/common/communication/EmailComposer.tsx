import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TemplateSelector } from './TemplateSelector';
import { AttachmentPicker } from './AttachmentPicker';

interface EmailComposerProps {
    defaultTo?: string;
    onSend: (payload: Record<string, string>) => void | Promise<void>;
}

export function EmailComposer({ defaultTo = '', onSend }: EmailComposerProps) {
    const [to, setTo] = useState(defaultTo);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await onSend({ to, subject, body, attachments: attachments.map(f => f.name).join(',') });
            setSubject('');
            setBody('');
            setAttachments([]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-3">
            <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="Recipient email"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs"
            />
            <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs"
            />
            <TemplateSelector
                channel="email"
                onSelect={template => {
                    setSubject(template.subject || '');
                    setBody(template.body);
                }}
            />
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Email body..."
                rows={5}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs resize-none"
            />
            <AttachmentPicker files={attachments} onChange={setAttachments} />
            <Button onClick={handleSend} disabled={sending || !to || !body} className="gap-2 text-xs">
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send Email'}
            </Button>
        </div>
    );
}

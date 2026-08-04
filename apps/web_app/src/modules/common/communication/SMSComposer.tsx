import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TemplateSelector } from './TemplateSelector';

interface SMSComposerProps {
    defaultPhone?: string;
    onSend: (payload: Record<string, string>) => void | Promise<void>;
}

export function SMSComposer({ defaultPhone = '', onSend }: SMSComposerProps) {
    const [phone, setPhone] = useState(defaultPhone);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await onSend({ phone, message });
            setMessage('');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-3">
            <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs"
            />
            <TemplateSelector channel="sms" onSelect={t => setMessage(t.body)} />
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="SMS message (160 chars)..."
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{message.length}/160</p>
            <Button onClick={handleSend} disabled={sending || !phone || !message} className="gap-2 text-xs">
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send SMS'}
            </Button>
        </div>
    );
}

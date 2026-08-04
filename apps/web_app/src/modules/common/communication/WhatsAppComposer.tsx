import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TemplateSelector } from './TemplateSelector';

interface WhatsAppComposerProps {
    defaultPhone?: string;
    onSend: (payload: Record<string, string>) => void | Promise<void>;
}

export function WhatsAppComposer({ defaultPhone = '', onSend }: WhatsAppComposerProps) {
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
                placeholder="WhatsApp number"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs"
            />
            <TemplateSelector channel="whatsapp" onSelect={t => setMessage(t.body)} />
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="WhatsApp message..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs resize-none"
            />
            <Button onClick={handleSend} disabled={sending || !phone || !message} className="gap-2 text-xs">
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send WhatsApp'}
            </Button>
        </div>
    );
}

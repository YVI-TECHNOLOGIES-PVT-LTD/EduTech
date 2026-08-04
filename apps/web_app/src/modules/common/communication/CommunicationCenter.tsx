import React, { useState } from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { EmailComposer } from './EmailComposer';
import { SMSComposer } from './SMSComposer';
import { WhatsAppComposer } from './WhatsAppComposer';
import { MessageTimeline } from './MessageTimeline';

interface CommunicationCenterProps {
    recipientId?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    onSend?: (channel: 'email' | 'sms' | 'whatsapp', payload: Record<string, string>) => Promise<void>;
}

export function CommunicationCenter({
    recipientId,
    recipientName,
    recipientEmail,
    recipientPhone,
    onSend,
}: CommunicationCenterProps) {
    const [messages, setMessages] = useState<
        { id: string; channel: string; body: string; sentAt: string; status: string }[]
    >([]);

    const handleSend = async (channel: 'email' | 'sms' | 'whatsapp', payload: Record<string, string>) => {
        if (onSend) await onSend(channel, payload);
        setMessages(prev => [
            {
                id: Date.now().toString(),
                channel,
                body: payload.body || payload.message || '',
                sentAt: new Date().toISOString(),
                status: 'sent',
            },
            ...prev,
        ]);
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-sm font-black uppercase tracking-wider">Communication Hub</h3>
                {recipientName && (
                    <p className="text-xs text-muted-foreground mt-1">
                        To: {recipientName}
                        {recipientEmail && ` · ${recipientEmail}`}
                    </p>
                )}
            </div>

            <Tabs defaultValue="email" className="p-4">
                <TabsList className="grid w-full grid-cols-3 rounded-xl">
                    <TabsTrigger value="email" className="text-xs gap-1">
                        <Mail className="w-3.5 h-3.5" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="text-xs gap-1">
                        <Phone className="w-3.5 h-3.5" /> SMS
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="text-xs gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-4">
                    <EmailComposer
                        defaultTo={recipientEmail}
                        onSend={payload => handleSend('email', payload)}
                    />
                </TabsContent>
                <TabsContent value="sms" className="mt-4">
                    <SMSComposer
                        defaultPhone={recipientPhone}
                        onSend={payload => handleSend('sms', payload)}
                    />
                </TabsContent>
                <TabsContent value="whatsapp" className="mt-4">
                    <WhatsAppComposer
                        defaultPhone={recipientPhone}
                        onSend={payload => handleSend('whatsapp', payload)}
                    />
                </TabsContent>
            </Tabs>

            {messages.length > 0 && (
                <div className="p-4 border-t border-border">
                    <MessageTimeline messages={messages} />
                </div>
            )}
        </div>
    );
}

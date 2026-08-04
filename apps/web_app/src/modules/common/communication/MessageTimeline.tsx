import React from 'react';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    channel: string;
    body: string;
    sentAt: string;
    status: string;
}

interface MessageTimelineProps {
    messages: Message[];
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
    email: Mail,
    sms: Phone,
    whatsapp: MessageSquare,
};

export function MessageTimeline({ messages }: MessageTimelineProps) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Message History
            </h4>
            {messages.map(msg => {
                const Icon = CHANNEL_ICON[msg.channel] || Mail;
                return (
                    <div key={msg.id} className="flex gap-3 p-3 bg-muted/20 rounded-xl">
                        <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs line-clamp-2">{msg.body}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {msg.channel.toUpperCase()} ·{' '}
                                {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true })} · {msg.status}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

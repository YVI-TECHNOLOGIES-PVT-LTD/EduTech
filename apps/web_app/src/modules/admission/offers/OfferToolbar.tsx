import { useState } from 'react';
import type { OfferRecord } from '../utils/offer.mapper';
import type { OfferAction } from '../utils/offer.workflow';
import { Button } from '../../../components/ui/button';
import {
    FilePlus,
    CheckCircle2,
    Send,
    ThumbsUp,
    ThumbsDown,
    Clock,
    Ban,
    RefreshCw,
    XCircle,
    PauseCircle,
} from 'lucide-react';

interface OfferToolbarProps {
    record: OfferRecord | null;
    canGenerate?: boolean;
    canApprove?: boolean;
    canPublish?: boolean;
    canSend?: boolean;
    canAccept?: boolean;
    canReject?: boolean;
    canWithdraw?: boolean;
    isSubmitting?: boolean;
    onAction: (action: OfferAction, payload?: Record<string, unknown>) => void;
}

export function OfferToolbar({
    record,
    canGenerate,
    canApprove,
    canPublish,
    canSend,
    canAccept,
    canReject,
    canWithdraw,
    isSubmitting,
    onAction,
}: OfferToolbarProps) {
    const [templateId, setTemplateId] = useState('');
    const [expiryDays, setExpiryDays] = useState('14');
    const [remark, setRemark] = useState('');

    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-6 text-center text-sm text-gray-400">
                Select a candidate to manage offers.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Offer Actions</h3>

            {canGenerate && record.status === 'PENDING' && (
                <div className="space-y-2 pb-3 border-b border-gray-100">
                    <input
                        type="text"
                        value={templateId}
                        onChange={e => setTemplateId(e.target.value)}
                        placeholder="Template ID (UUID)"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <input
                        type="number"
                        min={1}
                        value={expiryDays}
                        onChange={e => setExpiryDays(e.target.value)}
                        placeholder="Expiry days"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <Button
                        size="sm"
                        className="h-8 text-[10px] gap-1 bg-rose-600 text-white"
                        disabled={isSubmitting || !templateId}
                        onClick={() =>
                            onAction('generate_offer', {
                                templateId,
                                expiryDays: Number(expiryDays) || 14,
                                remark,
                            })
                        }
                    >
                        <FilePlus className="w-3.5 h-3.5" /> Generate Offer
                    </Button>
                </div>
            )}

            <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Decision remarks…"
                className="w-full px-3 py-2 border rounded-xl text-xs min-h-[50px]"
            />

            <div className="flex flex-wrap gap-2">
                {canApprove && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('approve_offer', { remark })}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </Button>
                )}
                {canPublish && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('publish_offer', { remark })}>
                        Publish
                    </Button>
                )}
                {canSend && record.status !== 'PENDING' && (
                    <>
                        <Button size="sm" className="h-8 text-[10px] gap-1 bg-indigo-600 text-white" disabled={isSubmitting} onClick={() => onAction('send_offer', { remark })}>
                            <Send className="w-3.5 h-3.5" /> Send
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('resend_offer', { remark })}>
                            <RefreshCw className="w-3.5 h-3.5" /> Resend
                        </Button>
                    </>
                )}
                {canAccept && (
                    <Button size="sm" className="h-8 text-[10px] gap-1 bg-emerald-600 text-white" disabled={isSubmitting} onClick={() => onAction('accept_offer', { remark })}>
                        <ThumbsUp className="w-3.5 h-3.5" /> Accept
                    </Button>
                )}
                {canReject && (
                    <>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600" disabled={isSubmitting} onClick={() => onAction('reject_offer', { remark })}>
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('cancel_offer', { remark })}>
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                    </>
                )}
                {canPublish && (
                    <>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('expire_offer', { remark })}>
                            <Clock className="w-3.5 h-3.5" /> Expire
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('defer_offer', { remark })}>
                            <PauseCircle className="w-3.5 h-3.5" /> Defer
                        </Button>
                    </>
                )}
                {canWithdraw && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('withdraw_offer', { remark })}>
                        <Ban className="w-3.5 h-3.5" /> Withdraw
                    </Button>
                )}
            </div>
        </div>
    );
}

export default OfferToolbar;

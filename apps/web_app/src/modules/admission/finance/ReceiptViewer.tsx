import type { ReceiptRecord } from '../utils/finance.mapper';
import { Printer, Download } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface ReceiptViewerProps {
    receipt: ReceiptRecord | null;
    onRegenerate?: () => void;
    isSubmitting?: boolean;
}

export function ReceiptViewer({ receipt, onRegenerate, isSubmitting }: ReceiptViewerProps) {
    if (!receipt) {
        return (
            <div className="border border-dashed rounded-2xl p-8 text-center text-sm text-gray-400">
                Generate or retrieve a receipt to preview.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-gray-400">Receipt Viewer</h3>
                {onRegenerate && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" disabled={isSubmitting} onClick={onRegenerate}>
                        <Download className="w-3 h-3" /> Regenerate
                    </Button>
                )}
            </div>
            <div className="border rounded-xl p-4 space-y-2 text-xs">
                <p className="font-black text-lg">{receipt.receiptNumber ?? 'Receipt'}</p>
                {receipt.amount !== undefined && <p>Amount: ₹{receipt.amount}</p>}
                {receipt.issuedAt && <p>Issued: {receipt.issuedAt}</p>}
                <p className="text-[10px] text-gray-400">Payment ID: {receipt.paymentId}</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 w-full" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print Receipt
            </Button>
        </div>
    );
}

export default ReceiptViewer;

import type { OfferRecord } from '../utils/offer.mapper';

interface OfferPreviewProps {
    record: OfferRecord | null;
}

export function OfferPreview({ record }: OfferPreviewProps) {
    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-8 text-center text-sm text-gray-400">
                Select an offer to preview letter details.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="border-b pb-4">
                <p className="text-[10px] font-black uppercase text-gray-400">Offer Letter Preview</p>
                <h3 className="text-lg font-black text-gray-900 mt-1">{record.offerNumber ?? 'Pending Generation'}</h3>
            </div>
            <div className="prose prose-sm max-w-none text-xs text-gray-700 space-y-2">
                <p>Dear Parent/Guardian of <strong>{record.candidate}</strong>,</p>
                <p>
                    We are pleased to extend an admission offer for <strong>{record.program}</strong>.
                    Application reference: <strong>{record.applicationNo}</strong>.
                </p>
                {record.expiryDate && (
                    <p>
                        This offer is valid until <strong>{record.expiryDate}</strong> (as recorded by the admission system).
                    </p>
                )}
                <p className="text-[10px] text-gray-400 italic">
                    Letter body sourced from backend offer record and audit trail — not generated locally.
                </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                <span className="px-2 py-1 bg-gray-100 rounded">Status: {record.status}</span>
                {record.scholarship && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded">Scholarship: {record.scholarship}</span>}
            </div>
        </div>
    );
}

export default OfferPreview;

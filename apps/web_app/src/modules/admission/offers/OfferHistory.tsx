import type { OfferHistoryEntry } from '../utils/offer.mapper';
import { OfferTimeline } from './OfferTimeline';

interface OfferHistoryProps {
    entries: OfferHistoryEntry[];
}

export function OfferHistory({ entries }: OfferHistoryProps) {
    return <OfferTimeline entries={entries} />;
}

export default OfferHistory;

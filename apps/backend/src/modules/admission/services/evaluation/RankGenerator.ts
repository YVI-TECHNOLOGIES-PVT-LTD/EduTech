import { TieBreaker, CandidateMeritInput } from './TieBreaker';

export class RankGenerator {
    constructor(private readonly tieBreaker: TieBreaker) {}

    /**
     * Ranks candidates.
     */
    public generateRanks(
        candidates: CandidateMeritInput[],
        tieBreakers?: string[]
    ): CandidateMeritInput[] {
        return [...candidates].sort((a, b) => {
            if (a.finalScore !== b.finalScore) {
                return b.finalScore - a.finalScore; // Descending
            }
            return this.tieBreaker.breakTie(a, b, tieBreakers);
        });
    }
}

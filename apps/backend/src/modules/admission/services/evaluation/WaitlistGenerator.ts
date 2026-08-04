import { CandidateMeritInput } from './TieBreaker';
import { SelectionStatus } from '../../domain/evaluation/MeritResult';

export interface FinalMeritAllocation {
    applicationId: string;
    finalScore: number;
    rank: number;
    status: SelectionStatus;
    waitlistPriority: number | null;
    waitlistGroup: string | null;
}

export class WaitlistGenerator {
    /**
     * Allocates seats based on configured intake limit.
     */
    public allocateSeats(
        rankedCandidates: CandidateMeritInput[],
        intakeLimit: number = 20
    ): FinalMeritAllocation[] {
        return rankedCandidates.map((candidate, index) => {
            const rank = index + 1;
            const isSelected = rank <= intakeLimit;
            
            return {
                applicationId: candidate.applicationId,
                finalScore: candidate.finalScore,
                rank,
                status: isSelected ? 'SELECTED' : 'WAITLISTED',
                waitlistPriority: isSelected ? null : (rank - intakeLimit),
                waitlistGroup: isSelected ? null : 'Primary Waitlist'
            };
        });
    }
}

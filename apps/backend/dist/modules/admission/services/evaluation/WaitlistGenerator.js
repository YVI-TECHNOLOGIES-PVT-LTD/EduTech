"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistGenerator = void 0;
class WaitlistGenerator {
    /**
     * Allocates seats based on configured intake limit.
     */
    allocateSeats(rankedCandidates, intakeLimit = 20) {
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
exports.WaitlistGenerator = WaitlistGenerator;

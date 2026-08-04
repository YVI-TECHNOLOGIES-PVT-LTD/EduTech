"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankGenerator = void 0;
class RankGenerator {
    constructor(tieBreaker) {
        this.tieBreaker = tieBreaker;
    }
    /**
     * Ranks candidates.
     */
    generateRanks(candidates, tieBreakers) {
        return [...candidates].sort((a, b) => {
            if (a.finalScore !== b.finalScore) {
                return b.finalScore - a.finalScore; // Descending
            }
            return this.tieBreaker.breakTie(a, b, tieBreakers);
        });
    }
}
exports.RankGenerator = RankGenerator;

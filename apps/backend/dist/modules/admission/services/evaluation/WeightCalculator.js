"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightCalculator = void 0;
class WeightCalculator {
    /**
     * Aggregates dynamic components scores based on weight settings.
     */
    calculate(examPercentage, interviewPercentage, weights) {
        const examWeight = weights['Exam'] ?? 60;
        const interviewWeight = weights['Interview'] ?? 40;
        const totalWeight = examWeight + interviewWeight;
        if (totalWeight === 0)
            return 0;
        const score = ((examPercentage * examWeight) + (interviewPercentage * interviewWeight)) / totalWeight;
        return Number(score.toFixed(2));
    }
}
exports.WeightCalculator = WeightCalculator;

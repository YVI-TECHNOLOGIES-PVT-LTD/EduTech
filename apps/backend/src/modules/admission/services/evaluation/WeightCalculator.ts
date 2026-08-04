export class WeightCalculator {
    /**
     * Aggregates dynamic components scores based on weight settings.
     */
    public calculate(
        examPercentage: number,
        interviewPercentage: number,
        weights: Record<string, number>
    ): number {
        const examWeight = weights['Exam'] ?? 60;
        const interviewWeight = weights['Interview'] ?? 40;
        const totalWeight = examWeight + interviewWeight;

        if (totalWeight === 0) return 0;

        const score = ((examPercentage * examWeight) + (interviewPercentage * interviewWeight)) / totalWeight;
        return Number(score.toFixed(2));
    }
}

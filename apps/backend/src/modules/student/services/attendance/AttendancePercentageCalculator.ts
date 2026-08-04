export class AttendancePercentageCalculator {
    public calculatePercentage(present: number, totalDays: number): number {
        if (totalDays <= 0) return 100.00;
        return Number(((present / totalDays) * 100).toFixed(2));
    }
}

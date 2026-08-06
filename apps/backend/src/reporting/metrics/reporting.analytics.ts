export class MetricCalculator {
  public static sum(rows: Record<string, any>[], key: string): number {
    return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  }

  public static average(rows: Record<string, any>[], key: string): number {
    if (rows.length === 0) return 0;
    return this.sum(rows, key) / rows.length;
  }
}

export class TrendAnalyzer {
  public static calculateGrowth(previousValue: number, currentValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return Math.round(((currentValue - previousValue) / previousValue) * 10000) / 100;
  }
}

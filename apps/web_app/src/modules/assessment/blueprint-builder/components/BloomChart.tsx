import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Sparkles } from 'lucide-react';

interface BloomChartProps {
    distribution: Record<string, number>;
}

export const BloomChart: React.FC<BloomChartProps> = ({ distribution }) => {
    const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-5 flex flex-row items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider">Bloom's Taxonomy distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
                <div className="space-y-2 text-xs">
                    {levels.map((level) => {
                        const pct = Number(distribution[level] || 0);
                        return (
                            <div key={level} className="space-y-1">
                                <div className="flex justify-between font-bold text-gray-700">
                                    <span className="capitalize">{level.toLowerCase()}</span>
                                    <span className="text-gray-500">{pct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
export default BloomChart;

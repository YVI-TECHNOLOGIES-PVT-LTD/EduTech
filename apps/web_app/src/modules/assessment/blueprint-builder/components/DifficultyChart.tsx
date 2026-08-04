import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { BarChart3 } from 'lucide-react';

interface DifficultyChartProps {
    distribution: Record<string, number>;
}

export const DifficultyChart: React.FC<DifficultyChartProps> = ({ distribution }) => {
    const easy = Number(distribution.EASY || 0);
    const medium = Number(distribution.MEDIUM || 0);
    const hard = Number(distribution.HARD || 0);

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-5 flex flex-row items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider">Difficulty distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                    {/* Easy */}
                    <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                            <span className="text-green-700">Easy</span>
                            <span className="text-gray-500">{easy}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${easy}%` }} />
                        </div>
                    </div>

                    {/* Medium */}
                    <div className="space-y-1 border-t border-gray-50 pt-2">
                        <div className="flex justify-between font-bold">
                            <span className="text-amber-700">Medium</span>
                            <span className="text-gray-500">{medium}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${medium}%` }} />
                        </div>
                    </div>

                    {/* Hard */}
                    <div className="space-y-1 border-t border-gray-50 pt-2">
                        <div className="flex justify-between font-bold">
                            <span className="text-rose-700">Hard</span>
                            <span className="text-gray-500">{hard}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${hard}%` }} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
export default DifficultyChart;

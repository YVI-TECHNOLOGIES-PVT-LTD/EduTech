import React from 'react';

interface FunnelStage {
    stage: string;
    count: number;
    percentage: number; // Conversion percentage
}

interface FunnelChartProps {
    data: FunnelStage[];
}

export function FunnelChart({ data }: FunnelChartProps) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Conversion Funnel Analysis
            </h4>
            
            <div className="space-y-2.5">
                {data.map((stage, idx) => {
                    const widthPercent = (stage.count / maxCount) * 100;
                    
                    return (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-800 dark:text-gray-200">{stage.stage}</span>
                                <div className="space-x-2 text-[10px] font-black text-gray-400">
                                    <span>{stage.count} Leads</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                        {stage.percentage}% CR
                                    </span>
                                </div>
                            </div>
                            
                            <div className="h-4 w-full bg-gray-100 dark:bg-muted/10 rounded-lg overflow-hidden flex">
                                <div 
                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-lg transition-all duration-300"
                                    style={{ width: `${widthPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FunnelChart;

import { Card } from '../../../components/ui/card';
import { AttendanceHeatMap, AttendanceGauge } from '../components/analytics/AttendanceWidgets';
import { BarChart2, TrendingUp, Users } from 'lucide-react';

export function AnalyticsPage() {
    return (
        <div className="space-y-6 pb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Attendance Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Review school-wide heatmap grids, monthly comparisons, and analytics charts.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <AttendanceHeatMap />
                </div>
                <div>
                    <AttendanceGauge value={93} />
                </div>
            </div>

            {/* Demographics Comparison widget */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" /> Grade-wise Breakdown
                    </h3>
                    <div className="space-y-3">
                        {[
                            { grade: 'Grade 9', rate: 94 },
                            { grade: 'Grade 10', rate: 92 },
                            { grade: 'Grade 11', rate: 95 },
                            { grade: 'Grade 12', rate: 96 }
                        ].map(item => (
                            <div key={item.grade} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-gray-600">
                                    <span>{item.grade}</span>
                                    <span>{item.rate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${item.rate}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-primary" /> Gender Distribution Comparison
                    </h3>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Male Students</span>
                                <span>93.2%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: '93.2%' }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Female Students</span>
                                <span>94.8%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-pink-500 h-full rounded-full" style={{ width: '94.8%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default AnalyticsPage;

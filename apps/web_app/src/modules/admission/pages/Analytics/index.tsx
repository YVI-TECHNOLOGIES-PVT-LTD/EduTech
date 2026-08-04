import React from 'react';
import ExecutiveAnalytics from '../../components/analytics/ExecutiveAnalytics';

export function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Executive Admission Analytics
                </h2>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                    Process metrics, conversion funnel leakages, and operational speeds
                </p>
            </div>

            <ExecutiveAnalytics />
        </div>
    );
}

export default AnalyticsPage;

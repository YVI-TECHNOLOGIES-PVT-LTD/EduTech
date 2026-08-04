import React, { useMemo } from 'react';
import { EnterpriseDataGrid } from '../../../common/datagrid/EnterpriseDataGrid';
import { useApplicationList } from '../../hooks/useApplication';
import { mapApplicationsToReportRows, type AdmissionReportRow } from '../../utils/admissionIntegration.mapper';
import { ExportMenu } from '../../../common/reports/ExportMenu';

export function ReportsPage() {
    const { applications, isLoading } = useApplicationList({ limit: 500 });

    const reportData = useMemo(() => mapApplicationsToReportRows(applications), [applications]);

    const columns = [
        { key: 'code', header: 'App Code', frozen: true, render: (row: AdmissionReportRow) => (
            <span className="text-[10px] font-black text-gray-400">{row.code}</span>
        )},
        { key: 'name', header: 'Applicant Name', sortable: true },
        { key: 'grade', header: 'Grade', sortable: true },
        { key: 'score', header: 'Aggregated Score', sortable: true },
        { key: 'status', header: 'Current Stage', sortable: true, render: (row: AdmissionReportRow) => (
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {row.status}
            </span>
        )},
        { key: 'updatedAt', header: 'Last Action' },
    ];

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Admissions Exports & Reports
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold uppercase">
                        Live pipeline data — synchronized via Admission Engine
                    </p>
                </div>

                <ExportMenu
                    title="Admissions Pipeline Report"
                    data={reportData as unknown as Record<string, unknown>[]}
                    columns={['code', 'name', 'grade', 'score', 'status', 'updatedAt']}
                />
            </div>

            {isLoading ? (
                <p className="text-xs text-gray-400 animate-pulse py-12 text-center">Loading report data…</p>
            ) : (
                <EnterpriseDataGrid
                    gridId="admissions-reports"
                    title="Admissions Reports"
                    columns={columns}
                    data={reportData}
                    filterFields={[
                        {
                            key: 'status',
                            label: 'Status',
                            options: Array.from(new Set(reportData.map(r => r.status))).map(s => ({ value: s, label: s })),
                        },
                    ]}
                    bulkActions={[]}
                />
            )}
        </div>
    );
}

export default ReportsPage;

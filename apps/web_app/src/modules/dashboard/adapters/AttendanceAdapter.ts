import { DashboardCard } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class AttendanceAdapter {
    public static mapSummaryToKPIs(data: any): DashboardCard[] {
        const rate = DashboardMapper.safeNumber(data?.attendanceRate ?? data?.rate ?? 0);
        const present = DashboardMapper.safeNumber(data?.presentCount ?? data?.present ?? 0);
        const absent = DashboardMapper.safeNumber(data?.absentCount ?? data?.absent ?? 0);

        return [
            {
                id: 'attendance.kpi.rate',
                label: 'Attendance Rate',
                value: rate,
                format: 'percentage',
                subtext: 'Daily average presence'
            },
            {
                id: 'attendance.kpi.present',
                label: 'Present Students',
                value: present,
                format: 'number',
                subtext: 'In campus today'
            },
            {
                id: 'attendance.kpi.absent',
                label: 'Absent Students',
                value: absent,
                format: 'number',
                subtext: 'Absent notifications sent'
            }
        ];
    }
}

export default AttendanceAdapter;

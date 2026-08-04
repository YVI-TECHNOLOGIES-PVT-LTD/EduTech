import { Holiday } from '../../domain/attendance/Holiday';
import { WorkingDay } from '../../domain/attendance/WorkingDay';
import { supabase } from '../../../../config/supabase';

export class HolidayRepository {
    public async findHolidayByDate(schoolId: string, date: Date): Promise<Holiday | null> {
        const { data, error } = await supabase
            .from('student_holidays')
            .select('*')
            .eq('school_id', schoolId)
            .eq('holiday_date', date.toISOString().substring(0, 10))
            .maybeSingle();

        if (error) throw error;
        return data ? new Holiday(
            data.id,
            data.school_id,
            new Date(data.holiday_date),
            data.name,
            data.description,
            new Date(data.created_at)
        ) : null;
    }

    public async saveHoliday(holiday: Holiday): Promise<void> {
        const { error } = await supabase
            .from('student_holidays')
            .upsert({
                id: holiday.id,
                school_id: holiday.schoolId,
                holiday_date: holiday.holidayDate.toISOString().substring(0, 10),
                name: holiday.name,
                description: holiday.description
            });

        if (error) throw error;
    }

    public async findWorkingDay(
        schoolId: string,
        academicYearId: string,
        grade: string,
        month: number
    ): Promise<WorkingDay | null> {
        const { data, error } = await supabase
            .from('student_working_days')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('month', month)
            .maybeSingle();

        if (error) throw error;
        return data ? new WorkingDay(
            data.id,
            data.school_id,
            data.academic_year_id,
            data.grade,
            data.month,
            data.total_working_days,
            new Date(data.created_at)
        ) : null;
    }

    public async saveWorkingDay(wd: WorkingDay): Promise<void> {
        const { error } = await supabase
            .from('student_working_days')
            .upsert({
                id: wd.id,
                school_id: wd.schoolId,
                academic_year_id: wd.academicYearId,
                grade: wd.grade,
                month: wd.month,
                total_working_days: wd.totalWorkingDays
            });

        if (error) throw error;
    }
}

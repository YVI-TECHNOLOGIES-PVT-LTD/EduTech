"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayRepository = void 0;
const Holiday_1 = require("../../domain/attendance/Holiday");
const WorkingDay_1 = require("../../domain/attendance/WorkingDay");
const supabase_1 = require("../../../../config/supabase");
class HolidayRepository {
    async findHolidayByDate(schoolId, date) {
        const { data, error } = await supabase_1.supabase
            .from('student_holidays')
            .select('*')
            .eq('school_id', schoolId)
            .eq('holiday_date', date.toISOString().substring(0, 10))
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Holiday_1.Holiday(data.id, data.school_id, new Date(data.holiday_date), data.name, data.description, new Date(data.created_at)) : null;
    }
    async saveHoliday(holiday) {
        const { error } = await supabase_1.supabase
            .from('student_holidays')
            .upsert({
            id: holiday.id,
            school_id: holiday.schoolId,
            holiday_date: holiday.holidayDate.toISOString().substring(0, 10),
            name: holiday.name,
            description: holiday.description
        });
        if (error)
            throw error;
    }
    async findWorkingDay(schoolId, academicYearId, grade, month) {
        const { data, error } = await supabase_1.supabase
            .from('student_working_days')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('month', month)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new WorkingDay_1.WorkingDay(data.id, data.school_id, data.academic_year_id, data.grade, data.month, data.total_working_days, new Date(data.created_at)) : null;
    }
    async saveWorkingDay(wd) {
        const { error } = await supabase_1.supabase
            .from('student_working_days')
            .upsert({
            id: wd.id,
            school_id: wd.schoolId,
            academic_year_id: wd.academicYearId,
            grade: wd.grade,
            month: wd.month,
            total_working_days: wd.totalWorkingDays
        });
        if (error)
            throw error;
    }
}
exports.HolidayRepository = HolidayRepository;

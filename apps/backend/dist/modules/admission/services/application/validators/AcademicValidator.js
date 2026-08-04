"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicValidator = void 0;
const supabase_1 = require("../../../../../config/supabase");
const NotFoundError_1 = require("../../../errors/NotFoundError");
class AcademicValidator {
    async validate(schoolId, academicYearId) {
        // Validate school exists
        const { data: school, error: schoolErr } = await supabase_1.supabase
            .from('schools')
            .select('id')
            .eq('id', schoolId)
            .maybeSingle();
        if (schoolErr || !school) {
            throw new NotFoundError_1.NotFoundError(`School context with ID ${schoolId} not found`);
        }
        // Validate academic year exists
        const { data: year, error: yearErr } = await supabase_1.supabase
            .from('academic_years')
            .select('id')
            .eq('id', academicYearId)
            .maybeSingle();
        if (yearErr || !year) {
            throw new NotFoundError_1.NotFoundError(`Academic Year context with ID ${academicYearId} not found`);
        }
    }
}
exports.AcademicValidator = AcademicValidator;

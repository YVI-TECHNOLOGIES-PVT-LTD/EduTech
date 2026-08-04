import { supabase } from '../../../../../config/supabase';
import { NotFoundError } from '../../../errors/NotFoundError';

export class AcademicValidator {
    public async validate(schoolId: string, academicYearId: string): Promise<void> {
        // Validate school exists
        const { data: school, error: schoolErr } = await supabase
            .from('schools')
            .select('id')
            .eq('id', schoolId)
            .maybeSingle();

        if (schoolErr || !school) {
            throw new NotFoundError(`School context with ID ${schoolId} not found`);
        }

        // Validate academic year exists
        const { data: year, error: yearErr } = await supabase
            .from('academic_years')
            .select('id')
            .eq('id', academicYearId)
            .maybeSingle();

        if (yearErr || !year) {
            throw new NotFoundError(`Academic Year context with ID ${academicYearId} not found`);
        }
    }
}

import { supabase } from '../../../../../config/supabase';
import { NotFoundError } from '../../../errors/NotFoundError';

export class AcademicValidator {
  public async validate(schoolId: string, academicYearId: string): Promise<void> {
    const prisma = (await import('../../../../../lib/prismaClient')).default;
    const school = await prisma.organizations.findUnique({
      where: { org_id: schoolId },
    });

    if (!school) {
      throw new NotFoundError(`Organization context with ID ${schoolId} not found`);
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

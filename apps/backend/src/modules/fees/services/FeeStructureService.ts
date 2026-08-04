import { supabase } from '../../../config/supabase';
import { FeeStructureRepository } from '../repositories/FeeStructureRepository';
import { FeePreviewResponseDto } from '../dto/FeePreviewDto';
import { ApplicantNotFoundException, ClassMappingException, StructureNotFoundException } from '../errors/FinanceExceptions';

export class FeeStructureService {
    /**
     * Generates a preview of the fee structure for a given application ID.
     */
    public static async getFeePreview(applicationId: string): Promise<FeePreviewResponseDto> {
        // 1. Fetch applicant info supporting both new and legacy schemas
        let schoolId: any;
        let academicYearId: any;
        let gradeAppliedFor: any;

        const { data: newApp, error: newAppErr } = await supabase
            .from('admission_applications')
            .select(`
                school_id,
                academic_year_id,
                lead:lead_id (
                    enquiry:enquiry_id (
                        grade_applied_for
                    )
                )
            `)
            .eq('id', applicationId)
            .maybeSingle();

        if (newApp) {
            schoolId = newApp.school_id;
            academicYearId = newApp.academic_year_id;
            gradeAppliedFor = (newApp as any).lead?.enquiry?.grade_applied_for;
            if (!gradeAppliedFor) {
                gradeAppliedFor = 'Grade 1'; // Safe default fallback
            }
        } else {
            // Fallback to legacy admissions table
            const { data: legacyApp, error: legacyAppErr } = await supabase
                .from('admissions')
                .select('school_id, academic_year_id, grade_applied_for')
                .eq('id', applicationId)
                .maybeSingle();

            if (legacyAppErr || !legacyApp) {
                throw new ApplicantNotFoundException(`Applicant application not found: ${applicationId}`);
            }

            schoolId = legacyApp.school_id;
            academicYearId = legacyApp.academic_year_id;
            gradeAppliedFor = legacyApp.grade_applied_for;
        }

        // 2. Fetch class ID matching grade_applied_for
        let { data: cls, error: clsErr } = await supabase
            .from('classes')
            .select('id')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .ilike('name', gradeAppliedFor)
            .limit(1);

        if ((clsErr || !cls || cls.length === 0) && gradeAppliedFor) {
            let alternativeGrade = gradeAppliedFor;
            if (gradeAppliedFor.toLowerCase().startsWith('grade')) {
                alternativeGrade = gradeAppliedFor.replace(/grade/i, 'Class').trim();
            } else if (gradeAppliedFor.toLowerCase().startsWith('class')) {
                alternativeGrade = gradeAppliedFor.replace(/class/i, 'Grade').trim();
            }
            if (alternativeGrade !== gradeAppliedFor) {
                const { data: clsAlt, error: clsAltErr } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('school_id', schoolId)
                    .eq('academic_year_id', academicYearId)
                    .ilike('name', alternativeGrade)
                    .limit(1);
                if (!clsAltErr && clsAlt && clsAlt.length > 0) {
                    cls = clsAlt;
                }
            }
        }

        if (!cls || cls.length === 0) {
            throw new ClassMappingException(`No active class found mapping to grade "${gradeAppliedFor}" for school and academic year.`);
        }

        const classId = cls[0].id;
        const todayStr = new Date().toISOString().split('T')[0];

        // 3. Retrieve structure aggregate from repository
        const aggregate = await FeeStructureRepository.getStructureAggregate({
            classId,
            academicYearId,
            date: todayStr
        });

        if (!aggregate) {
            throw new StructureNotFoundException(`No active fee structure configured for class matching "${gradeAppliedFor}" in this academic year.`);
        }

        // 4. Resolve legacy structure ID for backward compatibility mapping on client side
        let legacyStructureId: string | null = null;
        try {
            const { data: legStruct } = await supabase
                .from('admission_fee_structures')
                .select('id')
                .eq('school_id', schoolId)
                .eq('academic_year_id', academicYearId)
                .eq('grade', gradeAppliedFor)
                .limit(1)
                .maybeSingle();

            if (legStruct) {
                legacyStructureId = legStruct.id;
            }
        } catch (err) {
            console.warn('[FeeStructureService] Non-blocking warning resolving legacy structure mapping:', err);
        }

        const totalAmount = aggregate.components.reduce((sum, c) => sum + Number(c.amount), 0);

        // 5. Construct & return DTO response
        return {
            applicationId,
            classId,
            academicYearId,
            legacyStructureId,
            structure: {
                id: aggregate.structure.id,
                name: aggregate.structure.name,
                version: aggregate.structure.version,
                effectiveFrom: aggregate.structure.effective_from,
                effectiveTo: aggregate.structure.effective_to,
                academicYearId: aggregate.structure.academic_year_id
            },
            components: aggregate.components.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                amount: Number(c.amount),
                isMandatory: c.is_mandatory
            })),
            installments: aggregate.installments.map(i => ({
                id: i.id,
                term: i.term,
                dueDate: i.due_date,
                percentage: i.percentage ? Number(i.percentage) : null,
                fixedAmount: i.fixed_amount ? Number(i.fixed_amount) : null
            })),
            totalAmount,
            currency: 'INR'
        };
    }
}

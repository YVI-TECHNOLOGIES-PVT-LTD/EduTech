import prisma from '../../../lib/prismaClient';

export interface FeeStructureAggregate {
  structure: any;
  components: any[];
  installments: any[];
}

export class FeeStructureRepository {
  /**
   * Resolves and returns the aggregate of matching fee structure for a grade/class and academic year.
   * Uses schema.prisma models: fee_structures, fee_components, installment_plans, installment_plan_terms.
   */
  public static async getStructureAggregate(params: {
    classId: string;
    academicYearId: string;
    date: string;
  }): Promise<FeeStructureAggregate | null> {
    try {
      // Find fee structure for the academic_year and grade/class
      const structure = await prisma.fee_structures.findFirst({
        where: {
          academic_year_grades: {
            academic_year_id: params.academicYearId,
            OR: [{ grade_id: params.classId }, { academic_year_grade_id: params.classId }],
          },
        },
        include: {
          fee_components: {
            orderBy: { display_order: 'asc' },
          },
          academic_year_grades: {
            include: {
              academic_years: true,
              grades: true,
            },
          },
        },
      });

      if (!structure) {
        return null;
      }

      // Fetch installment plans for this academic year
      const installmentPlans = await prisma.installment_plans.findMany({
        where: {
          academic_year_id: params.academicYearId,
        },
        include: {
          installment_plan_terms: {
            orderBy: { term_number: 'asc' },
          },
        },
      });

      const installments = installmentPlans.flatMap((p) =>
        p.installment_plan_terms.map((t) => ({
          id: t.installment_term_id,
          installment_plan_id: p.installment_plan_id,
          plan_name: p.plan_name,
          term_number: t.term_number,
          term_name: t.term_name,
          percentage: Number(t.percentage),
          due_date: t.due_date,
        })),
      );

      return {
        structure: {
          id: structure.fee_structure_id,
          fee_structure_id: structure.fee_structure_id,
          name: structure.name,
          description: structure.description,
          status: structure.status,
          academic_year_id: structure.academic_year_grades?.academic_year_id,
          grade_id: structure.academic_year_grades?.grade_id,
        },
        components: structure.fee_components.map((c) => ({
          id: c.fee_component_id,
          fee_component_id: c.fee_component_id,
          component_name: c.component_name,
          component_code: c.component_code,
          amount: Number(c.amount),
          is_mandatory: c.is_mandatory,
          display_order: c.display_order,
        })),
        installments,
      };
    } catch (error) {
      console.error('[FeeStructureRepository.getStructureAggregate] Error:', error);
      return null;
    }
  }
}

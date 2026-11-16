import prisma from '../../lib/prismaClient';

export interface DepartmentDto {
  id: string;
  department_id: string;
  school_id: string;
  org_id: string;
  name: string;
  department_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapDepartment(dept: any): DepartmentDto {
  return {
    id: dept.department_id,
    department_id: dept.department_id,
    school_id: dept.org_id,
    org_id: dept.org_id,
    name: dept.department_name,
    department_name: dept.department_name,
    description: dept.description ?? null,
    is_active: dept.is_active ?? true,
    created_at: dept.created_at instanceof Date ? dept.created_at.toISOString() : dept.created_at,
    updated_at: dept.updated_at instanceof Date ? dept.updated_at.toISOString() : dept.updated_at,
  };
}

// Service handling Department entities strictly aligned with schema.prisma
export class DepartmentService {
  static async getAll(schoolId: string): Promise<DepartmentDto[]> {
    const records = await prisma.departments.findMany({
      where: { org_id: schoolId },
      orderBy: { department_name: 'asc' },
    });
    return records.map(mapDepartment);
  }

  static async create(
    schoolId: string,
    name: string,
    description?: string | null,
  ): Promise<DepartmentDto> {
    const trimmedName = name.trim();

    // Check duplicate department_name within org
    const existing = await prisma.departments.findFirst({
      where: {
        org_id: schoolId,
        department_name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new Error(`Department '${trimmedName}' already exists.`);
    }

    const created = await prisma.departments.create({
      data: {
        org_id: schoolId,
        department_name: trimmedName,
        description: description ?? null,
        is_active: true,
      },
    });

    return mapDepartment(created);
  }

  static async update(
    id: string,
    schoolId: string,
    name: string,
    description?: string | null,
  ): Promise<DepartmentDto> {
    const trimmedName = name.trim();

    const existing = await prisma.departments.findFirst({
      where: {
        department_id: id,
        org_id: schoolId,
      },
    });

    if (!existing) {
      throw new Error('Department not found.');
    }

    // Check duplicate name within org excluding self
    const duplicate = await prisma.departments.findFirst({
      where: {
        org_id: schoolId,
        department_name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        NOT: {
          department_id: id,
        },
      },
    });

    if (duplicate) {
      throw new Error(`Department '${trimmedName}' already exists.`);
    }

    const updated = await prisma.departments.update({
      where: { department_id: id },
      data: {
        department_name: trimmedName,
        ...(description !== undefined ? { description } : {}),
      },
    });

    return mapDepartment(updated);
  }

  static async delete(id: string, schoolId: string): Promise<boolean> {
    const dept = await prisma.departments.findFirst({
      where: {
        department_id: id,
        org_id: schoolId,
      },
    });

    if (!dept) {
      throw new Error('Department not found.');
    }

    // Safety check: staff assigned to this department
    const staffCount = await prisma.staff.count({
      where: {
        department_id: id,
      },
    });

    if (staffCount > 0) {
      throw new Error(`Cannot delete department. It is assigned to ${staffCount} staff members.`);
    }

    await prisma.departments.delete({
      where: { department_id: id },
    });

    return true;
  }
}

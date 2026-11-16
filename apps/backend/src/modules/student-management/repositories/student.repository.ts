import { enrollment_status, gender_type } from '../constants/student.constants';
import prisma from '../../../lib/prismaClient';
import { CreateStudentDto } from '../dto/request/create-student.dto';
import { UpdateStudentDto } from '../dto/request/update-student.dto';

const db: any = prisma;

export class StudentRepository {
  static async findById(student_id: string) {
    return db.students.findUnique({
      where: { student_id },
      include: {
        student_enrollments: {
          include: { sections: true, academic_year_grades: true },
          orderBy: { enrollment_date: 'desc' },
        },
        student_parents: {
          include: {
            parents: {
              include: { users_parents_user_idTousers: true },
            },
          },
        },
        admissions_applications: true,
      },
    });
  }

  static async findByApplicationId(application_id: string) {
    return db.students.findUnique({
      where: { application_id },
      include: {
        student_enrollments: true,
        student_parents: true,
      },
    });
  }

  static async findByAdmissionNo(org_id: string, admission_no: string) {
    return db.students.findFirst({
      where: { org_id, admission_no },
    });
  }

  static async create(dto: CreateStudentDto) {
    const year = new Date().getFullYear();
    const count = await db.students.count({ where: { org_id: dto.org_id } });
    const admission_no = dto.admission_no || `ADM-${year}-${String(count + 1).padStart(5, '0')}`;

    return db.students.create({
      data: {
        org_id: dto.org_id,
        application_id: dto.application_id,
        user_id: dto.user_id || undefined,
        admission_no,
        first_name: dto.first_name,
        last_name: dto.last_name || undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        gender: dto.gender || undefined,
        admission_date: dto.admission_date ? new Date(dto.admission_date) : new Date(),
        status: dto.status || enrollment_status.active,
      },
      include: {
        student_enrollments: true,
        student_parents: true,
      },
    });
  }

  static async update(student_id: string, dto: UpdateStudentDto) {
    const data: any = { updated_at: new Date() };
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.dob !== undefined) data.dob = dto.dob ? new Date(dto.dob) : null;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.admission_date !== undefined)
      data.admission_date = dto.admission_date ? new Date(dto.admission_date) : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.user_id !== undefined) data.user_id = dto.user_id;

    return db.students.update({
      where: { student_id },
      data,
      include: {
        student_enrollments: true,
        student_parents: true,
      },
    });
  }

  static async updateStatus(student_id: string, status: enrollment_status) {
    return db.students.update({
      where: { student_id },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }

  static async delete(student_id: string) {
    return db.students.delete({
      where: { student_id },
    });
  }
}

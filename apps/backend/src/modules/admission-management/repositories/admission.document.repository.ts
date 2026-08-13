import { document_verify_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';

export class AdmissionDocumentRepository {
  static async create(applicationId: string, createdBy: string | null, dto: UploadDocumentDto) {
    return prisma.admission_documents.create({
      data: {
        application_id: applicationId,
        document_type_id: dto.document_type_id,
        storage_path: dto.file_path || (dto as any).storage_path || '',
        verify_status: document_verify_status.pending,
        created_by: createdBy || undefined,
      } as any,
      include: {
        document_types: true,
      },
    });
  }

  static async findById(document_id: string) {
    return prisma.admission_documents.findUnique({
      where: { document_id },
      include: { document_types: true, admissions_applications: true },
    });
  }

  static async findByApplicationId(application_id: string) {
    return prisma.admission_documents.findMany({
      where: { application_id },
      include: { document_types: true },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  static async verify(document_id: string, verifiedBy: string | null, dto: VerifyDocumentDto) {
    return prisma.admission_documents.update({
      where: { document_id },
      data: {
        verify_status: dto.verify_status,
        verification_remarks: dto.verification_remarks || undefined,
        verified_by: verifiedBy || undefined,
        verified_at: new Date(),
        updated_at: new Date(),
      },
      include: { document_types: true },
    });
  }

  static async countPendingDocuments(application_id: string) {
    return prisma.admission_documents.count({
      where: {
        application_id,
        verify_status: document_verify_status.pending,
      },
    });
  }
}

import { document_verify_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';

export class AdmissionDocumentRepository {
  static async create(
    applicationId: string,
    createdBy: string | null,
    dto: {
      document_type_id: string;
      storage_path: string;
      original_file_name?: string;
      mime_type?: string;
      file_size?: number | bigint;
    },
  ) {
    return prisma.admission_documents.upsert({
      where: {
        application_id_document_type_id: {
          application_id: applicationId,
          document_type_id: dto.document_type_id,
        },
      },
      create: {
        application_id: applicationId,
        document_type_id: dto.document_type_id,
        storage_path: dto.storage_path,
        original_file_name: dto.original_file_name || null,
        mime_type: dto.mime_type || null,
        file_size: dto.file_size ? BigInt(dto.file_size) : null,
        verify_status: document_verify_status.pending,
        created_by: createdBy || undefined,
      },
      update: {
        storage_path: dto.storage_path,
        original_file_name: dto.original_file_name || null,
        mime_type: dto.mime_type || null,
        file_size: dto.file_size ? BigInt(dto.file_size) : null,
        verify_status: document_verify_status.pending,
        uploaded_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        document_types: true,
      },
    });
  }

  static async delete(document_id: string) {
    return prisma.admission_documents.delete({
      where: { document_id },
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

import type { DocumentTypeDto, DocumentResponseDto } from '@/shared/api/admission.api';

export type CanonicalDocumentUIStatus =
  'NOT_UPLOADED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'ACTION_NEEDED';

export type CanonicalOverallDocumentStatus =
  'Action Needed' | 'Rejected' | 'In Review' | 'Accepted' | 'Not Started';

export interface CanonicalDocumentItem {
  docTypeId: string;
  docTypeName: string;
  isMandatory: boolean;
  description: string;
  status: CanonicalDocumentUIStatus;
  uploadedDocument?: DocumentResponseDto;
  fileName?: string;
  fileSize?: number | null;
  uploadedAt?: string;
  verificationRemarks?: string | null;
}

export interface ApplicationDocumentStatusResult {
  requiredCount: number;
  uploadedCount: number;
  notUploadedCount: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  resubmissionCount: number;
  overallStatus: CanonicalOverallDocumentStatus;
  documents: CanonicalDocumentItem[];
  unmatchedDocuments: DocumentResponseDto[];
}

/**
 * Standard required document definitions for admission verification.
 * Used ONLY as a UI fallback when the real backend database catalogue has not yet loaded or is empty.
 * Notice: Fake UUIDs are never used here to prevent collisions with database records.
 */
export const DEFAULT_DOCUMENT_REQUIREMENTS: DocumentTypeDto[] = [
  {
    document_type_id: '',
    org_id: '',
    document_name: 'Birth Certificate',
    description: 'Government-issued birth certificate copy',
    is_mandatory: true,
    is_active: true,
    display_order: 1,
  },
  {
    document_type_id: '',
    org_id: '',
    document_name: 'Aadhaar Card',
    description: 'Student Aadhaar Card copy',
    is_mandatory: true,
    is_active: true,
    display_order: 2,
  },
  {
    document_type_id: '',
    org_id: '',
    document_name: "Student's Photo",
    description: 'Recent color photograph (JPG/PNG)',
    is_mandatory: true,
    is_active: true,
    display_order: 3,
  },
  {
    document_type_id: '',
    org_id: '',
    document_name: 'Previous Academic Records',
    description: 'Latest report card or marksheet from previous school',
    is_mandatory: true,
    is_active: true,
    display_order: 4,
  },
  {
    document_type_id: '',
    org_id: '',
    document_name: 'Transfer Certificate',
    description: 'Previous school leaving certificate',
    is_mandatory: false,
    is_active: true,
    display_order: 5,
  },
  {
    document_type_id: '',
    org_id: '',
    document_name: 'Medical Certificate',
    description: 'Medical fitness certificate or address proof',
    is_mandatory: false,
    is_active: true,
    display_order: 6,
  },
];

/**
 * RULE 3: Normalizes document names by trimming, lowercasing, collapsing repeated whitespace,
 * and stripping punctuation/apostrophes for deterministic string matching.
 */
export function normalizeDocumentName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/['’]/g, '') // remove apostrophes: student's -> students
    .replace(/[^a-z0-9]+/g, ' ') // replace punctuation/symbols with single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * RULE 4: Safe explicit semantic alias resolver.
 * Maps known naming variations between PostgreSQL seeded names, wizard codes, and fallback labels.
 * NEVER uses broad substring matching (e.g. .includes("certificate")) to prevent category collisions.
 */
export function getDocumentTypeSemanticKey(rawNameOrCode?: string | null): string | null {
  if (!rawNameOrCode) return null;
  const normalized = normalizeDocumentName(rawNameOrCode);

  // 1. Birth Certificate aliases
  if (
    normalized === 'birth certificate' ||
    normalized === 'students birth certificate' ||
    normalized === 'student birth certificate' ||
    normalized === 'birth cert' ||
    normalized === 'birth certificate copy' ||
    normalized === 'birth_certificate'
  ) {
    return 'birth';
  }

  // 2. Aadhaar Card aliases
  if (
    normalized === 'aadhaar card' ||
    normalized === 'aadhar card' ||
    normalized === 'students aadhaar card' ||
    normalized === 'students aadhar card' ||
    normalized === 'students aadhaar id card' ||
    normalized === 'student aadhaar card' ||
    normalized === 'aadhaar' ||
    normalized === 'aadhar' ||
    normalized === 'aadhaar id card' ||
    normalized === 'aadhaar_card'
  ) {
    return 'aadhaar';
  }

  // 3. Student Photo aliases
  if (
    normalized === 'students photo' ||
    normalized === 'student photo' ||
    normalized === 'students photograph' ||
    normalized === 'student photograph' ||
    normalized === 'passport size photograph' ||
    normalized === 'passport size photo' ||
    normalized === 'passport photo' ||
    normalized === 'passport_photo' ||
    normalized === 'photo'
  ) {
    return 'photo';
  }

  // 4. Academic Records / Marksheet aliases
  if (
    normalized === 'previous academic records' ||
    normalized === 'previous academic record' ||
    normalized === 'previous marksheet' ||
    normalized === 'previous academic marksheet' ||
    normalized === 'previous academic marksheet report card' ||
    normalized === 'report card' ||
    normalized === 'academic records' ||
    normalized === 'academic_records' ||
    normalized === 'previous school report card' ||
    normalized === 'marksheet'
  ) {
    return 'academic';
  }

  // 5. Transfer Certificate aliases
  if (
    normalized === 'transfer certificate' ||
    normalized === 'transfer certificate tc' ||
    normalized === 'transfer certificate school leaving certificate' ||
    normalized === 'school leaving certificate' ||
    normalized === 'tc' ||
    normalized === 'transfer_certificate'
  ) {
    return 'transfer';
  }

  // 6. Medical Certificate / Address Proof aliases
  if (
    normalized === 'medical certificate' ||
    normalized === 'student medical certificate' ||
    normalized === 'medical certificate health certificate' ||
    normalized === 'medical fitness certificate' ||
    normalized === 'health certificate' ||
    normalized === 'medical_certificate' ||
    normalized === 'proof of address' ||
    normalized === 'address proof' ||
    normalized === 'address_proof'
  ) {
    return 'medical';
  }

  return null;
}

/**
 * RULE 2, 3, 4: Strict priority-based document matcher.
 * Priority:
 * 1. Match by document_type_id when both sides have non-empty IDs.
 * 2. Match by exact normalized string.
 * 3. Match by explicit semantic alias key.
 * 4. Return undefined (RULE 5: Unmatched documents are NEVER attached to random required types).
 */
export function findMatchingUploadedDocument(
  requiredType: DocumentTypeDto,
  uploadedDocuments: DocumentResponseDto[],
  alreadyMatchedDocIdentifiers?: Set<string>,
): { matchedDoc: DocumentResponseDto | undefined; strategy?: string } {
  const reqId = requiredType.document_type_id?.trim();
  const reqName = requiredType.document_name;

  for (const doc of uploadedDocuments) {
    const docIdentifier = doc.document_id || `${doc.document_type_id}_${doc.uploaded_at}`;
    if (alreadyMatchedDocIdentifiers && alreadyMatchedDocIdentifiers.has(docIdentifier)) {
      continue;
    }

    const docTypeId = doc.document_type_id?.trim();
    const docName =
      doc.document_type_name ||
      doc.document_types?.document_name ||
      (doc as any).document_name ||
      (doc as any).document_code;

    // STRATEGY 1: Exact document_type_id (Highest Priority)
    if (reqId && docTypeId && reqId === docTypeId) {
      return { matchedDoc: doc, strategy: 'document_type_id' };
    }

    // STRATEGY 2: Exact normalized name match
    if (reqName && docName) {
      const normReq = normalizeDocumentName(reqName);
      const normDoc = normalizeDocumentName(docName);
      if (normReq && normDoc && normReq === normDoc) {
        return { matchedDoc: doc, strategy: 'normalized_exact_name' };
      }

      // STRATEGY 3: Explicit semantic alias match
      const reqSemanticKey = getDocumentTypeSemanticKey(reqName);
      const docSemanticKey = getDocumentTypeSemanticKey(docName);
      if (reqSemanticKey && docSemanticKey && reqSemanticKey === docSemanticKey) {
        return { matchedDoc: doc, strategy: 'semantic_alias' };
      }
    }
  }

  return { matchedDoc: undefined };
}

/**
 * RULE 9: Canonical Verification Status Mapper.
 */
export function mapVerifyStatusToCanonical(status?: string | null): CanonicalDocumentUIStatus {
  if (!status) return 'NOT_UPLOADED';
  const s = status.toLowerCase().trim();
  if (s === 'verified' || s === 'approved' || s === 'accepted') return 'VERIFIED';
  if (s === 'rejected') return 'REJECTED';
  if (
    s === 'resubmission_requested' ||
    s === 'correction_required' ||
    s === 'action_needed' ||
    s === 'action needed'
  ) {
    return 'ACTION_NEEDED';
  }
  if (s === 'pending' || s === 'under_review' || s === 'in_review' || s === 'in review') {
    return 'IN_REVIEW';
  }
  return 'IN_REVIEW';
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * RULE 1 & RULE 6: Resolves the authoritative list of required document types.
 * Prefers real API document types from the application's organization.
 * Falls back to DEFAULT_DOCUMENT_REQUIREMENTS only if catalogue is empty/unavailable.
 */
export function resolveEffectiveDocumentTypes(
  documentTypes?: DocumentTypeDto[] | null,
  applicationDocuments?: DocumentResponseDto[] | null,
): DocumentTypeDto[] {
  // If real active catalogue items exist from the API, they are authoritative
  if (documentTypes && documentTypes.length > 0) {
    const active = documentTypes.filter((dt) => dt.is_active !== false);
    if (active.length > 0) return active;
  }

  // If application has uploaded documents with embedded document_types metadata, use them
  if (applicationDocuments && applicationDocuments.length > 0) {
    const extractedFromDocs: DocumentTypeDto[] = [];
    const seenIds = new Set<string>();

    for (const doc of applicationDocuments) {
      if (doc.document_types && doc.document_types.document_name) {
        const dtId = doc.document_types.document_type_id || doc.document_type_id;
        if (dtId && !seenIds.has(dtId)) {
          seenIds.add(dtId);
          extractedFromDocs.push({
            document_type_id: dtId,
            org_id: doc.document_types.org_id || '',
            document_name: doc.document_types.document_name,
            description:
              doc.document_types.description || 'Required certificate for admission verification',
            is_mandatory: doc.document_types.is_mandatory ?? true,
            is_active: true,
            display_order: doc.document_types.display_order ?? extractedFromDocs.length + 1,
          });
        }
      }
    }

    if (extractedFromDocs.length >= DEFAULT_DOCUMENT_REQUIREMENTS.length) {
      return extractedFromDocs;
    }
  }

  return DEFAULT_DOCUMENT_REQUIREMENTS;
}

/**
 * RULE 7 & RULE 8: Authoritative Canonical Document Model calculation function.
 * Used identically across Application Cards, Document Detail views, and Status Summaries.
 */
export function getApplicationDocumentStatus(params: {
  documentTypes?: DocumentTypeDto[] | null;
  applicationDocuments?: DocumentResponseDto[] | null;
  applicationId?: string;
  isDevelopment?: boolean;
}): ApplicationDocumentStatusResult {
  const { documentTypes, applicationDocuments, applicationId, isDevelopment = false } = params;

  const effectiveTypes = resolveEffectiveDocumentTypes(documentTypes, applicationDocuments);
  const uploadedList = applicationDocuments || [];

  const matchedUploadedDocIds = new Set<string>();
  const unmatchedDocuments: DocumentResponseDto[] = [];

  let verifiedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let resubmissionCount = 0;
  let uploadedCount = 0;

  const documents: CanonicalDocumentItem[] = effectiveTypes.map((typeDef) => {
    const typeId = typeDef.document_type_id;
    const typeName = typeDef.document_name;

    const { matchedDoc, strategy } = findMatchingUploadedDocument(
      typeDef,
      uploadedList,
      matchedUploadedDocIds,
    );

    if (isDevelopment && matchedDoc) {
      console.debug('[DocumentStatus Match Diagnostic]', {
        applicationId,
        uploadedDocumentTypeId: matchedDoc.document_type_id,
        uploadedDocumentTypeName:
          matchedDoc.document_type_name || matchedDoc.document_types?.document_name,
        matchedTypeId: typeId,
        matchedTypeName: typeName,
        strategy,
      });
    }

    let status: CanonicalDocumentUIStatus = 'NOT_UPLOADED';

    if (matchedDoc) {
      const docIdentifier =
        matchedDoc.document_id || `${matchedDoc.document_type_id}_${matchedDoc.uploaded_at}`;
      matchedUploadedDocIds.add(docIdentifier);

      uploadedCount++;
      status = mapVerifyStatusToCanonical(matchedDoc.verify_status);
      if (status === 'VERIFIED') verifiedCount++;
      else if (status === 'IN_REVIEW') pendingCount++;
      else if (status === 'REJECTED') rejectedCount++;
      else if (status === 'ACTION_NEEDED') resubmissionCount++;
    }

    return {
      docTypeId: typeId || typeName,
      docTypeName: typeName,
      isMandatory: typeDef.is_mandatory ?? true,
      description: typeDef.description || 'Required certificate for admission verification',
      status,
      uploadedDocument: matchedDoc,
      fileName: matchedDoc?.original_file_name || undefined,
      fileSize: matchedDoc?.file_size,
      uploadedAt: matchedDoc?.uploaded_at,
      verificationRemarks: matchedDoc?.verification_remarks,
    };
  });

  // Collect unmatched/extra documents without corrupting required count
  for (const doc of uploadedList) {
    const docIdentifier = doc.document_id || `${doc.document_type_id}_${doc.uploaded_at}`;
    if (!matchedUploadedDocIds.has(docIdentifier)) {
      unmatchedDocuments.push(doc);
    }
  }

  const requiredCount = effectiveTypes.length;
  const notUploadedCount = Math.max(0, requiredCount - uploadedCount);

  // Invariant verification:
  // uploadedCount === verifiedCount + pendingCount + rejectedCount + resubmissionCount
  // requiredCount === uploadedCount + notUploadedCount

  // Determine overall status with deterministic priority:
  // ACTION_NEEDED > REJECTED > IN_REVIEW > ACCEPTED > NOT_STARTED
  let overallStatus: CanonicalOverallDocumentStatus = 'Not Started';
  if (resubmissionCount > 0) {
    overallStatus = 'Action Needed';
  } else if (rejectedCount > 0) {
    overallStatus = 'Rejected';
  } else if (pendingCount > 0) {
    overallStatus = 'In Review';
  } else if (uploadedCount > 0 && verifiedCount === requiredCount) {
    overallStatus = 'Accepted';
  } else if (uploadedCount > 0) {
    overallStatus = 'In Review';
  } else {
    overallStatus = 'Not Started';
  }

  return {
    requiredCount,
    uploadedCount,
    notUploadedCount,
    verifiedCount,
    pendingCount,
    rejectedCount,
    resubmissionCount,
    overallStatus,
    documents,
    unmatchedDocuments,
  };
}

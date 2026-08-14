"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryRepository = void 0;
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
const AdmissionEnquiry_1 = require("../../domain/AdmissionEnquiry");
class EnquiryRepository {
    async resolveAcademicYearGradeId(orgId, academicYearId, gradeAppliedFor) {
        // 1. Direct UUID match in academic_year_grades — verify it belongs to orgId
        if (gradeAppliedFor &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gradeAppliedFor)) {
            const existing = await prismaClient_1.default.academic_year_grades.findFirst({
                where: {
                    academic_year_grade_id: gradeAppliedFor,
                    ...(orgId ? { academic_years: { org_id: orgId } } : {}),
                },
            });
            if (existing)
                return existing.academic_year_grade_id;
        }
        // 2. Match grade_applied_for by name or code in grades table under orgId
        if (gradeAppliedFor && orgId) {
            const matchedGrade = await prismaClient_1.default.grades.findFirst({
                where: {
                    org_id: orgId,
                    OR: [
                        { grade_name: { equals: gradeAppliedFor, mode: 'insensitive' } },
                        { grade_code: { equals: gradeAppliedFor, mode: 'insensitive' } },
                    ],
                },
            });
            if (matchedGrade) {
                const ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                    where: {
                        grade_id: matchedGrade.grade_id,
                        ...(academicYearId
                            ? { academic_year_id: academicYearId }
                            : { academic_years: { org_id: orgId } }),
                    },
                });
                if (ayg)
                    return ayg.academic_year_grade_id;
            }
        }
        // 3. Fallback within the specific academicYearId
        if (academicYearId) {
            const ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: { academic_year_id: academicYearId },
            });
            if (ayg)
                return ayg.academic_year_grade_id;
        }
        // 4. Fallback within the specific orgId
        if (orgId) {
            const ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: {
                    academic_years: { org_id: orgId },
                },
            });
            if (ayg)
                return ayg.academic_year_grade_id;
        }
        throw new Error(`No active academic year grade configuration found for organization ${orgId}`);
    }
    toDomainFromLead(row) {
        const studentName = row.student_last_name
            ? `${row.student_first_name} ${row.student_last_name}`
            : row.student_first_name;
        const gradeAppliedFor = row.academic_year_grades?.grades?.grade_name ||
            row.academic_year_grades?.grades?.grade_code ||
            'Grade 1';
        const mappedQueryType = row.lead_query_type_mappings?.[0]?.lead_query_types?.query_type_name || null;
        const domain = new AdmissionEnquiry_1.AdmissionEnquiry(row.lead_id, row.org_id, row.academic_year_grades?.academic_year_id || '', studentName, gradeAppliedFor, row.contact_name, row.contact_email || '', row.contact_phone, 'Website', row.stage === 'enquiry_received' ? 'new' : row.stage === 'qualified' ? 'converted' : 'new', new Date(row.created_at), new Date(row.updated_at), mappedQueryType, row.dob ? new Date(row.dob) : null, row.gender || null, mappedQueryType, null, row.remarks || null);
        domain.lead_number = row.lead_number;
        domain.contact_consent = row.contact_consent;
        domain.contact_consent_at = row.contact_consent_at;
        domain.query_type = mappedQueryType;
        return domain;
    }
    async findById(id) {
        const lead = await prismaClient_1.default.leads.findUnique({
            where: { lead_id: id },
            include: {
                academic_year_grades: {
                    include: { grades: true },
                },
                lead_query_type_mappings: {
                    include: { lead_query_types: true },
                },
            },
        });
        return lead ? this.toDomainFromLead(lead) : null;
    }
    async findByPhone(phone) {
        const lead = await prismaClient_1.default.leads.findFirst({
            where: { contact_phone: phone },
            include: {
                academic_year_grades: {
                    include: { grades: true },
                },
                lead_query_type_mappings: {
                    include: { lead_query_types: true },
                },
            },
        });
        return lead ? this.toDomainFromLead(lead) : null;
    }
    async save(enquiry, extra) {
        const aygId = await this.resolveAcademicYearGradeId(enquiry.schoolId, enquiry.academicYearId, enquiry.gradeAppliedFor);
        // Split student name
        const parts = enquiry.studentName.trim().split(/\s+/);
        const firstName = parts[0] || `${enquiry.parentName}'s Ward`;
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
        const isConsent = extra?.contact_consent ?? false;
        const shortId = enquiry.id.slice(0, 8).toUpperCase();
        const leadNumber = `ENQ-2026-${shortId}`;
        // Resolve or populate lead_query_type for requested queryType
        let queryTypeId = null;
        const rawQueryType = enquiry.queryType || extra?.query_type || extra?.queryType;
        if (rawQueryType && typeof rawQueryType === 'string' && rawQueryType.trim() !== '') {
            const qName = rawQueryType.trim();
            let qt = await prismaClient_1.default.lead_query_types.findFirst({
                where: {
                    org_id: enquiry.schoolId,
                    query_type_name: { equals: qName, mode: 'insensitive' },
                    is_active: true,
                },
            });
            if (!qt) {
                const maxOrder = await prismaClient_1.default.lead_query_types.aggregate({
                    where: { org_id: enquiry.schoolId },
                    _max: { display_order: true },
                });
                const nextOrder = (maxOrder?._max?.display_order || 0) + 1;
                qt = await prismaClient_1.default.lead_query_types.create({
                    data: {
                        org_id: enquiry.schoolId,
                        query_type_name: qName,
                        display_order: nextOrder,
                        is_active: true,
                    },
                });
            }
            queryTypeId = qt.query_type_id;
        }
        // Check if existing lead
        const existing = await prismaClient_1.default.leads.findUnique({ where: { lead_id: enquiry.id } });
        let saved;
        if (existing) {
            saved = await prismaClient_1.default.leads.update({
                where: { lead_id: enquiry.id },
                data: {
                    student_first_name: firstName,
                    student_last_name: lastName,
                    contact_name: enquiry.parentName,
                    contact_email: enquiry.parentEmail || null,
                    contact_phone: enquiry.parentPhone,
                    remarks: enquiry.remarks || null,
                    contact_consent: isConsent,
                    contact_consent_at: isConsent ? new Date() : null,
                    updated_at: new Date(),
                },
                include: {
                    academic_year_grades: {
                        include: { grades: true },
                    },
                    lead_query_type_mappings: {
                        include: { lead_query_types: true },
                    },
                },
            });
        }
        else {
            saved = await prismaClient_1.default.leads.create({
                data: {
                    lead_id: enquiry.id,
                    org_id: enquiry.schoolId,
                    lead_number: leadNumber,
                    academic_year_grade_id: aygId,
                    student_first_name: firstName,
                    student_last_name: lastName,
                    contact_name: enquiry.parentName,
                    contact_email: enquiry.parentEmail || null,
                    contact_phone: enquiry.parentPhone,
                    source: 'website',
                    stage: 'enquiry_received',
                    priority: 'warm',
                    remarks: enquiry.remarks || null,
                    contact_consent: isConsent,
                    contact_consent_at: isConsent ? new Date() : null,
                },
                include: {
                    academic_year_grades: {
                        include: { grades: true },
                    },
                    lead_query_type_mappings: {
                        include: { lead_query_types: true },
                    },
                },
            });
        }
        if (queryTypeId && saved?.lead_id) {
            try {
                await prismaClient_1.default.lead_query_type_mappings.upsert({
                    where: {
                        lead_id_query_type_id: {
                            lead_id: saved.lead_id,
                            query_type_id: queryTypeId,
                        },
                    },
                    create: {
                        lead_id: saved.lead_id,
                        query_type_id: queryTypeId,
                    },
                    update: {},
                });
            }
            catch (err) {
                // Fallback for primary key format differences
                try {
                    await prismaClient_1.default.lead_query_type_mappings.create({
                        data: {
                            lead_id: saved.lead_id,
                            query_type_id: queryTypeId,
                        },
                    });
                }
                catch (e) {
                    // Ignore duplicate mapping error
                }
            }
        }
        return this.toDomainFromLead(saved);
    }
    async findAll(schoolId, page = 1, limit = 10, filters, search, sortColumn, sortOrder) {
        const where = {
            org_id: schoolId,
        };
        if (search && search.trim() !== '') {
            const s = search.trim();
            where.OR = [
                { student_first_name: { contains: s, mode: 'insensitive' } },
                { student_last_name: { contains: s, mode: 'insensitive' } },
                { contact_name: { contains: s, mode: 'insensitive' } },
                { contact_phone: { contains: s, mode: 'insensitive' } },
                { contact_email: { contains: s, mode: 'insensitive' } },
                { lead_number: { contains: s, mode: 'insensitive' } },
            ];
        }
        const [leads, count] = await Promise.all([
            prismaClient_1.default.leads.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    academic_year_grades: {
                        include: { grades: true },
                    },
                    lead_query_type_mappings: {
                        include: { lead_query_types: true },
                    },
                },
            }),
            prismaClient_1.default.leads.count({ where }),
        ]);
        return {
            data: leads.map((l) => this.toDomainFromLead(l)),
            total: count,
        };
    }
    async softDelete(id) {
        await prismaClient_1.default.leads.update({
            where: { lead_id: id },
            data: { updated_at: new Date() },
        });
    }
    async findPossibleDuplicates(studentName, parentPhone, parentEmail, dateOfBirth, gradeAppliedFor, academicYearId) {
        const leads = await prismaClient_1.default.leads.findMany({
            where: {
                OR: [
                    { contact_phone: parentPhone },
                    ...(parentEmail ? [{ contact_email: parentEmail }] : []),
                ],
            },
            include: {
                academic_year_grades: {
                    include: { grades: true },
                },
            },
        });
        return leads.map((l) => this.toDomainFromLead(l));
    }
}
exports.EnquiryRepository = EnquiryRepository;

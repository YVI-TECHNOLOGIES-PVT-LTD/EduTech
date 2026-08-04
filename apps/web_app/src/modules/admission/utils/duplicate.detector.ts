import type { AdmissionInquiry, DuplicateMatch } from '../types/admission.types';

function normalizePhone(phone?: string): string {
    return (phone ?? '').replace(/\D/g, '').slice(-10);
}

function normalizeEmail(email?: string): string {
    return (email ?? '').trim().toLowerCase();
}

function normalizeName(name?: string): string {
    return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface DuplicateCheckInput {
    phone?: string;
    email?: string;
    parent_name?: string;
    student_name?: string;
}

export function findDuplicates(
    input: DuplicateCheckInput,
    records: AdmissionInquiry[],
    excludeId?: string,
): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    const inputPhone = normalizePhone(input.phone);
    const inputEmail = normalizeEmail(input.email);
    const inputParent = normalizeName(input.parent_name);
    const inputStudent = normalizeName(input.student_name);

    for (const record of records) {
        if (excludeId && record.id === excludeId) continue;

        const matchFields: string[] = [];
        let score = 0;

        const recordPhone = normalizePhone(record.phone ?? record.parent_phone);
        if (inputPhone.length >= 10 && recordPhone === inputPhone) {
            matchFields.push('phone');
            score += 40;
        }

        const recordEmail = normalizeEmail(record.email ?? record.parent_email);
        if (inputEmail && recordEmail && recordEmail === inputEmail) {
            matchFields.push('email');
            score += 35;
        }

        const recordParent = normalizeName(record.parent_name);
        if (inputParent.length >= 2 && recordParent === inputParent) {
            matchFields.push('parent_name');
            score += 15;
        }

        const recordStudent = normalizeName(record.student_name);
        if (inputStudent.length >= 2 && recordStudent === inputStudent) {
            matchFields.push('student_name');
            score += 10;
        }

        if (matchFields.length >= 1 && score >= 25) {
            matches.push({
                id: record.id,
                student_name: record.student_name,
                parent_name: record.parent_name,
                phone: record.phone ?? record.parent_phone,
                email: record.email ?? record.parent_email,
                matchFields,
                score,
            });
        }
    }

    return matches.sort((a, b) => b.score - a.score);
}

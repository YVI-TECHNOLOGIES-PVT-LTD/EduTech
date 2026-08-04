import { apiClient } from '../../../lib/api-client';

export class StudentApi {
    list(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        grade?: string;
        section?: string;
        academic_year?: string;
    }) {
        return apiClient.get('/students', { params });
    }

    getById(id: string) {
        return apiClient.get(`/students/${id}`);
    }

    register(data: {
        admission_no: string;
        first_name: string;
        last_name: string;
        school_id: string;
        academic_year_id: string;
        user_id?: string;
    }) {
        return apiClient.post('/students', data);
    }

    updateProfile(id: string, data: any) {
        return apiClient.patch(`/students/${id}/profile`, data);
    }

    updateParents(id: string, data: any) {
        return apiClient.patch(`/students/${id}/parents`, data);
    }

    allocateClass(id: string, data: {
        academic_year_id: string;
        grade: string;
        section_id: string;
        roll_number?: string;
    }) {
        return apiClient.post(`/students/${id}/allocate`, data);
    }

    promote(id: string, data: {
        to_academic_year_id: string;
        to_grade: string;
        to_section_id?: string;
        promotion_reason: string;
    }) {
        return apiClient.post(`/students/${id}/promote`, data);
    }

    bulkPromote(data: {
        student_ids: string[];
        to_academic_year_id: string;
        to_grade: string;
        to_section_id?: string;
        promotion_reason: string;
    }) {
        return apiClient.post('/admin/students/promote', data);
    }

    requestTransfer(id: string, data: {
        destination_school: string;
        reason: string;
    }) {
        return apiClient.post(`/students/${id}/transfer`, data);
    }

    approveTransfer(requestId: string) {
        return apiClient.post(`/students/transfer/approve/${requestId}`);
    }

    generateIdCard(id: string) {
        return apiClient.post(`/students/${id}/id-card`);
    }

    bulkGenerateIDCards(data: { student_ids: string[] }) {
        return apiClient.post('/admin/bulk/id-cards', data);
    }

    getBarcode(id: string) {
        return apiClient.post(`/students/${id}/barcode`);
    }

    getTimeline(id: string) {
        return apiClient.get(`/students/${id}/timeline`);
    }

    getHistory(id: string) {
        return apiClient.get(`/students/${id}/history`);
    }

    exportStudents(params: any) {
        return apiClient.get('/students/export', { params, responseType: 'blob' });
    }
}

export const studentApi = new StudentApi();

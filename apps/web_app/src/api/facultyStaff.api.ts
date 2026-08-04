import { apiClient } from '../lib/api-client';

export const FacultyApi = {
    // ADMIN: Management
    getAllProfiles: async (params?: any) => {
        const response = await apiClient.get('/academic/faculty-profiles', { params });
        return response.data;
    },

    createProfile: async (data: any) => {
        const response = await apiClient.post('/academic/faculty-profiles', data);
        return response.data;
    },

    updateProfile: async (id: string, data: any) => {
        const response = await apiClient.put(`/academic/faculty-profiles/${id}`, data);
        return response.data;
    },

    updateStatus: async (id: string, status: string) => {
        const response = await apiClient.patch(`/academic/faculty-profiles/${id}/status`, { status });
        return response.data;
    },

    // ADMIN: Assignment
    assignSubject: async (sectionId: string, subjectId: string, facultyProfileId: string) => {
        const response = await apiClient.post(`/academic/sections/${sectionId}/subjects/${subjectId}/assign-faculty`, {
            faculty_profile_id: facultyProfileId
        });
        return response.data;
    },

    getSectionAssignments: async (sectionId: string) => {
        const response = await apiClient.get(`/academic/sections/${sectionId}/subject-faculty`);
        return response.data;
    },

    // FACULTY: Self Service
    getMySubjects: async () => {
        const response = await apiClient.get('/academic/faculty/my-subjects');
        return response.data;
    },

    updateMyAssignment: async (assignmentId: string, updates: any) => {
        const response = await apiClient.put(`/academic/faculty/my-subjects/${assignmentId}`, updates);
        return response.data;
    }
};


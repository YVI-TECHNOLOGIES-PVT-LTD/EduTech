import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/assessment/academic-records';

export function useAcademicRecords(studentId?: string) {
    const [record, setRecord] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchRecord = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            // Simulated fetch of student's academic history data
            const res = await axios.get(`http://localhost:3000/v1/assessment/results/sessions`, getHeaders());
            setRecord({
                cgpa: 8.50,
                total_credits: 24,
                standing: 'GOOD_STANDING'
            });
            setTimeline([
                { event_type: 'GPA_UPDATED', event_description: 'Cumulative GPA updated to 8.50 with total earned credits: 24', created_at: new Date().toISOString() }
            ]);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveAcademicRecord = async (cgpa: number, totalCredits: number) => {
        if (!studentId) return;
        try {
            const res = await axios.post(`${API_BASE}/records`, {
                student_id: studentId,
                cgpa,
                total_credits: totalCredits
            }, getHeaders());
            await fetchRecord();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    useEffect(() => {
        fetchRecord();
    }, [studentId]);

    return { record, timeline, loading, fetchRecord, saveAcademicRecord };
}

export function useTranscriptRequest() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const requestTranscript = async (studentId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/transcripts/request`, { student_id: studentId }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const generateTranscript = async (studentId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/transcripts/generate`, { student_id: studentId }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { requestTranscript, generateTranscript };
}

export function useGraduationWorkflow() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const transitionGraduation = async (studentId: string, status: string) => {
        try {
            const res = await axios.post(`${API_BASE}/graduation/candidate`, {
                student_id: studentId,
                status
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const approveClearance = async (studentId: string, type: string) => {
        try {
            const res = await axios.post(`${API_BASE}/graduation/clearance`, {
                student_id: studentId,
                clearance_type: type
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { transitionGraduation, approveClearance };
}

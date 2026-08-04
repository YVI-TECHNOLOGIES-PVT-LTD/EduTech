import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/attendance';

export interface AttendanceSession {
    id: string;
    campus_id: string;
    branch_id: string;
    academic_year_id: string;
    session_date: string;
    timetable_slot_id: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED';
    created_at: string;
}

export function useAttendance() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/sessions`, getHeaders());
            setSessions(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const createSession = async (campusId: string, branchId: string, yearId: string, date: string, slotId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/sessions`, {
                campus_id: campusId,
                branch_id: branchId,
                academic_year_id: yearId,
                session_date: date,
                timetable_slot_id: slotId
            }, getHeaders());
            await fetchSessions();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const markStudent = async (sessionId: string, studentId: string, status: string, source: string) => {
        try {
            const res = await axios.post(`${API_BASE}/mark`, {
                session_id: sessionId,
                student_id: studentId,
                status,
                source
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const transitionWorkflow = async (sessionId: string, decision: string, comments?: string) => {
        try {
            const res = await axios.post(`${API_BASE}/workflow`, {
                session_id: sessionId,
                decision,
                comments
            }, getHeaders());
            await fetchSessions();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return {
        sessions,
        loading,
        error,
        fetchSessions,
        createSession,
        markStudent,
        transitionWorkflow
    };
}

export function useLeave() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const submitLeave = async (studentId: string, start: string, end: string, type: string, reason: string) => {
        try {
            const res = await axios.post(`${API_BASE}/leave`, {
                student_id: studentId,
                start_date: start,
                end_date: end,
                leave_type: type,
                reason
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { submitLeave };
}

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/assessment/results';

export interface ResultSession {
    id: string;
    academic_year_id: string;
    term_id: string;
    status: 'DRAFT' | 'CALCULATED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'PUBLISHED' | 'LOCKED';
    created_at: string;
}

export function useResults() {
    const [sessions, setSessions] = useState<ResultSession[]>([]);
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

    const createSession = async (academicYearId: string, termId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/sessions`, {
                academic_year_id: academicYearId,
                term_id: termId
            }, getHeaders());
            await fetchSessions();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const calculateResults = async (sessionId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/calculate`, { session_id: sessionId }, getHeaders());
            await fetchSessions();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const transitionWorkflow = async (sessionId: string, status: string, comments?: string) => {
        try {
            const res = await axios.post(`${API_BASE}/session/${sessionId}/workflow/transition`, {
                target_status: status,
                comments
            }, getHeaders());
            await fetchSessions();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const publishResults = async (sessionId: string, targetPortal: string) => {
        try {
            const res = await axios.post(`${API_BASE}/session/${sessionId}/publish`, {
                target_portal: targetPortal
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
        calculateResults,
        transitionWorkflow,
        publishResults
    };
}

export function useStudentResults(sessionId?: string) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchStudentResults = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            // Fetch students calculations list
            const res = await axios.get(`http://localhost:3000/v1/assessment/evaluations/sessions`, getHeaders());
            setResults(res.data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentResults();
    }, [sessionId]);

    return { results, loading, fetchStudentResults };
}

export function useRankings() {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const calculateRankings = async (sessionId: string) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/rankings/calculate`, { sessionId }, getHeaders());
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return { rankings, loading, calculateRankings };
}

export function usePromotion() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const processPromotion = async (studentId: string, academicYearId: string, gpa: number, backlogsCount: number) => {
        try {
            const res = await axios.post(`${API_BASE}/promotions/process`, {
                student_id: studentId,
                academic_year_id: academicYearId,
                gpa,
                backlogs_count: backlogsCount
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { processPromotion };
}

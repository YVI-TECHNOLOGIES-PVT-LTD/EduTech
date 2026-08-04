import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/assessment/evaluations';

export interface EvaluationSession {
    id: string;
    published_paper_id: string;
    attempt_id: string;
    evaluator_id: string;
    status: 'DRAFT' | 'AUTO_GRADED' | 'UNDER_EVALUATION' | 'UNDER_MODERATION' | 'RE_EVALUATION' | 'FINALIZED' | 'PUBLISHED' | 'LOCKED';
    anonymous_mode: boolean;
    moderation_required: boolean;
    assigned_at: string;
    completed_at: string | null;
    questionEvaluations?: any[];
}

export function useEvaluation() {
    const [sessions, setSessions] = useState<EvaluationSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchSessions = async (status?: string) => {
        setLoading(true);
        try {
            const url = status ? `${API_BASE}/sessions?status=${status}` : `${API_BASE}/sessions`;
            const res = await axios.get(url, getHeaders());
            setSessions(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const startSession = async (publishedPaperId: string, attemptId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/start`, {
                published_paper_id: publishedPaperId,
                attempt_id: attemptId
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const evaluateQuestion = async (sessionId: string, questionSnapshotId: string, awardedMarks: number, maxMarks: number, remarks?: string, annotations?: any[]) => {
        try {
            const res = await axios.post(`${API_BASE}/session/${sessionId}/evaluate`, {
                question_snapshot_id: questionSnapshotId,
                awarded_marks: awardedMarks,
                maximum_marks: maxMarks,
                remarks,
                annotations
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const transitionWorkflow = async (sessionId: string, targetStatus: string) => {
        try {
            const res = await axios.post(`${API_BASE}/session/${sessionId}/workflow/transition`, {
                target_status: targetStatus
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return {
        sessions,
        loading,
        error,
        fetchSessions,
        startSession,
        evaluateQuestion,
        transitionWorkflow
    };
}

export function useRubrics() {
    const [rubrics, setRubrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchRubrics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/rubrics`, getHeaders());
            setRubrics(res.data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createRubric = async (payload: any) => {
        try {
            const res = await axios.post(`${API_BASE}/rubrics`, payload, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { rubrics, loading, fetchRubrics, createRubric };
}

export function useModeration() {
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/moderation`, getHeaders());
            setQueue(res.data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resolveModeration = async (queueId: string, marks: number, status: 'RESOLVED' | 'REJECTED', remarks?: string) => {
        try {
            const res = await axios.post(`${API_BASE}/moderation/${queueId}/resolve`, {
                moderator_marks: marks,
                status,
                remarks
            }, getHeaders());
            await fetchQueue();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { queue, loading, fetchQueue, resolveModeration };
}

export function useRevaluation() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/revaluation`, getHeaders());
            setRequests(res.data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const applyRevaluation = async (attemptId: string, studentId: string, reason: string) => {
        try {
            const res = await axios.post(`${API_BASE}/revaluation`, {
                attempt_id: attemptId,
                student_id: studentId,
                reason
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const approveRevaluation = async (requestId: string, remarks: string) => {
        try {
            const res = await axios.post(`${API_BASE}/revaluation/${requestId}/approve`, { remarks }, getHeaders());
            await fetchRequests();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { requests, loading, fetchRequests, applyRevaluation, approveRevaluation };
}

export function useEvaluationAnalytics() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/analytics`, getHeaders());
            setMetrics(res.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return { metrics, loading, fetchMetrics };
}

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/assessment/papers';

export interface Paper {
    id: string;
    name: string;
    description: string | null;
    total_marks: number;
    status: 'DRAFT' | 'GENERATED' | 'VALIDATED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELLED';
    version: number;
    created_at: string;
    statistics?: {
        generation_duration_ms: number;
        blueprint_compliance_pct: number;
        question_reuse_pct: number;
        difficulty_compliance_pct: number;
        bloom_compliance_pct: number;
        outcome_compliance_pct: number;
    } | null;
}

export interface Job {
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    logs: string[];
    error_message: string | null;
    created_at: string;
}

export function usePaperGenerator() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/`, getHeaders());
            setPapers(res.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_BASE}/jobs`, getHeaders());
            setJobs(res.data || []);
        } catch (err: any) {
            console.error('Failed to load jobs list', err);
        }
    };

    const createPaperJob = async (payload: {
        blueprint_id: string;
        template_id: string;
        subject_id: string;
        name: string;
        description?: string;
    }) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/jobs`, payload, getHeaders());
            await fetchJobs();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const runValidation = async (paperId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/${paperId}/validate`, {}, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const transitionStatus = async (paperId: string, status: string, reason?: string) => {
        try {
            const res = await axios.post(`${API_BASE}/${paperId}/workflow/transition`, {
                target_status: status,
                transition_reason: reason
            }, getHeaders());
            await fetchPapers();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const triggerExport = async (paperId: string, format: 'PDF' | 'DOCX' | 'HTML' | 'ZIP', type: 'candidate' | 'moderator' | 'answer_key') => {
        try {
            const res = await axios.post(`${API_BASE}/${paperId}/export`, { format, type }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    const deletePaper = async (paperId: string) => {
        try {
            await axios.delete(`${API_BASE}/${paperId}`, getHeaders());
            await fetchPapers();
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    useEffect(() => {
        fetchPapers();
        fetchJobs();
        const interval = setInterval(() => {
            fetchJobs();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return {
        papers,
        jobs,
        loading,
        error,
        fetchPapers,
        fetchJobs,
        createPaperJob,
        runValidation,
        transitionStatus,
        triggerExport,
        deletePaper
    };
}

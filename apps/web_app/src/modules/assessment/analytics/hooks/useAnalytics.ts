import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/v1/assessment/analytics';

export interface AnalyticsSnapshot {
    id: string;
    snapshot_date: string;
    snapshot_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'ACADEMIC_YEAR';
    payload: any;
}

export function useAnalytics() {
    const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchSnapshots = async (type?: string) => {
        setLoading(true);
        try {
            const url = type ? `${API_BASE}/snapshots?type=${type}` : `${API_BASE}/snapshots`;
            const res = await axios.get(url, getHeaders());
            setSnapshots(res.data || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async (type: string, academicYearId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/snapshots`, {
                snapshot_type: type,
                academic_year_id: academicYearId
            }, getHeaders());
            await fetchSnapshots();
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    useEffect(() => {
        fetchSnapshots();
    }, []);

    return {
        snapshots,
        loading,
        error,
        fetchSnapshots,
        createSnapshot
    };
}

export function useQuestionAnalytics() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const calculateQuestionStats = async (questionSnapshotId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/question/stats`, {
                question_snapshot_id: questionSnapshotId
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { calculateQuestionStats };
}

export function useCOAttainment() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const calculateCOAttainment = async (subjectId: string, coCode: string) => {
        try {
            const res = await axios.post(`${API_BASE}/co/attainment`, {
                subject_id: subjectId,
                co_code: coCode
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { calculateCOAttainment };
}

export function usePOAttainment() {
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const calculatePOAttainment = async (poCode: string) => {
        try {
            const res = await axios.post(`${API_BASE}/po/attainment`, {
                po_code: poCode
            }, getHeaders());
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || err.message);
        }
    };

    return { calculatePOAttainment };
}

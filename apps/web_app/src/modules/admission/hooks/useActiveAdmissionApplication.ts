import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useApplicationList } from './useApplication';
import { useAuth } from '@/context/AuthContext';
import type { ApplicationRecord } from '@/shared/api/admission.api';

const BASE_STORAGE_KEY = 'edutrack.admission.active_app_id';

export interface UseActiveAdmissionApplicationResult {
  activeApplication: ApplicationRecord | null;
  activeApplicationId: string;
  applications: ApplicationRecord[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  setActiveApplicationId: (appId: string) => void;
  hasMultiple: boolean;
  appNumber: string;
  studentName: string;
  gradeApplied: string;
}

/**
 * Canonical hook to resolve and synchronize the active admission application
 * across Document Center, Fee Payment, Admission Status, and Dashboard views.
 *
 * Enforces strict user isolation: active applications are validated against
 * the current authenticated user's fetched applications. Unvalidated or
 * cross-tenant/cross-parent application IDs are never emitted.
 */
export function useActiveAdmissionApplication(): UseActiveAdmissionApplicationResult {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string; applicationId?: string }>();
  const { applications, isLoading, error, refetch } = useApplicationList(
    { limit: 50 },
    { mine: true },
  );

  const userId = user?.id || null;
  const userStorageKey = useMemo(() => {
    return userId ? `${BASE_STORAGE_KEY}.${userId}` : null;
  }, [userId]);

  const routeAppId = routeParams.id || routeParams.applicationId;
  const queryAppId = searchParams.get('appId') || searchParams.get('applicationId');

  // Internal state tracking selected ID
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (routeAppId) return routeAppId;
    if (queryAppId) return queryAppId;
    if (userStorageKey) {
      try {
        return sessionStorage.getItem(userStorageKey) || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  // Track previous authenticated user ID to reset local selectedId on user change
  const previousUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId;
      // Hard reset local selectedId when user changes or logs out
      setSelectedId('');
      if (userStorageKey) {
        try {
          const stored = sessionStorage.getItem(userStorageKey);
          if (stored) setSelectedId(stored);
        } catch {}
      }
    }
  }, [userId, userStorageKey]);

  // Sync when route or query param changes
  useEffect(() => {
    const explicitId = routeAppId || queryAppId;
    if (explicitId && explicitId !== selectedId) {
      setSelectedId(explicitId);
      if (userStorageKey) {
        try {
          sessionStorage.setItem(userStorageKey, explicitId);
        } catch {}
      }
    }
  }, [routeAppId, queryAppId, selectedId, userStorageKey]);

  /**
   * Deterministic active application resolution:
   * 1. Match against explicit selectedId / route / stored ID (ONLY if belongs to current user's applications)
   * 2. Backend-provided active/current application
   * 3. Most recently updated/submitted application
   * 4. First application in list
   */
  const activeApplication = useMemo<ApplicationRecord | null>(() => {
    if (!isAuthenticated || !applications || applications.length === 0) {
      return null;
    }

    // 1. Try matching explicit selectedId within current user's authorized applications
    if (selectedId) {
      const match = applications.find(
        (app) =>
          app.application_id === selectedId ||
          app.id === selectedId ||
          app.application_number === selectedId ||
          app.applicationNumber === selectedId,
      );
      if (match) return match;
    }

    // 2. Check if backend explicitly marked an active application
    const backendActive = applications.find(
      (app) => (app as any).is_active === true || (app as any).isActive === true,
    );
    if (backendActive) return backendActive;

    // 3. Select the most recently updated/submitted application
    const sorted = [...applications].sort((a, b) => {
      const dateA = new Date(
        a.updated_at || a.submitted_at || a.application_date || a.created_at || 0,
      ).getTime();
      const dateB = new Date(
        b.updated_at || b.submitted_at || b.application_date || b.created_at || 0,
      ).getTime();
      return dateB - dateA;
    });

    return sorted[0] || applications[0] || null;
  }, [isAuthenticated, applications, selectedId]);

  // Active application ID is strictly derived from the validated activeApplication
  const activeApplicationId = activeApplication?.application_id || activeApplication?.id || '';

  // Synchronize storage and selectedId when validated active application is determined
  useEffect(() => {
    if (activeApplicationId && userStorageKey) {
      try {
        sessionStorage.setItem(userStorageKey, activeApplicationId);
      } catch {}
    }
  }, [activeApplicationId, userStorageKey]);

  const setActiveApplicationId = useCallback(
    (appId: string) => {
      setSelectedId(appId);
      if (userStorageKey) {
        try {
          sessionStorage.setItem(userStorageKey, appId);
        } catch {}
      }
      // Update query param without full reload
      const newParams = new URLSearchParams(searchParams);
      newParams.set('appId', appId);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams, userStorageKey],
  );

  const studentName = useMemo(() => {
    if (!activeApplication) return 'Applicant';
    return (
      activeApplication.student_name ||
      (activeApplication.leads
        ? `${activeApplication.leads.student_first_name || ''} ${activeApplication.leads.student_last_name || ''}`.trim()
        : activeApplication.lead
          ? `${activeApplication.lead.student_first_name || ''} ${activeApplication.lead.student_last_name || ''}`.trim()
          : 'Applicant')
    );
  }, [activeApplication]);

  const gradeApplied = useMemo(() => {
    if (!activeApplication) return 'Grade Applied';
    return (
      activeApplication.grade_applied_for ||
      activeApplication.grade_name ||
      (activeApplication.lead as any)?.grade_applied_for ||
      (activeApplication.leads as any)?.academic_year_grades?.grades?.grade_name ||
      'Grade Applied'
    );
  }, [activeApplication]);

  const appNumber = useMemo(() => {
    if (!activeApplication) return '';
    return (
      activeApplication.application_number ||
      activeApplication.applicationNumber ||
      (activeApplicationId ? `APP-${activeApplicationId.slice(0, 8).toUpperCase()}` : '')
    );
  }, [activeApplication, activeApplicationId]);

  return {
    activeApplication,
    activeApplicationId,
    applications: isAuthenticated ? applications : [],
    isLoading: isLoading || !isAuthenticated,
    error,
    refetch,
    setActiveApplicationId,
    hasMultiple: isAuthenticated && applications.length > 1,
    appNumber,
    studentName,
    gradeApplied,
  };
}


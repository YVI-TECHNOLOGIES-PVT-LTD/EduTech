import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useApplicationList } from './useApplication';
import type { ApplicationRecord } from '@/shared/api/admission.api';

const ACTIVE_APP_STORAGE_KEY = 'edutrack.admission.active_app_id';

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
 */
export function useActiveAdmissionApplication(): UseActiveAdmissionApplicationResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string; applicationId?: string }>();
  const { applications, isLoading, error, refetch } = useApplicationList(
    { limit: 50 },
    { mine: true },
  );

  const routeAppId = routeParams.id || routeParams.applicationId;
  const queryAppId = searchParams.get('appId') || searchParams.get('applicationId');

  // Internal state tracking selected ID
  const [selectedId, setSelectedId] = useState<string>(() => {
    return (
      routeAppId ||
      queryAppId ||
      (() => {
        try {
          return sessionStorage.getItem(ACTIVE_APP_STORAGE_KEY) || '';
        } catch {
          return '';
        }
      })()
    );
  });

  // Sync when route or query param changes
  useEffect(() => {
    const explicitId = routeAppId || queryAppId;
    if (explicitId && explicitId !== selectedId) {
      setSelectedId(explicitId);
      try {
        sessionStorage.setItem(ACTIVE_APP_STORAGE_KEY, explicitId);
      } catch {}
    }
  }, [routeAppId, queryAppId, selectedId]);

  // Resolve matching application from server list
  const activeApplication = useMemo<ApplicationRecord | null>(() => {
    if (!applications || applications.length === 0) return null;

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

    // Default to the first application if none explicitly matched
    return applications[0];
  }, [applications, selectedId]);

  const activeApplicationId =
    activeApplication?.application_id || activeApplication?.id || selectedId || '';

  // Synchronize storage when active application changes
  useEffect(() => {
    if (activeApplicationId) {
      try {
        sessionStorage.setItem(ACTIVE_APP_STORAGE_KEY, activeApplicationId);
      } catch {}
    }
  }, [activeApplicationId]);

  const setActiveApplicationId = useCallback(
    (appId: string) => {
      setSelectedId(appId);
      try {
        sessionStorage.setItem(ACTIVE_APP_STORAGE_KEY, appId);
      } catch {}
      // Update query param without full reload
      const newParams = new URLSearchParams(searchParams);
      newParams.set('appId', appId);
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
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
      activeApplication.lead?.grade_applied_for ||
      activeApplication.leads?.academic_year_grades?.grades?.grade_name ||
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
    applications,
    isLoading,
    error,
    refetch,
    setActiveApplicationId,
    hasMultiple: applications.length > 1,
    appNumber,
    studentName,
    gradeApplied,
  };
}

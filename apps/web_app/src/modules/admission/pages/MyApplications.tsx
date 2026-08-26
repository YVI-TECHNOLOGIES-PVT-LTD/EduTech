import React from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApplicationList } from '../hooks/useApplication';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatusCard } from '../components/ApplicationStatusCard';
import type { ApplicationRecord } from '@/shared/api/admission.api';

export function MyApplications() {
  const navigate = useNavigate();
  const {
    applications = [],
    isLoading,
    error,
    refetch,
  } = useApplicationList({ limit: 50 }, { mine: true });

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Loading your admission applications...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load applications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve your admission applications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="My Admission Applications"
        description="Track evaluation status, submitted certificates, and processing fee clearance for your children."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Start New Application
          </Button>
        }
      />

      {/* Applications List or Empty State */}
      {applications.length === 0 ? (
        <EmptyState
          title="No Admission Applications Yet"
          description="Start your child's enrollment process by completing an online admission application."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              Start New Application
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <SectionHeader
            title={`Your Registered Applications (${applications.length})`}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app: ApplicationRecord) => (
              <ApplicationStatusCard key={app.application_id || app.id} application={app} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default MyApplications;

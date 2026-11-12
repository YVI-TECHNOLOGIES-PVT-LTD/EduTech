import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AcademicManagementService,
  ReadinessTenantYearItem,
  AcademicYearReadinessReport,
  ReadinessDependencyGraph,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const AcademicReadinessPage: React.FC = () => {
  const { academicYearId: routeYearId } = useParams<{ academicYearId?: string }>();
  const [tenantYears, setTenantYears] = useState<ReadinessTenantYearItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>(routeYearId || '');
  const [report, setReport] = useState<AcademicYearReadinessReport | null>(null);
  const [dependencies, setDependencies] = useState<ReadinessDependencyGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [validating, setValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadYearReport = useCallback(async (yearId: string) => {
    if (!yearId) {
      setReport(null);
      setDependencies(null);
      return;
    }
    const [rep, deps] = await Promise.all([
      AcademicManagementService.getYearReadiness(yearId),
      AcademicManagementService.getReadinessDependencies(yearId).catch(() => null),
    ]);
    setReport(rep);
    setDependencies(deps);
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const yearsList = await AcademicManagementService.getReadinessOverview();
      setTenantYears(yearsList);

      const targetYearId =
        routeYearId ||
        selectedYearId ||
        yearsList.find((y) => y.status === 'teaching')?.academic_year_id ||
        yearsList[0]?.academic_year_id ||
        '';

      setSelectedYearId(targetYearId);
      if (targetYearId) {
        await loadYearReport(targetYearId);
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load academic readiness diagnostics'));
    } finally {
      setLoading(false);
    }
  }, [loadYearReport, routeYearId, selectedYearId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSelectYear = async (yearId: string) => {
    setSelectedYearId(yearId);
    setError(null);
    try {
      await loadYearReport(yearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load readiness report for year'));
    }
  };

  const handleRunValidation = async () => {
    if (!selectedYearId) return;
    setValidating(true);
    setError(null);
    setSuccess(null);
    try {
      const freshReport = await AcademicManagementService.runReadinessValidation(selectedYearId);
      setReport(freshReport);
      setSuccess(
        `Re-evaluated 12 readiness domains (${freshReport.overall_score}% overall score).`,
      );
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to run readiness validation'));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div data-testid="academic-readiness-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Readiness & Publishing"
        subtitle="12-domain pre-publication validation engine, cross-module dependency verification, and domain publishing links."
        icon={CheckCircle2}
        onRefresh={loadOverview}
        loading={loading}
        badgeText={report ? `${report.overall_score}% Ready` : undefined}
        actions={
          selectedYearId ? (
            <Button
              type="button"
              size="sm"
              disabled={validating}
              onClick={handleRunValidation}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
              Run Validation
            </Button>
          ) : undefined
        }
      />

      <AcademicStatusBanner
        error={error}
        success={success}
        info="Publication is managed per domain (Academic Year activation, Curriculum plan approval/publication, and Timetable publication) cleanly aligned with PostgreSQL Stage-1 tables."
      />

      {/* Year Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tenantYears.map((yr) => {
          const isSelected = yr.academic_year_id === selectedYearId;
          return (
            <button
              type="button"
              key={yr.academic_year_id}
              onClick={() => handleSelectYear(yr.academic_year_id)}
              className={`text-left p-4 rounded-xl border transition space-y-2 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-border/70 bg-card hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">{yr.academic_year_name}</span>
                <Badge variant="outline" className={getAcademicStatusBadgeClass(yr.status)}>
                  {yr.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatShortDate(yr.start_date)} – {formatShortDate(yr.end_date)}
              </div>
              <div className="text-xs text-muted-foreground">
                {yr.grade_offerings_count} grades · {yr.sections_count} sections · Timetable:{' '}
                {yr.has_published_timetable > 0 ? 'Published' : 'Unpublished'}
              </div>
            </button>
          );
        })}
      </div>

      {report && (
        <>
          {/* Scorecard Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Overall Readiness</CardDescription>
                <CardTitle className="text-3xl font-black">{report.overall_score}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className={getAcademicStatusBadgeClass(report.readiness_status)}
                >
                  {report.readiness_status}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Passed Checks</CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-600">
                  {report.summary.passed}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Out of {report.summary.total_checks} evaluated checks
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Blocking Errors</CardDescription>
                <CardTitle className="text-3xl font-black text-red-600">
                  {report.blocking_errors.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Must resolve before publishing
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Warnings</CardDescription>
                <CardTitle className="text-3xl font-black text-amber-600">
                  {report.warnings.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Recommended optimizations
              </CardContent>
            </Card>
          </div>

          {/* 12 Domain Scorecard Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Domain Validation Scorecard ({report.categories.length} Categories)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3.5 rounded-xl border border-border/70 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs">{cat.display_name}</span>
                    <Badge variant="outline" className={getAcademicStatusBadgeClass(cat.status)}>
                      {cat.status} ({cat.score}%)
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cat.passed_count} passed · {cat.failed_count} failed · {cat.warnings_count}{' '}
                    warnings
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blocking Findings & Remediation + Dependency Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  Actionable Findings ({report.blocking_errors.length + report.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {report.blocking_errors.length === 0 && report.warnings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-sm text-emerald-700">
                    All evaluable checks passed with zero blocking errors or warnings.
                  </div>
                ) : (
                  [...report.blocking_errors, ...report.warnings].map((f, idx) => (
                    <div
                      key={`${f.rule_code}-${idx}`}
                      className="p-3.5 rounded-xl border border-border/70 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <AlertTriangle
                            className={`w-4 h-4 ${f.severity === 'ERROR' ? 'text-red-600' : 'text-amber-600'}`}
                          />
                          <span>{f.title}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={getAcademicStatusBadgeClass(f.severity)}
                        >
                          {f.blocking ? 'Blocking' : f.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                      <p className="text-xs text-indigo-600 font-medium">
                        Fix: {f.remediation_guidance}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-600" />
                  Dependency Readiness & Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dependencies?.nodes?.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-border/60"
                  >
                    <span className="font-semibold">{node.label}</span>
                    <Badge variant="outline">{node.status}</Badge>
                  </div>
                ))}

                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Domain Publishing Consoles
                  </div>
                  <Link
                    to="/app/academic/structure"
                    className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <span>Activate Academic Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/app/academic/curriculum"
                    className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <span>Publish Curriculum Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/app/academic/timetable"
                    className="flex items-center justify-between text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <span>Review Timetable Coverage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AcademicReadinessPage;

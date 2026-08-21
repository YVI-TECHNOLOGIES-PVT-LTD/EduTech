import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Sliders,
  BarChart3,
  ClipboardCheck,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  User,
  Calendar,
  ExternalLink,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  useGetApplicationsQuery,
  useGetAssessmentConfigsQuery,
  useGetAssessmentsListQuery,
  AssessmentConfigDto,
} from '@/shared/api/admission.api';
import { MarksEntryModal } from './MarksEntryModal';
import { AssessmentConfigModal } from './AssessmentConfigModal';
import { AssessmentAnalyticsTab } from './AssessmentAnalyticsTab';
import { useLanguage } from '@/context/LanguageContext';

export function ExamWorkspace() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'queue' | 'configs' | 'analytics'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [selectedAppForMarks, setSelectedAppForMarks] = useState<any | null>(null);
  const [selectedConfigForEdit, setSelectedConfigForEdit] = useState<AssessmentConfigDto | null>(
    null,
  );

  // RTK Queries
  const {
    data: appsResponse,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = useGetApplicationsQuery({
    pageSize: 100,
    searchText: searchQuery || undefined,
  });

  const {
    data: configsResponse,
    isLoading: configsLoading,
    refetch: refetchConfigs,
  } = useGetAssessmentConfigsQuery();

  const applications = appsResponse?.data || [];
  const configs = configsResponse?.data || [];

  // Filter candidates for the assessment desk
  const filteredCandidates = useMemo(() => {
    return applications.filter((app) => {
      // Check search match
      const name =
        `${app.lead?.student_first_name || ''} ${app.lead?.student_last_name || ''}`.toLowerCase();
      const appNo = (app.application_number || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || appNo.includes(q);

      // Check result filter
      const assessmentResult =
        app.assessment?.result || ((app.status as string) === 'assessment' ? 'pending' : 'pending');
      const matchesResult =
        resultFilter === 'all' ||
        (resultFilter === 'pending' && (!app.assessment || !app.assessment.result)) ||
        (resultFilter !== 'pending' && app.assessment?.result === resultFilter);

      return matchesSearch && matchesResult;
    });
  }, [applications, searchQuery, resultFilter]);

  const handleRefresh = () => {
    refetchApps();
    refetchConfigs();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
              {t('assessment.deskTitle', 'Assessment & Examination Desk')}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            {t('assessment.evaluationWorkspace', 'Entrance Exam & Evaluation Desk')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'assessment.deskSubtitle',
              'Candidate score logging, grading criteria, and performance analytics',
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="space-y-6"
      >
        <TabsList className="bg-muted/70 p-1 rounded-2xl border border-border">
          <TabsTrigger
            value="queue"
            className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
            {t('assessment.candidateQueue', 'Candidate Evaluation Queue')}
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-bold">
              {filteredCandidates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="configs"
            className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Sliders className="w-4 h-4 text-purple-600" />
            {t('assessment.gradeRules', 'Grade Assessment Rules')}
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-bold">
              {configs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            {t('assessment.analyticsTab', 'Assessment Analytics')}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Candidate Evaluation Queue */}
        <TabsContent value="queue" className="space-y-5 m-0">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t(
                  'assessment.searchCandidates',
                  'Search candidate name or application #...',
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: t('common.all', 'All') },
                { id: 'pending', label: t('assessment.pending', 'Pending Evaluation') },
                { id: 'pass', label: t('assessment.pass', 'Passed') },
                { id: 'recommended', label: t('assessment.recommended', 'Recommended') },
                { id: 'fail', label: t('assessment.fail', 'Failed') },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  variant={resultFilter === filter.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResultFilter(filter.id)}
                  className={`rounded-xl text-xs h-8 px-3 font-bold transition-all ${
                    resultFilter === filter.id
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Candidates List Grid */}
          {appsLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
              {t('common.loading', 'Loading candidate roster...')}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-border p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {t('assessment.noCandidatesFound', 'No Candidates Found')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t(
                  'assessment.noCandidatesHint',
                  'No applications matching the current filter criteria.',
                )}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((app) => {
                const studentName = app.lead?.student_first_name
                  ? `${app.lead.student_first_name} ${app.lead.student_last_name || ''}`.trim()
                  : app.applicantName || 'Applicant';
                const gradeName =
                  (app.lead as any)?.academic_year_grades?.grades?.grade_name ||
                  (app as any).grade_name ||
                  app.gradeApplyingFor ||
                  'Grade';
                const hasAssessment = Boolean(
                  app.assessment && app.assessment.marks_obtained !== null,
                );
                const marksObtained = app.assessment?.marks_obtained;
                const maxMarks = app.assessment?.maximum_marks || 100;
                const percentage = app.assessment?.percentage;
                const resultStatus = app.assessment?.result;

                return (
                  <Card
                    key={app.application_id || app.id}
                    className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group bg-card"
                  >
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                            {app.application_number}
                          </span>
                          <CardTitle className="text-base font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                            {studentName}
                          </CardTitle>
                        </div>

                        {/* Result Badge */}
                        {resultStatus === 'pass' && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('assessment.pass', 'Pass')}
                          </Badge>
                        )}
                        {resultStatus === 'fail' && (
                          <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold border-rose-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('assessment.fail', 'Fail')}
                          </Badge>
                        )}
                        {resultStatus === 'recommended' && (
                          <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold border-blue-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {t('assessment.recommended', 'Recommended')}
                          </Badge>
                        )}
                        {!resultStatus && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-200 font-bold"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {t('assessment.pending', 'Pending')}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{gradeName}</span>
                        <span>•</span>
                        <span>{app.status || 'Application'}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      {/* Score Summary Box */}
                      {hasAssessment ? (
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/70 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                              {t('assessment.score', 'Score')}
                            </span>
                            <span className="text-base font-black text-foreground">
                              {marksObtained} / {maxMarks}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                              {t('assessment.percentage', 'Percentage')}
                            </span>
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                          {t('assessment.awaitingEvaluation', 'Awaiting marks entry & evaluation')}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedAppForMarks({
                              application_id: app.application_id || app.id,
                              application_number: app.application_number,
                              student_name: studentName,
                              grade_name: gradeName,
                              current_marks: marksObtained,
                              current_max_marks: maxMarks,
                              current_result: resultStatus,
                              current_remarks: app.assessment?.remarks,
                              current_assessed_by: app.assessment?.assessed_by,
                              current_date: app.assessment?.assessment_date,
                              config_id: app.assessment?.config_id,
                            });
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          <Award className="w-3.5 h-3.5 mr-1" />
                          {hasAssessment
                            ? t('assessment.reevaluate', 'Re-evaluate')
                            : t('assessment.enterMarks', 'Enter Marks')}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/app/admissions/application/${app.application_id || app.id}`)
                          }
                          className="rounded-xl text-xs px-2.5"
                          title={t('assessment.viewApplicant360', 'Applicant 360')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Grade Assessment Rules */}
        <TabsContent value="configs" className="space-y-4 m-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-foreground">
                {t('assessment.configuredPolicies', 'Configured Grade Policies')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t(
                  'assessment.configuredPoliciesDesc',
                  'Exam modes, passing thresholds, and scoring rules per grade level',
                )}
              </p>
            </div>
          </div>

          {configsLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
              {t('common.loading', 'Loading configurations...')}
            </div>
          ) : configs.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-border p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {t('assessment.noConfigs', 'No Grade Assessment Rules Configured')}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t(
                  'assessment.noConfigsHint',
                  'Assessment rules will be displayed as academic year grades are provisioned.',
                )}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((cfg) => {
                const gradeTitle = cfg.academic_year_grades?.grades?.grade_name || 'Academic Grade';
                const yearTitle =
                  cfg.academic_year_grades?.academic_years?.year_name || 'Academic Year';

                return (
                  <Card
                    key={cfg.config_id}
                    className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-card"
                  >
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {gradeTitle}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {yearTitle}
                        </CardDescription>
                      </div>

                      <Badge
                        variant={cfg.is_active ? 'default' : 'secondary'}
                        className={`text-[10px] font-bold ${
                          cfg.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : ''
                        }`}
                      >
                        {cfg.is_active
                          ? t('common.active', 'Active')
                          : t('common.inactive', 'Inactive')}
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                            {t('assessment.mode', 'Mode')}
                          </span>
                          <span className="font-bold text-foreground capitalize">
                            {cfg.assessment_mode || 'Written'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                            {t('assessment.resultType', 'Type')}
                          </span>
                          <span className="font-bold text-foreground capitalize">
                            {cfg.result_type || 'Marks'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                            {t('assessment.maxMarks', 'Max Marks')}
                          </span>
                          <span className="font-bold text-foreground">
                            {cfg.maximum_marks ?? 100}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                            {t('assessment.passMarks', 'Pass Marks')}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {cfg.pass_marks ?? 40}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConfigForEdit(cfg)}
                        className="w-full rounded-xl text-xs font-bold gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        {t('assessment.editConfiguration', 'Edit Grade Configuration')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Assessment Analytics */}
        <TabsContent value="analytics" className="m-0">
          <AssessmentAnalyticsTab />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <MarksEntryModal
        isOpen={Boolean(selectedAppForMarks)}
        onClose={() => setSelectedAppForMarks(null)}
        application={selectedAppForMarks}
        onSuccess={() => refetchApps()}
      />

      <AssessmentConfigModal
        isOpen={Boolean(selectedConfigForEdit)}
        onClose={() => setSelectedConfigForEdit(null)}
        config={selectedConfigForEdit}
        onSuccess={() => refetchConfigs()}
      />
    </div>
  );
}

export default ExamWorkspace;

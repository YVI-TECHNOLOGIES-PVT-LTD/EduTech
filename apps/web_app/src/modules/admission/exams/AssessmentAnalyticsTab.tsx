import React from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  TrendingUp,
  Percent,
  Sliders,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGetAssessmentAnalyticsQuery } from '@/shared/api/admission.api';
import { useLanguage } from '@/context/LanguageContext';

export const AssessmentAnalyticsTab: React.FC = () => {
  const { t } = useLanguage();
  const { data: analytics, isLoading, error } = useGetAssessmentAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
        {t('common.loading', 'Loading assessment analytics & metrics...')}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="py-12 text-center text-sm text-rose-500 font-semibold">
        {t('assessment.analyticsError', 'Failed to load assessment analytics data.')}
      </div>
    );
  }

  const {
    totalAssessed = 0,
    passed = 0,
    failed = 0,
    recommended = 0,
    notRecommended = 0,
    passRate = 0,
    avgPercentage = 0,
    totalConfigs = 0,
    modeDistribution = {},
  } = analytics;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessed */}
        <Card className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('assessment.totalAssessed', 'Total Assessed')}
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalAssessed}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('assessment.candidatesEvaluated', 'Candidates evaluated across all grades')}
            </p>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('assessment.passRate', 'Overall Pass Rate')}
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {passRate}%
            </div>
            <Progress value={passRate} className="h-1.5 mt-2 bg-muted" />
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('assessment.avgScore', 'Average Score')}
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {avgPercentage}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('assessment.meanAcrossAll', 'Mean performance index')}
            </p>
          </CardContent>
        </Card>

        {/* Configured Grade Rules */}
        <Card className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('assessment.gradeConfigs', 'Grade Rules')}
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalConfigs}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('assessment.activeRulesConfigured', 'Active grade evaluation policies')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Breakdown Card */}
        <Card className="rounded-2xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              {t('assessment.outcomeBreakdown', 'Evaluation Outcomes')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('assessment.outcomeDescription', 'Distribution of candidate assessment decisions')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-foreground">
                  {t('assessment.pass', 'Qualified / Passed')}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black"
              >
                {passed}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-foreground">
                  {t('assessment.recommended', 'Recommended')}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black"
              >
                {recommended}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-foreground">
                  {t('assessment.fail', 'Failed / Not Qualified')}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black"
              >
                {failed}
              </Badge>
            </div>

            {notRecommended > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-foreground">
                    {t('assessment.notRecommended', 'Not Recommended')}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black"
                >
                  {notRecommended}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Mode Distribution */}
        <Card className="rounded-2xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              {t('assessment.modeDistribution', 'Assessment Mode Distribution')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('assessment.modeDescription', 'Evaluations completed by assessment methodology')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(modeDistribution).length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t('assessment.noModeData', 'No mode data recorded yet.')}
              </div>
            ) : (
              Object.entries(modeDistribution).map(([mode, count]) => {
                const pct = totalAssessed > 0 ? Math.round((count / totalAssessed) * 100) : 0;
                return (
                  <div key={mode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold capitalize text-foreground">
                        {mode} {t('assessment.modeSuffix', 'Assessment')}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentAnalyticsTab;

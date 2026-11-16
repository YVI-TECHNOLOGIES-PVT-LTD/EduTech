import React from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetAdminAiUsageQuery, useGetAiCopilotStatusQuery } from '@/shared/api/aiCopilot.api';
import {
  ShieldCheck,
  Cpu,
  BarChart3,
  Coins,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const AdminAiOversightPage: React.FC = () => {
  const {
    data: usage,
    isLoading: isUsageLoading,
    refetch: refetchUsage,
  } = useGetAdminAiUsageQuery();
  const {
    data: status,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useGetAiCopilotStatusQuery();

  const handleRefresh = () => {
    refetchUsage();
    refetchStatus();
  };

  const totalRequests = usage?.total_requests || 0;
  const successfulRequests = usage?.successful_requests || 0;
  const failedRequests = usage?.failed_requests || 0;
  const successRate =
    totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 100;

  return (
    <PageContainer>
      <PageHeader
        title="AI Oversight & Analytics"
        description="Monitor system-wide AI usage, provider health, token consumption, and safety guardrail enforcement."
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Multi-Tenant Isolation: Fail-Closed
          </Badge>
          <Badge variant="outline" className="text-xs">
            Safety Guardrails: Active
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Metrics
        </Button>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Active AI Provider</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {isStatusLoading ? 'Loading...' : status?.provider?.toUpperCase() || 'MOCK'}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> System Status:{' '}
            {status?.status || 'Active'}
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total Generation Requests
            </span>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {isUsageLoading ? '...' : totalRequests}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {successfulRequests} Success / {failedRequests} Rejected
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {isUsageLoading ? '...' : `${successRate}%`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Excludes security-blocked requests
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Estimated Tokens Consumed
            </span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {isUsageLoading ? '...' : (usage?.estimated_tokens || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Tracked across all prompt versions
          </div>
        </Card>
      </div>

      {/* Generation Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 border-border lg:col-span-2">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Operational Volume by Capability
          </h3>

          {!usage?.by_type || Object.keys(usage.by_type).length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No generation requests recorded in this cycle yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Capability Type</th>
                    <th className="pb-2 font-medium">Total Calls</th>
                    <th className="pb-2 font-medium">Est. Tokens</th>
                    <th className="pb-2 font-medium">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(usage.by_type).map(([key, item]) => (
                    <tr key={key} className="py-2">
                      <td className="py-2.5 font-medium text-foreground uppercase">
                        {key.replace('_', ' ')}
                      </td>
                      <td className="py-2.5">{item.requests}</td>
                      <td className="py-2.5 font-mono">{item.tokens.toLocaleString()}</td>
                      <td className="py-2.5">
                        {item.errors > 0 ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                            {item.errors}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Safety & Guardrail Architecture */}
        <Card className="p-5 border-border lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" /> Active Safety Architecture
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-muted/40 border rounded-lg">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" /> Multi-Tenant Boundary
              </div>
              <p className="text-muted-foreground mt-1">
                Faculty assignment verification verifies organization ID, active teacher tenure, and
                enrolled section scope before calling any model.
              </p>
            </div>

            <div className="p-3 bg-muted/40 border rounded-lg">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> Prompt Injection Shield
              </div>
              <p className="text-muted-foreground mt-1">
                Filters instruction overrides, system prompt leak probes, DAN patterns, and
                recursive jailbreaks.
              </p>
            </div>

            <div className="p-3 bg-muted/40 border rounded-lg">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Clinical Non-Diagnosis Policy
              </div>
              <p className="text-muted-foreground mt-1">
                Blocks psychological or psychiatric diagnoses (e.g. ADHD, autism, depression),
                mandating objective academic observation only.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AdminAiOversightPage;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  ExternalLink,
  FileText,
  ShieldCheck,
  Layers,
  Radio,
  Mail,
  MessageSquare,
  Smartphone,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  Info,
  Sliders,
  Check,
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Liquid Glass design tokens matching EduTrack design language
const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';
const GLASS_PANEL =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl';

interface NotificationSummary {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  unread: number;
  recent: NotificationItem[];
}

interface NotificationItem {
  notification_id: string;
  recipient_user_id: string;
  category: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  is_read: boolean;
  metadata?: {
    channel?: string;
    delivery_status?: string;
    provider_message_id?: string;
    retry_history?: Array<{ channel: string; retried_at: string }>;
    correlation_id?: string;
    [key: string]: any;
  };
  created_at: string;
}

interface TemplateItem {
  id: string;
  name: string;
  eventType: string;
  supportedChannels: string[];
  titleTemplate: string;
  messageTemplate: string;
  allowlistedVariables: string[];
}

interface ChannelHealthItem {
  channel: string;
  name: string;
  status: 'configured_operational' | 'configured_unverified' | 'missing_credentials' | 'disabled';
  statusLabel: string;
  provider: string;
  message: string;
  deliveryReceiptSupport: boolean;
  notes: string;
}

interface BatchReminderPreviewResult {
  totalEligible: number;
  dispatchedCount: number;
  skippedCount: number;
  previewSummary: Array<{
    studentName: string;
    admissionNo: string;
    outstandingAmount: number;
    dueDate: string;
    daysOverdue: number;
    gradeName?: string;
  }>;
}

export const FinanceNotificationCenter: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'templates' | 'channels' | 'reminders'>('overview');

  // Summary state (Screen A)
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Activity list state (Screen B)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Templates state (Screen C)
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeTemplateForPreview, setActiveTemplateForPreview] = useState<TemplateItem | null>(null);
  const [renderedPreview, setRenderedPreview] = useState<{ title: string; message: string; renderedAt: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Channel health state (Screen D)
  const [channels, setChannels] = useState<ChannelHealthItem[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Detail drawer state (Screen F)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Batch Reminder state (Screen E)
  const [reminderType, setReminderType] = useState<'overdue' | 'due_soon'>('overdue');
  const [gradeFilter, setGradeFilter] = useState('');
  const [minOutstanding, setMinOutstanding] = useState<number>(0);
  const [reminderPreview, setReminderPreview] = useState<BatchReminderPreviewResult | null>(null);
  const [loadingReminderPreview, setLoadingReminderPreview] = useState(false);
  const [dispatchingReminders, setDispatchingReminders] = useState(false);
  const [confirmSendModalOpen, setConfirmSendModalOpen] = useState(false);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await apiClient.get('/fees/notifications/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load notification summary', err);
      toast.error('Failed to load notification overview');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // 2. Fetch Notifications Activity
  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const params: any = { page, limit };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedChannel) params.channel = selectedChannel;
      if (selectedType) params.type = selectedType;

      const res = await apiClient.get('/fees/notifications', { params });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotalRecords(res.data.data.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load notification activity', err);
      toast.error('Failed to load notification activity');
    } finally {
      setLoadingActivity(false);
    }
  }, [page, limit, searchQuery, selectedChannel, selectedType]);

  // 3. Fetch Templates
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await apiClient.get('/fees/notifications/templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load templates', err);
      toast.error('Failed to load message templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  // 4. Fetch Channels
  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const res = await apiClient.get('/fees/notifications/channels');
      if (res.data?.success) {
        setChannels(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load channels', err);
      toast.error('Failed to load channel health');
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  // Initialize data on tab change
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSummary();
    } else if (activeTab === 'activity') {
      fetchActivity();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'channels') {
      fetchChannels();
    }
  }, [activeTab, fetchSummary, fetchActivity, fetchTemplates, fetchChannels]);

  // Handle Retry Action
  const handleRetry = async (notificationId: string, channel: string = 'in_app') => {
    setRetryingId(notificationId);
    try {
      const res = await apiClient.post(`/fees/notifications/${notificationId}/retry`, { channel });
      if (res.data?.success) {
        toast.success('Notification retry queued and recorded successfully');
        if (selectedNotification && selectedNotification.notification_id === notificationId) {
          // Refresh single notification in detail
          const detailRes = await apiClient.get(`/fees/notifications/${notificationId}`);
          if (detailRes.data?.success) {
            setSelectedNotification(detailRes.data.data);
          }
        }
        fetchActivity();
        fetchSummary();
      } else {
        toast.error(res.data?.message || 'Retry failed');
      }
    } catch (err: any) {
      console.error('Retry failed', err);
      toast.error(err.response?.data?.message || 'Failed to retry notification dispatch');
    } finally {
      setRetryingId(null);
    }
  };

  // Handle Template Preview
  const handleOpenPreview = async (template: TemplateItem) => {
    setActiveTemplateForPreview(template);
    setPreviewModalOpen(true);
    setLoadingPreview(true);
    try {
      const res = await apiClient.post('/fees/notifications/preview', {
        templateKey: template.eventType,
        sampleData: {},
      });
      if (res.data?.success) {
        setRenderedPreview(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to generate preview', err);
      toast.error('Failed to generate template preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Batch Reminder Preview (Dry Run)
  const handlePreviewBatchReminders = async () => {
    setLoadingReminderPreview(true);
    try {
      const res = await apiClient.post('/fees/notifications/send-reminder', {
        reminderType,
        gradeId: gradeFilter.trim() || undefined,
        minOutstanding: Number(minOutstanding) || 0,
        dryRun: true,
      });
      if (res.data?.success) {
        setReminderPreview(res.data.data);
        toast.info(`Identified ${res.data.data.totalEligible} eligible recipients.`);
      }
    } catch (err: any) {
      console.error('Failed to preview reminders', err);
      toast.error(err.response?.data?.message || 'Failed to generate reminder preview');
    } finally {
      setLoadingReminderPreview(false);
    }
  };

  // Handle Confirmed Batch Reminder Dispatch
  const handleDispatchBatchReminders = async () => {
    setDispatchingReminders(true);
    try {
      const res = await apiClient.post('/fees/notifications/send-reminder', {
        reminderType,
        gradeId: gradeFilter.trim() || undefined,
        minOutstanding: Number(minOutstanding) || 0,
        dryRun: false,
      });
      if (res.data?.success) {
        toast.success(`Dispatched ${res.data.data.dispatchedCount} reminders successfully!`);
        setConfirmSendModalOpen(false);
        setReminderPreview(null);
        fetchSummary();
      } else {
        toast.error(res.data?.message || 'Failed to dispatch reminders');
      }
    } catch (err: any) {
      console.error('Failed to send reminders', err);
      toast.error(err.response?.data?.message || 'Error occurred while sending reminders');
    } finally {
      setDispatchingReminders(false);
    }
  };

  const channelIcon = (ch?: string) => {
    switch (ch?.toLowerCase()) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'sms':
        return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'in_app':
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const statusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'accepted':
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            <Clock className="w-3 h-3" /> Provider Accepted
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3" /> Pending / Local
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100/50 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className={`${GLASS_CARD} p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Finance Notifications & Communication</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tenant-isolated, multi-channel dispatch, audit log & reminder command center
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'overview') fetchSummary();
                else if (activeTab === 'activity') fetchActivity();
                else if (activeTab === 'templates') fetchTemplates();
                else if (activeTab === 'channels') fetchChannels();
              }}
              className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Trigger Batch Reminders
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 mt-6 -mb-2 space-x-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Screen A: Overview', icon: Layers },
            { id: 'activity', label: 'Screen B: Notification Activity', icon: Bell },
            { id: 'templates', label: 'Screen C: Templates', icon: FileText },
            { id: 'channels', label: 'Screen D: Channel Health', icon: Radio },
            { id: 'reminders', label: 'Screen E: Reminder Workflow', icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN A: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className={`${GLASS_CARD} p-5 border-l-4 border-l-purple-500`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Generated</span>
                <Bell className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold mt-2">{loadingSummary ? '...' : summary?.total ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Durable finance notifications</p>
            </div>

            <div className={`${GLASS_CARD} p-5 border-l-4 border-l-blue-500`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider Accepted</span>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold mt-2">{loadingSummary ? '...' : summary?.sent ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Dispatched to channel adapters</p>
            </div>

            <div className={`${GLASS_CARD} p-5 border-l-4 border-l-emerald-500`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold mt-2">{loadingSummary ? '...' : summary?.delivered ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Confirmed delivery receipts</p>
            </div>

            <div className={`${GLASS_CARD} p-5 border-l-4 border-l-rose-500`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</span>
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-2xl font-bold mt-2">{loadingSummary ? '...' : summary?.failed ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Eligible for safe manual retry</p>
            </div>

            <div className={`${GLASS_CARD} p-5 border-l-4 border-l-amber-500`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unread In-App</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold mt-2">{loadingSummary ? '...' : summary?.unread ?? 0}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting recipient viewing</p>
            </div>
          </div>

          {/* Quick Informational Notice */}
          <div className={`${GLASS_PANEL} p-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Strict Financial Invariant Guaranteed:</span>{' '}
              Notifications are strictly decoupled from financial transactions via asynchronous event subscribers. Sending, retrying,
              or failing to send a notification never alters student ledger balances, allocations, or payment statuses.
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className={`${GLASS_CARD} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" /> Recent Finance Dispatches
              </h2>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium flex items-center gap-1"
              >
                View all notifications <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingSummary ? (
              <div className="py-12 text-center text-slate-400">Loading recent dispatches...</div>
            ) : !summary?.recent?.length ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No recent finance notifications recorded for this institution.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Title / Details</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {summary.recent.map((item) => (
                      <tr key={item.notification_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center gap-1.5 capitalize">
                            {channelIcon(item.metadata?.channel)}
                            {item.metadata?.channel || 'in_app'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{statusBadge(item.metadata?.delivery_status)}</td>
                        <td className="px-4 py-3 max-w-xs truncate text-xs">
                          <span className="font-semibold text-slate-900 dark:text-white">{item.title}</span> — {item.message}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedNotification(item)}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-xs font-semibold"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN B: NOTIFICATION ACTIVITY (FULL SEARCH & PAGINATION) */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className={`${GLASS_CARD} p-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, message, student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchActivity()}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <select
                  value={selectedChannel}
                  onChange={(e) => {
                    setSelectedChannel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Channels</option>
                  <option value="in_app">In-App Notification</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Event Types</option>
                  <option value="FEE_ASSESSMENT_CREATED">Fee Assessment Created</option>
                  <option value="FEE_DUE_SOON">Fee Due Soon</option>
                  <option value="FEE_OVERDUE">Fee Overdue</option>
                  <option value="PAYMENT_INITIATED">Payment Initiated</option>
                  <option value="PAYMENT_SUCCESS">Payment Success</option>
                  <option value="PAYMENT_FAILED">Payment Failed</option>
                  <option value="PAYMENT_RECEIPT_AVAILABLE">Receipt Available</option>
                  <option value="CONCESSION_SUBMITTED">Concession Submitted</option>
                  <option value="CONCESSION_APPROVED">Concession Approved</option>
                  <option value="CONCESSION_REJECTED">Concession Rejected</option>
                  <option value="CONCESSION_APPLIED">Concession Applied</option>
                  <option value="COLLECTION_FOLLOW_UP_REQUIRED">Collection Follow-Up</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPage(1);
                    fetchActivity();
                  }}
                  className="flex-1 py-2 text-sm font-medium rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center gap-1.5"
                >
                  <Filter className="w-4 h-4" /> Apply Filters
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedChannel('');
                    setSelectedType('');
                    setPage(1);
                    setTimeout(fetchActivity, 0);
                  }}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition text-slate-500"
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Activity Data Table */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            {loadingActivity ? (
              <div className="py-20 text-center text-slate-400">Loading notification activity records...</div>
            ) : notifications.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-base font-semibold">No notification records matched your filters.</p>
                <p className="text-xs text-slate-500 mt-1">Try modifying your search criteria or channel selections.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th className="px-4 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Event Type</th>
                      <th className="px-4 py-3.5">Channel</th>
                      <th className="px-4 py-3.5">Delivery Status</th>
                      <th className="px-4 py-3.5">Title & Message Summary</th>
                      <th className="px-4 py-3.5 text-center">Read State</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {notifications.map((item) => (
                      <tr key={item.notification_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono text-xs border border-purple-200 dark:border-purple-800/40">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center gap-1.5 capitalize font-medium">
                            {channelIcon(item.metadata?.channel)}
                            {item.metadata?.channel || 'in_app'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{statusBadge(item.metadata?.delivery_status)}</td>
                        <td className="px-4 py-3 max-w-md text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-slate-500 dark:text-slate-400 truncate">{item.message}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                          {item.is_read ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Read</span>
                          ) : (
                            <span className="text-amber-500 font-medium">Unread</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedNotification(item)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-300"
                            >
                              Inspect
                            </button>
                            {item.metadata?.delivery_status === 'failed' && (
                              <button
                                disabled={retryingId === item.notification_id}
                                onClick={() => handleRetry(item.notification_id, item.metadata?.channel || 'in_app')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800/50 flex items-center gap-1"
                              >
                                <RefreshCw className={`w-3 h-3 ${retryingId === item.notification_id ? 'animate-spin' : ''}`} />
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN C: TEMPLATE MANAGEMENT & PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className={`${GLASS_PANEL} p-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300`}>
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Strict Template Security Contract:</span> All
              message templates utilize an allowlist variable renderer with mandatory HTML sanitization. In compliance with
              the database schema freeze, templates are securely configured through the server event catalog. Custom database
              overrides require a future schema expansion.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingTemplates ? (
              <div className="col-span-2 py-12 text-center text-slate-400">Loading templates...</div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className={`${GLASS_CARD} p-5 flex flex-col justify-between space-y-4`}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{tpl.name}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                          {tpl.eventType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {tpl.supportedChannels.map((ch) => (
                          <span
                            key={ch}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                            title={`Supports ${ch}`}
                          >
                            {channelIcon(ch)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Title Pattern:</span>
                        <p className="font-mono bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-200/60 dark:border-white/5 mt-0.5">
                          {tpl.titleTemplate}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Message Body Pattern:</span>
                        <p className="font-mono bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-200/60 dark:border-white/5 mt-0.5 text-slate-600 dark:text-slate-300">
                          {tpl.messageTemplate}
                        </p>
                      </div>
                    </div>

                    {/* Allowlisted Variables */}
                    <div className="mt-3">
                      <span className="text-xs text-slate-400 font-medium">Allowlisted Variables:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tpl.allowlistedVariables.map((v) => (
                          <span
                            key={v}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-end">
                    <button
                      onClick={() => handleOpenPreview(tpl)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview with Sample Data
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN D: CHANNEL HEALTH & CREDENTIAL INTEGRITY */}
      {/* ========================================================================= */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className={`${GLASS_PANEL} p-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300`}>
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Truthful Provider State Reporting:</span> Channel
              statuses are derived live from server environment probes. Secret credentials (API keys, webhook secrets, authentication tokens)
              are strictly excluded from client responses and masked securely.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingChannels ? (
              <div className="col-span-2 py-12 text-center text-slate-400">Probing channel health...</div>
            ) : (
              channels.map((ch) => {
                const isOperational = ch.status === 'configured_operational';
                const isConfiguredUnverified = ch.status === 'configured_unverified';
                const isMissing = ch.status === 'missing_credentials';

                return (
                  <div key={ch.channel} className={`${GLASS_CARD} p-5 space-y-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400">
                          {channelIcon(ch.channel)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">{ch.name}</h3>
                          <p className="text-xs text-slate-500">Provider: {ch.provider}</p>
                        </div>
                      </div>
                      <div>
                        {isOperational && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                          </span>
                        )}
                        {isConfiguredUnverified && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Configured (Unverified)
                          </span>
                        )}
                        {isMissing && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Missing Credentials
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs space-y-2">
                      <p className="text-slate-600 dark:text-slate-300 font-medium">{ch.message}</p>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Delivery Receipts:</span>
                          <span className="font-semibold">{ch.deliveryReceiptSupport ? 'Supported' : 'Not Supported / Ambiguous'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Persistence Target:</span>
                          <span className="font-semibold font-mono">public.notifications</span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-[11px] italic">{ch.notes}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN E: FINANCE REMINDER WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className={`${GLASS_CARD} p-6 space-y-6`}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Authorized Batch Reminder Command
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Trigger authorized fee reminders directly derived from authoritative Stage 4 Phase 8 receivables dues. Fully
                paid dues, zero balances, and future installments (for overdue reminders) are strictly excluded.
              </p>
            </div>

            {/* Filter Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reminder Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reminderType}
                  onChange={(e) => {
                    setReminderType(e.target.value as any);
                    setReminderPreview(null);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="overdue">Fee Overdue Reminder (Past Due Date)</option>
                  <option value="due_soon">Fee Due Soon Reminder (Approaching Due Date)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Grade Scope (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grade 10 or UUID"
                  value={gradeFilter}
                  onChange={(e) => {
                    setGradeFilter(e.target.value);
                    setReminderPreview(null);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Min Outstanding Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOutstanding}
                  onChange={(e) => {
                    setMinOutstanding(Number(e.target.value));
                    setReminderPreview(null);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={loadingReminderPreview}
                onClick={handlePreviewBatchReminders}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {loadingReminderPreview ? 'Analyzing Receivables...' : 'Preview Eligible Recipients (Dry Run)'}
              </button>

              {reminderPreview && reminderPreview.totalEligible > 0 && (
                <button
                  onClick={() => setConfirmSendModalOpen(true)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" /> Proceed to Dispatch ({reminderPreview.totalEligible} accounts)
                </button>
              )}
            </div>
          </div>

          {/* Dry Run Preview Summary */}
          {reminderPreview && (
            <div className={`${GLASS_CARD} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dry Run Analysis Complete
                </h3>
                <span className="text-xs text-slate-500">
                  {reminderPreview.totalEligible} eligible accounts identified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Total Eligible Accounts</div>
                  <div className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-200">
                    {reminderPreview.totalEligible}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                  <div className="text-xs font-semibold text-slate-500">Safely Skipped Accounts</div>
                  <div className="text-2xl font-bold mt-1">{reminderPreview.skippedCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Fully paid or zero balances</div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                  <div className="text-xs font-semibold text-blue-800 dark:text-blue-400">Target Event Type</div>
                  <div className="text-sm font-bold font-mono mt-1 text-blue-900 dark:text-blue-200">
                    {reminderType === 'overdue' ? 'FEE_OVERDUE' : 'FEE_DUE_SOON'}
                  </div>
                </div>
              </div>

              {reminderPreview.previewSummary?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sample Eligible Dues (First 10)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 uppercase">
                        <tr>
                          <th className="px-3 py-2">Student Name</th>
                          <th className="px-3 py-2">Admission No</th>
                          <th className="px-3 py-2">Grade</th>
                          <th className="px-3 py-2">Outstanding Amount</th>
                          <th className="px-3 py-2">Due Date</th>
                          <th className="px-3 py-2 text-right">Days Overdue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {reminderPreview.previewSummary.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{item.studentName}</td>
                            <td className="px-3 py-2 font-mono text-slate-500">{item.admissionNo}</td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.gradeName || 'N/A'}</td>
                            <td className="px-3 py-2 font-bold text-rose-600 dark:text-rose-400">
                              ₹{Number(item.outstandingAmount).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{new Date(item.dueDate).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right font-medium text-amber-600 dark:text-amber-400">
                              {item.daysOverdue} days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN F: NOTIFICATION DETAIL DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-slate-200 dark:border-white/10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Audit Record</h2>
                    <p className="text-xs text-slate-400 font-mono">{selectedNotification.notification_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Channel Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400">Event Type:</span>
                  <p className="font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {selectedNotification.type}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400">Channel / Status:</span>
                  <div className="mt-1 flex items-center gap-2">
                    {channelIcon(selectedNotification.metadata?.channel)}
                    {statusBadge(selectedNotification.metadata?.delivery_status)}
                  </div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</label>
                  <div className="mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 font-semibold text-sm">
                    {selectedNotification.title}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message Content</label>
                  <div className="mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedNotification.message}
                  </div>
                </div>
              </div>

              {/* Recipient and Link Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Recipient User ID:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {selectedNotification.recipient_user_id}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                  <span className="text-slate-400">Created At:</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {new Date(selectedNotification.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedNotification.action_url && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Action URL:</span>
                    <a
                      href={selectedNotification.action_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1"
                    >
                      {selectedNotification.action_url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {selectedNotification.metadata?.provider_message_id && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Provider Message ID:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {selectedNotification.metadata.provider_message_id}
                    </span>
                  </div>
                )}
                {selectedNotification.metadata?.correlation_id && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Correlation ID:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {selectedNotification.metadata.correlation_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Retries History */}
              {selectedNotification.metadata?.retry_history && selectedNotification.metadata.retry_history.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Retry History</h4>
                  <div className="space-y-1">
                    {selectedNotification.metadata.retry_history.map((rh, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-xs flex justify-between items-center"
                      >
                        <span className="font-medium capitalize">{rh.channel}</span>
                        <span className="text-slate-400">{new Date(rh.retried_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Close Drawer
              </button>
              <button
                disabled={retryingId === selectedNotification.notification_id}
                onClick={() =>
                  handleRetry(
                    selectedNotification.notification_id,
                    selectedNotification.metadata?.channel || 'in_app'
                  )
                }
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    retryingId === selectedNotification.notification_id ? 'animate-spin' : ''
                  }`}
                />
                Retry Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW TEMPLATE MODAL */}
      {/* ========================================================================= */}
      {previewModalOpen && activeTemplateForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Template Preview: {activeTemplateForPreview.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPreview ? (
              <div className="py-12 text-center text-slate-400">Rendering preview with allowlisted mock parameters...</div>
            ) : renderedPreview ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300">
                  <span className="font-semibold">Safe Simulation:</span> This preview is rendered purely in memory with safe
                  placeholder variables. No real messages or provider delivery records are created.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rendered Title</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold text-sm border border-slate-200/60 dark:border-white/5">
                    {renderedPreview.title}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rendered Message</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-sm border border-slate-200/60 dark:border-white/5 leading-relaxed">
                    {renderedPreview.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-rose-500 text-sm">Failed to generate template preview.</div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                Dismiss Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM BATCH SEND MODAL */}
      {/* ========================================================================= */}
      {confirmSendModalOpen && reminderPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Confirm Reminder Dispatch</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              You are about to dispatch real finance reminders to{' '}
              <strong className="text-purple-600 dark:text-purple-400 font-bold">{reminderPreview.totalEligible}</strong>{' '}
              eligible student and parent contacts for event type{' '}
              <strong className="font-mono text-xs">{reminderType === 'overdue' ? 'FEE_OVERDUE' : 'FEE_DUE_SOON'}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
              Dispatched notifications will be durably recorded in the central communication registry. Recipients will
              receive In-App alerts immediately.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                disabled={dispatchingReminders}
                onClick={() => setConfirmSendModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={dispatchingReminders}
                onClick={handleDispatchBatchReminders}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {dispatchingReminders ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Confirm & Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceNotificationCenter;

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';

export const FinanceCommunicationEscalation: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  // Create rule modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [ruleName, setRuleName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('');
  const [noResponseMinutes, setNoResponseMinutes] = useState(120);
  const [escalateToStaffId, setEscalateToStaffId] = useState('');
  const [submittingRule, setSubmittingRule] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/fees/communication/helpdesk/escalation/rules');
      setRules(res.data || []);
    } catch (err) {
      console.error('Failed to load rules:', err);
      toast.error('Failed to fetch escalation rules');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res: any = await apiClient.get('/fees/communication/helpdesk/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, [fetchRules]);

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      setEvalResult(null);
      const res: any = await apiClient.post('/fees/communication/helpdesk/escalation/evaluate');
      setEvalResult(res.data);
      toast.success(`Evaluation complete: ${res.data?.escalatedCount || 0} tickets escalated`);
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      toast.error(err.message || 'Escalation evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !escalateToStaffId.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSubmittingRule(true);
      await apiClient.post('/fees/communication/helpdesk/escalation/rules', {
        rule_name: ruleName.trim(),
        category_id: categoryId || undefined,
        priority: priority || undefined,
        no_response_after_minutes: Number(noResponseMinutes),
        escalate_to_staff_id: escalateToStaffId.trim(),
        is_active: true,
      });

      toast.success('Escalation rule created');
      setShowCreateModal(false);
      setRuleName('');
      setCategoryId('');
      setPriority('');
      setNoResponseMinutes(120);
      setEscalateToStaffId('');
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create escalation rule');
    } finally {
      setSubmittingRule(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Helpdesk Escalation Rules & SLA
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated SLAs and run escalation sweeps when requester questions exceed
            response thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Play className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            {evaluating ? 'Evaluating...' : 'Run Escalation Sweep'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Sweep Result Banner */}
      {evalResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Escalation Sweep Finished
              </p>
              <p className="text-emerald-700 dark:text-emerald-300">
                Audited {evalResult.evaluatedTickets} active tickets. Escalated{' '}
                {evalResult.escalatedCount} ticket(s) with notifications dispatched.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEvalResult(null)}
            className="text-emerald-700 hover:text-emerald-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rules Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading escalation rules...</div>
      ) : rules.length === 0 ? (
        <div className={`${GLASS_CARD} p-12 text-center`}>
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No escalation rules defined
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create an escalation rule to automatically escalate unattended student or parent
            inquiries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((r) => (
            <div key={r.escalation_rule_id} className={`${GLASS_CARD} p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {r.rule_name}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    r.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-medium">
                    {r.helpdesk_categories?.category_name || 'All Categories'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Priority:</span>
                  <span className="font-medium capitalize">{r.priority || 'Any Priority'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Response Threshold:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {r.no_response_after_minutes} mins (
                    {Math.round(r.no_response_after_minutes / 60)} hrs)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Escalate To Staff:</span>
                  <span className="font-mono text-[11px] truncate max-w-[150px]">
                    {r.staff?.employee_code || r.escalate_to_staff_id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Add Escalation Rule
            </h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  placeholder="e.g. Urgent Billing Inquiry SLA"
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority (Optional)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <option value="">Any Priority</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No Response After (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={noResponseMinutes}
                    onChange={(e) => setNoResponseMinutes(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Escalate to Staff ID *
                  </label>
                  <input
                    type="text"
                    value={escalateToStaffId}
                    onChange={(e) => setEscalateToStaffId(e.target.value)}
                    required
                    placeholder="Staff UUID"
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRule}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {submittingRule ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCommunicationEscalation;

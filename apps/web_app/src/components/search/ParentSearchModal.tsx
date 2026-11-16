import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Loader2,
  GraduationCap,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { setSelectedChildId } from '@/shared/store/parentPortalSlice';
import ParentDashboardService from '@/modules/dashboard/services/ParentDashboardService';
import DashboardSearchService from '@/modules/dashboard/services/DashboardSearchService';
import { cn } from '@/lib/utils';

export interface ParentSearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'student' | 'application' | 'fee';
  categoryLabel: 'Student' | 'Application' | 'Fee';
  href: string;
  childId?: string;
  badge?: string;
}

export interface ParentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PARENT_RECENT_SEARCH_KEY = 'edutrack_parent_recent_searches_v2';
const MAX_RECENT = 5;

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All Results' },
  { id: 'student', label: 'Students' },
  { id: 'application', label: 'Applications' },
  { id: 'fee', label: 'Fees' },
] as const;

export const ParentSearchModal: React.FC<ParentSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'student' | 'application' | 'fee'>(
    'all',
  );
  const [results, setResults] = useState<ParentSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<ParentSearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PARENT_RECENT_SEARCH_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore read errors
    }
  }, [isOpen]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search logic across Students, Applications, Fees, and Dashboard search
  const executeSearch = useCallback(async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = term.toLowerCase();
    const collected: ParentSearchResultItem[] = [];
    const seenIds = new Set<string>();

    try {
      const [overviewData, feesData, backendSearchResults] = await Promise.all([
        ParentDashboardService.getOverview().catch(() => null),
        ParentDashboardService.getMyFees().catch(() => null),
        DashboardSearchService.querySearch(term).catch(() => []),
      ]);

      // A. Match Enrolled Students / Linked Children
      const rawChildren = Array.isArray(overviewData?.children) ? overviewData.children : [];
      rawChildren.forEach((c: any) => {
        const fullName = (c.full_name || `${c.first_name || ''} ${c.last_name || ''}`).trim();
        const admNo = c.admission_no || '';
        const gradeName = c.current_enrollment?.grade_name || c.grade_name || '';
        const sectionName = c.current_enrollment?.section_name || c.section_name || '';

        const isMatch =
          fullName.toLowerCase().includes(q) ||
          admNo.toLowerCase().includes(q) ||
          gradeName.toLowerCase().includes(q) ||
          sectionName.toLowerCase().includes(q) ||
          q === 'student' ||
          q === 'child' ||
          q === 'children';

        if (isMatch && c.student_id && !seenIds.has(`student-${c.student_id}`)) {
          seenIds.add(`student-${c.student_id}`);
          collected.push({
            id: `student-${c.student_id}`,
            title: fullName || 'Enrolled Student',
            subtitle: `Grade ${gradeName || 'Enrolled'}${sectionName ? ` · Section ${sectionName}` : ''}${admNo ? ` · ADM: ${admNo}` : ''}`,
            category: 'student',
            categoryLabel: 'Student',
            href: `/app/parent/children?childId=${c.student_id}`,
            childId: c.student_id,
            badge: gradeName || 'Active',
          });
        }
      });

      // B. Match Admission Applications
      const rawAdmissions = Array.isArray(overviewData?.admissions) ? overviewData.admissions : [];
      rawAdmissions.forEach((a: any) => {
        const studentName = a.student_name || 'Applicant';
        const appNo = a.application_number || a.id || '';
        const grade = a.grade_applied_for || a.grade_name || '';
        const status = a.status || a.completion_status || 'Submitted';

        const isMatch =
          studentName.toLowerCase().includes(q) ||
          appNo.toLowerCase().includes(q) ||
          grade.toLowerCase().includes(q) ||
          status.toLowerCase().includes(q) ||
          q === 'application' ||
          q === 'admission' ||
          q === 'admissions';

        const appId = a.application_id || a.id;
        if (isMatch && appId && !seenIds.has(`app-${appId}`)) {
          seenIds.add(`app-${appId}`);
          collected.push({
            id: `app-${appId}`,
            title: `${studentName} (${appNo})`,
            subtitle: `Grade: ${grade || 'Applied'} · Status: ${status}`,
            category: 'application',
            categoryLabel: 'Application',
            href: `/app/parent/documents?applicationId=${appId}`,
            badge: status,
          });
        }
      });

      // C. Match Fee Records, Dues, and Receipts
      const rawFeeRecords = Array.isArray(feesData)
        ? feesData
        : Array.isArray(feesData?.children)
          ? feesData.children
          : [];

      rawFeeRecords.forEach((f: any) => {
        const studentName = f.full_name || 'Student';
        const structName = f.fee_structure_name || 'Academic Fee Structure';

        const isFeeKeyword =
          q === 'fee' ||
          q === 'fees' ||
          q === 'dues' ||
          q === 'receipt' ||
          q === 'receipts' ||
          q === 'payment' ||
          q === 'ledger' ||
          q === 'statement' ||
          structName.toLowerCase().includes(q) ||
          studentName.toLowerCase().includes(q);

        if (isFeeKeyword && f.student_id && !seenIds.has(`fee-summary-${f.student_id}`)) {
          seenIds.add(`fee-summary-${f.student_id}`);
          const outstanding = Number(f.summary?.outstanding_balance ?? f.summary?.balance ?? 0);
          collected.push({
            id: `fee-summary-${f.student_id}`,
            title: `${structName} (${studentName})`,
            subtitle: `Outstanding: ₹${outstanding.toLocaleString('en-IN')} · Official Fee Ledger`,
            category: 'fee',
            categoryLabel: 'Fee',
            href: `/app/parent/fees?childId=${f.student_id}`,
            childId: f.student_id,
            badge: outstanding > 0 ? 'Due Pending' : 'Fully Settled',
          });
        }

        // Match Installment Dues
        if (Array.isArray(f.dues)) {
          f.dues.forEach((d: any, idx: number) => {
            const dueName = d.installment_name || d.fee_head_name || 'Installment Due';
            const dueMatch =
              dueName.toLowerCase().includes(q) ||
              (isFeeKeyword && Number(d.outstanding_amount || 0) > 0);

            const dueId = `due-${f.student_id}-${d.id || idx}`;
            if (dueMatch && !seenIds.has(dueId)) {
              seenIds.add(dueId);
              collected.push({
                id: dueId,
                title: `${dueName} (${studentName})`,
                subtitle: `Amount Due: ₹${Number(d.outstanding_amount || 0).toLocaleString('en-IN')}${d.due_date ? ` · Due: ${d.due_date}` : ''}`,
                category: 'fee',
                categoryLabel: 'Fee',
                href: `/app/parent/fees?childId=${f.student_id}`,
                childId: f.student_id,
                badge: d.is_overdue ? 'Overdue' : 'Installment',
              });
            }
          });
        }

        // Match Receipts
        if (Array.isArray(f.transactions)) {
          f.transactions.forEach((t: any) => {
            const rcptNo = t.receipt_number || t.transaction_id || '';
            const rcptMatch =
              rcptNo.toLowerCase().includes(q) || q === 'receipt' || q === 'receipts';

            const rcptId = `rcpt-${t.id || rcptNo}`;
            if (rcptMatch && rcptNo && !seenIds.has(rcptId)) {
              seenIds.add(rcptId);
              collected.push({
                id: rcptId,
                title: `Official Receipt #${rcptNo} (${studentName})`,
                subtitle: `Amount: ₹${Number(t.amount || 0).toLocaleString('en-IN')}${t.payment_date ? ` · Date: ${t.payment_date}` : ''}`,
                category: 'fee',
                categoryLabel: 'Fee',
                href: `/app/parent/fees?childId=${f.student_id}`,
                childId: f.student_id,
                badge: 'Confirmed',
              });
            }
          });
        }
      });

      // D. Integrate Backend Search Results
      if (Array.isArray(backendSearchResults)) {
        backendSearchResults.forEach((item: any) => {
          const type = (item.type || '').toLowerCase();
          if (type.includes('student') && !seenIds.has(`backend-stu-${item.id}`)) {
            seenIds.add(`backend-stu-${item.id}`);
            collected.push({
              id: `backend-stu-${item.id}`,
              title: item.title,
              subtitle: item.subtitle,
              category: 'student',
              categoryLabel: 'Student',
              href: `/app/parent/children`,
              badge: 'Student',
            });
          } else if (type.includes('admission') && !seenIds.has(`backend-adm-${item.id}`)) {
            seenIds.add(`backend-adm-${item.id}`);
            collected.push({
              id: `backend-adm-${item.id}`,
              title: item.title,
              subtitle: item.subtitle,
              category: 'application',
              categoryLabel: 'Application',
              href: `/app/admissions/status`,
              badge: 'Admission',
            });
          }
        });
      }

      setResults(collected);
    } catch (err) {
      console.error('[ParentSearchModal] Search execution error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query);
    }, 220);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  // Filtered by active category
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') return results;
    return results.filter((r) => r.category === activeCategory);
  }, [results, activeCategory]);

  // Handle result selection and navigation
  const handleSelectResult = useCallback(
    (item: ParentSearchResultItem) => {
      // If result is tied to a specific child, activate that child context in Redux
      if (item.childId) {
        dispatch(setSelectedChildId(item.childId));
      }

      // Update recent searches in localStorage
      const updated = [item, ...recentSearches.filter((r) => r.id !== item.id)].slice(
        0,
        MAX_RECENT,
      );
      try {
        localStorage.setItem(PARENT_RECENT_SEARCH_KEY, JSON.stringify(updated));
      } catch {
        // Ignore write failures
      }
      setRecentSearches(updated);

      // Navigate and close
      navigate(item.href);
      onClose();
    },
    [dispatch, navigate, onClose, recentSearches],
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Parent Portal Search Modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-popover/95 backdrop-blur-2xl text-popover-foreground border border-border/80 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-border/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Search Input Header ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-card/60">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search applications, fees, students..."
            className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none"
          />

          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              title="Clear input"
              aria-label="Clear input"
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close search modal (Esc)"
            aria-label="Close search modal"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer border border-border/50 hover:border-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Category Filter Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/60 bg-muted/20 overflow-x-auto scrollbar-none">
          {SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id as any);
                setSelectedIndex(0);
              }}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none shrink-0',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
              )}
            >
              {cat.label}
              {cat.id !== 'all' && (
                <span className="ml-1.5 opacity-70 font-mono text-[10px]">
                  ({results.filter((r) => r.category === cat.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Results Container ────────────────────────────────────────────── */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Query Empty: Show Quick Suggestions and Recent Searches */}
          {query.trim().length === 0 && (
            <div className="p-3 space-y-4">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem(PARENT_RECENT_SEARCH_KEY);
                        setRecentSearches([]);
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left hover:bg-muted/60 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60">
                          {item.categoryLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Jump Suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 px-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Suggested for Parents</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/app/parent/children');
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-border/70 hover:border-primary/50 bg-card/60 hover:bg-muted/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <GraduationCap className="w-4 h-4" />
                      <span>My Children</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      Profiles, timetable, progress
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/app/parent/fees');
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-border/70 hover:border-primary/50 bg-card/60 hover:bg-muted/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <CreditCard className="w-4 h-4" />
                      <span>Fee Ledger</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      Installments, dues, receipts
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/app/parent/documents');
                      onClose();
                    }}
                    className="p-3 rounded-xl border border-border/70 hover:border-primary/50 bg-card/60 hover:bg-muted/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                      <FileText className="w-4 h-4" />
                      <span>Applications</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      Admissions & certificates
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty Search Results State */}
          {query.trim().length > 0 && !isLoading && filteredResults.length === 0 && (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No matching records found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No applications, fees, or student records matched &quot;{query}&quot;. Try checking
                student names, application numbers, or fee installments.
              </p>
            </div>
          )}

          {/* Search Results List */}
          {filteredResults.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const CategoryIcon =
              item.category === 'student'
                ? GraduationCap
                : item.category === 'application'
                  ? FileText
                  : CreditCard;

            const categoryStyle =
              item.category === 'student'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : item.category === 'application'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelectResult(item)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <CategoryIcon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'text-xs truncate',
                          isSelected
                            ? 'text-primary-foreground font-black'
                            : 'text-foreground font-bold',
                        )}
                      >
                        {item.title}
                      </p>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
                            isSelected
                              ? 'bg-primary-foreground/20 text-primary-foreground border-transparent'
                              : categoryStyle,
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-[11px] truncate mt-0.5',
                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded',
                      isSelected
                        ? 'text-primary-foreground/80 bg-primary-foreground/10'
                        : 'text-muted-foreground bg-muted/60',
                    )}
                  >
                    {item.categoryLabel}
                  </span>
                  <ArrowRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      isSelected
                        ? 'text-primary-foreground translate-x-1'
                        : 'text-muted-foreground opacity-50',
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-t border-border/60 text-[11px] text-muted-foreground select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span>Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background rounded border border-border/70 text-[10px] font-mono shadow-2xs">
              ESC
            </kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ParentSearchModal;

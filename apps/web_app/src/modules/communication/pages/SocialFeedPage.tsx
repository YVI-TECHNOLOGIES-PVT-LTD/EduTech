import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Users,
  GraduationCap,
  Heart,
  School,
  X,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import { useAppSelector } from '../../../app/store';
import { ParentDashboardService } from '../../dashboard/services/ParentDashboardService';
import { FeedPost, ReactionType, EnrolledChild } from '../types';
import { SocialFeedCard } from '../components/SocialFeedCard';
import { SocialFeedSkeleton } from '../components/SocialFeedSkeleton';
import { SocialFeedRightSidebar } from '../components/SocialFeedRightSidebar';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal';
import { toast } from 'sonner';

export const SocialFeedPage: React.FC = () => {
  const { user } = useAuth();
  const tenantName = useAppSelector((state) => state.tenant.tenantName) || 'Greenwood High School';

  // Role extraction
  const rawRoles = (user?.roles || []).map((r: string) =>
    String(r)
      .toUpperCase()
      .replace(/[\s-]+/g, '_'),
  );

  const isManagement = rawRoles.some((r) =>
    [
      'ADMIN',
      'ADMINISTRATOR',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );
  const isTeacher = rawRoles.some((r) => ['TEACHER', 'FACULTY'].includes(r));
  const isFinance = rawRoles.some((r) =>
    ['FINANCE', 'FINANCE_OFFICER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'BURSAR'].includes(r),
  );
  const isFrontOffice = rawRoles.some((r) =>
    [
      'FRONT_OFFICE',
      'FO',
      'RECEPTIONIST',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
    ].includes(r),
  );
  const isStaff =
    isManagement ||
    isTeacher ||
    isFinance ||
    isFrontOffice ||
    rawRoles.some((r) => ['STAFF', 'EMPLOYEE'].includes(r));
  const isParent = rawRoles.some((r) => ['PARENT', 'GUARDIAN'].includes(r)) || !isStaff;

  // State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<EnrolledChild[]>([]);
  const [reactionCatalog, setReactionCatalog] = useState<ReactionType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch reaction catalog
  const fetchReactionCatalog = useCallback(async () => {
    try {
      const res: any = await apiClient.get('/communication/reactions/catalog');
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      if (list.length > 0) {
        setReactionCatalog(list);
      }
    } catch (err) {
      console.error('Failed to load reaction catalog:', err);
    }
  }, []);

  // Fetch enrolled children for parents
  const fetchChildren = useCallback(async () => {
    if (!isParent) return;
    try {
      const overview = await ParentDashboardService.getOverview();
      if (overview?.children && Array.isArray(overview.children)) {
        setChildrenList(overview.children);
      }
    } catch {
      // Non-critical if overview is inaccessible
    }
  }, [isParent]);

  // Fetch feed posts
  const fetchPosts = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const query = filterType !== 'all' ? `?feed_type=${filterType}` : '';
        const res: any = await apiClient.get(`/communication/feeds${query}`);

        const list = Array.isArray(res.data?.posts)
          ? res.data.posts
          : Array.isArray(res.data?.data?.posts)
            ? res.data.data.posts
            : Array.isArray(res.data?.data)
              ? res.data.data
              : Array.isArray(res.data)
                ? res.data
                : [];

        setPosts(list);
      } catch (err: any) {
        console.error('Failed to fetch posts:', err);
        toast.error('Failed to load school feed updates');
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterType],
  );

  useEffect(() => {
    fetchReactionCatalog();
    fetchChildren();
  }, [fetchReactionCatalog, fetchChildren]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle adding / changing reaction with optimistic update
  const handleReact = async (postId: string, reactionTypeId: string) => {
    // Save previous state for rollback
    const prevPosts = [...posts];

    // Find the reaction metadata
    const selectedReaction = reactionCatalog.find(
      (r) => (r.reactionTypeId || r.reaction_type_id) === reactionTypeId,
    );

    // Optimistic UI update
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.feed_post_id !== postId) return p;

        const currentReactionId = p.currentUserReaction;
        const currentSummary = [...(p.reactionSummary || [])];

        // Decrement previous reaction count if any
        if (currentReactionId) {
          const oldIndex = currentSummary.findIndex((r) => r.reactionTypeId === currentReactionId);
          if (oldIndex >= 0) {
            currentSummary[oldIndex] = {
              ...currentSummary[oldIndex],
              count: Math.max(0, currentSummary[oldIndex].count - 1),
            };
          }
        }

        // Increment new reaction count
        if (selectedReaction) {
          const newIndex = currentSummary.findIndex((r) => r.reactionTypeId === reactionTypeId);
          if (newIndex >= 0) {
            currentSummary[newIndex] = {
              ...currentSummary[newIndex],
              count: currentSummary[newIndex].count + 1,
            };
          } else {
            currentSummary.push({
              reactionTypeId,
              reactionCode:
                selectedReaction.reactionCode || selectedReaction.reaction_code || 'like',
              reactionLabel:
                selectedReaction.reactionLabel || selectedReaction.reaction_label || 'Like',
              emoji: selectedReaction.emoji,
              count: 1,
            });
          }
        }

        return {
          ...p,
          currentUserReaction: reactionTypeId,
          reactionSummary: currentSummary.filter((r) => r.count > 0),
        };
      }),
    );

    try {
      await apiClient.put(`/communication/feeds/${postId}/reaction`, {
        reactionTypeId,
        reaction_type_id: reactionTypeId,
      });
    } catch (err: any) {
      console.error('Failed to react:', err);
      toast.error('Could not save reaction');
      // Rollback on failure
      setPosts(prevPosts);
    }
  };

  // Handle removing reaction with optimistic update
  const handleRemoveReaction = async (postId: string) => {
    const prevPosts = [...posts];

    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.feed_post_id !== postId) return p;

        const currentReactionId = p.currentUserReaction;
        const currentSummary = [...(p.reactionSummary || [])];

        if (currentReactionId) {
          const oldIndex = currentSummary.findIndex((r) => r.reactionTypeId === currentReactionId);
          if (oldIndex >= 0) {
            currentSummary[oldIndex] = {
              ...currentSummary[oldIndex],
              count: Math.max(0, currentSummary[oldIndex].count - 1),
            };
          }
        }

        return {
          ...p,
          currentUserReaction: null,
          reactionSummary: currentSummary.filter((r) => r.count > 0),
        };
      }),
    );

    try {
      await apiClient.delete(`/communication/feeds/${postId}/reaction`);
    } catch (err: any) {
      console.error('Failed to remove reaction:', err);
      toast.error('Could not remove reaction');
      setPosts(prevPosts);
    }
  };

  // Staff action: Publish draft
  const handlePublishDraft = async (postId: string) => {
    try {
      await apiClient.post(`/communication/feeds/${postId}/publish`);
      toast.success('Announcement published successfully');
      fetchPosts(true);
    } catch (err: any) {
      console.error('Failed to publish post:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to publish');
    }
  };

  // Staff action: Remove post
  const handleRemovePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await apiClient.delete(`/communication/feeds/${postId}`);
      toast.success('Announcement removed');
      fetchPosts(true);
    } catch (err: any) {
      console.error('Failed to remove post:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to remove');
    }
  };

  // Selected child filter matching
  const selectedChild = useMemo(() => {
    if (!selectedChildId) return null;
    return childrenList.find((c) => c.student_id === selectedChildId) || null;
  }, [selectedChildId, childrenList]);

  // Filter posts by search query and selected child
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.author?.name?.toLowerCase().includes(q),
      );
    }

    // Child context filter (if selected)
    if (selectedChild) {
      result = result.filter((p) => {
        // School-wide & all parents posts apply to all children
        if (
          p.audienceScope === 'organization' ||
          p.audience_scope === 'organization' ||
          p.audienceScope === 'all_parents' ||
          p.audience_scope === 'all_parents'
        ) {
          return true;
        }

        // Targeted directly to this child
        if (p.studentTargets?.some((st) => st.studentId === selectedChild.student_id)) {
          return true;
        }

        // Targeted to this child's grade or section name
        if (
          selectedChild.grade &&
          p.academicYearGradeTargets?.some(
            (gt) => gt.gradeName?.toLowerCase() === selectedChild.grade?.toLowerCase(),
          )
        ) {
          return true;
        }

        return false;
      });
    }

    return result;
  }, [posts, searchQuery, selectedChild]);

  // Tab definitions
  const tabs = [
    { id: 'all', label: 'All Feeds', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'parent', label: 'Parent Bulletins', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'classroom', label: 'Classroom Updates', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'student', label: 'Student Honors', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    ...(isStaff
      ? [
          {
            id: 'staff_community',
            label: 'Staff Community',
            icon: <School className="w-3.5 h-3.5" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── PAGE HEADER & BANNER ────────────────────────────── */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  School Community Feeds
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Follow official announcements, classroom updates, and community activities.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => fetchPosts(true)}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs focus:outline-none"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all select-none"
              >
                <Plus className="w-4 h-4" />
                <span>New Announcement</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── FILTER TABS & SEARCH BAR ────────────────────────── */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Child Filter Notification Badge */}
        {selectedChild && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                Showing announcements tailored for{' '}
                <strong>
                  {selectedChild.first_name} {selectedChild.last_name}
                </strong>{' '}
                ({selectedChild.grade ? `Grade ${selectedChild.grade}` : 'Enrolled Student'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedChildId(null)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              Show all announcements
            </button>
          </div>
        )}

        {/* ─── MAIN RESPONSIVE GRID (DESKTOP 3-COL, MOBILE 1-COL) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CENTER COLUMN: SOCIAL FEED STREAM */}
          <main className="lg:col-span-8 space-y-4">
            {loading ? (
              <SocialFeedSkeleton />
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  No announcements found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No updates matching "${searchQuery}". Try a different search keyword.`
                    : 'There are no announcements in this channel at the moment. Please check back later.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <SocialFeedCard
                  key={post.feed_post_id}
                  post={post}
                  reactionCatalog={reactionCatalog}
                  isStaff={isStaff}
                  onReact={handleReact}
                  onRemoveReaction={handleRemoveReaction}
                  onPublishDraft={isStaff ? handlePublishDraft : undefined}
                  onRemovePost={isStaff ? handleRemovePost : undefined}
                />
              ))
            )}
          </main>

          {/* RIGHT COLUMN: INSTITUTIONAL & COMMUNITY CONTEXT */}
          <div className="hidden lg:block lg:col-span-4 sticky top-6">
            <SocialFeedRightSidebar
              tenantName={tenantName}
              isParent={isParent}
              childrenList={childrenList}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
              reactionCatalog={reactionCatalog}
              posts={posts}
            />
          </div>
        </div>
      </div>

      {/* Staff Announcement Creation Modal */}
      {isStaff && (
        <CreateAnnouncementModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchPosts(true)}
          isTeacher={isTeacher}
        />
      )}
    </div>
  );
};

export default SocialFeedPage;

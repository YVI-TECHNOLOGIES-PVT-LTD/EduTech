import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface FeedAuthor {
  userId: string;
  name: string;
  email?: string;
}

export interface ReactionSummaryItem {
  reactionTypeId: string;
  reaction_type_id: string;
  code: string;
  emoji?: string;
  label?: string;
  count: number;
}

export interface FeedPost {
  feedPostId: string;
  feed_post_id: string;
  orgId: string;
  org_id: string;
  feedType: 'parent' | 'classroom' | 'student' | 'staff_community';
  feed_type: 'parent' | 'classroom' | 'student' | 'staff_community';
  audienceScope:
    | 'organization'
    | 'all_parents'
    | 'selected_academic_groups'
    | 'staff_only'
    | 'selected_students';
  audience_scope: string;
  title?: string;
  content: string;
  status: 'draft' | 'published' | 'removed';
  author: FeedAuthor;
  publishedAt?: string | null;
  published_at?: string | null;
  createdAt: string;
  created_at: string;
  commentsEnabled: boolean;
  comments_enabled: boolean;
  reactionsEnabled: boolean;
  reactions_enabled: boolean;
  academicYearGradeTargets?: Array<{ academicYearGradeId: string; gradeName?: string }>;
  sectionTargets?: Array<{ sectionId: string; sectionName?: string }>;
  studentTargets?: Array<{ studentId: string }>;
  reactionSummary: ReactionSummaryItem[];
  currentUserReaction?: string | null;
  commentCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
}

export interface FeedComment {
  commentId: string;
  feed_comment_id: string;
  feedPostId: string;
  content: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedReactionType {
  reactionTypeId: string;
  reaction_type_id: string;
  code: string;
  label: string;
  emoji: string;
  displayOrder: number;
}

export const communicationApi = {
  getFeeds: async (params?: { feed_type?: string; page?: number; limit?: number }) => {
    return apiClient.get<{ success: boolean; data: FeedPost[]; total?: number }>(
      ENDPOINTS.COMMUNICATION.FEEDS,
      { params },
    );
  },
  getPostById: async (postId: string) => {
    return apiClient.get<{ success: boolean; data: FeedPost }>(
      ENDPOINTS.COMMUNICATION.FEED_BY_ID(postId),
    );
  },
  getReactionCatalog: async (postId: string) => {
    return apiClient.get<{ success: boolean; data: FeedReactionType[] }>(
      ENDPOINTS.COMMUNICATION.REACTIONS_CATALOG(postId),
    );
  },
  reactToPost: async (postId: string, reactionTypeId: string) => {
    return apiClient.put<{ success: boolean; data: any }>(ENDPOINTS.COMMUNICATION.REACT(postId), {
      reactionTypeId,
      reaction_type_id: reactionTypeId,
    });
  },
  getComments: async (postId: string) => {
    return apiClient.get<{ success: boolean; data: FeedComment[] }>(
      ENDPOINTS.COMMUNICATION.COMMENTS(postId),
    );
  },
  addComment: async (postId: string, content: string) => {
    return apiClient.post<{ success: boolean; data: FeedComment }>(
      ENDPOINTS.COMMUNICATION.COMMENTS(postId),
      { comment: content, content },
    );
  },
  deleteComment: async (commentId: string) => {
    return apiClient.delete<{ success: boolean }>(
      ENDPOINTS.COMMUNICATION.DELETE_COMMENT(commentId),
    );
  },
};

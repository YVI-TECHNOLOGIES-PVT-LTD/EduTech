import {
  communication_feed_type,
  communication_audience_scope,
  feed_post_status,
} from '@prisma/client';

export interface CreateAnnouncementDto {
  feedType?: communication_feed_type;
  feed_type?: communication_feed_type;
  audienceScope?: communication_audience_scope;
  audience_scope?: communication_audience_scope;
  title?: string;
  content: string;
  status?: feed_post_status;
  commentsEnabled?: boolean;
  comments_enabled?: boolean;
  reactionsEnabled?: boolean;
  reactions_enabled?: boolean;
  academicYearGradeIds?: string[];
  academic_year_grade_ids?: string[];
  sectionIds?: string[];
  section_ids?: string[];
  studentIds?: string[];
  student_ids?: string[];
  studentTargets?: Array<{ studentId: string }>;
  allowedReactionTypeIds?: string[];
  allowed_reaction_type_ids?: string[];
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  commentsEnabled?: boolean;
  comments_enabled?: boolean;
  reactionsEnabled?: boolean;
  reactions_enabled?: boolean;
  academicYearGradeIds?: string[];
  academic_year_grade_ids?: string[];
  sectionIds?: string[];
  section_ids?: string[];
  studentIds?: string[];
  student_ids?: string[];
  studentTargets?: Array<{ studentId: string }>;
}

export interface ListFeedsQuery {
  feedType?: communication_feed_type;
  feed_type?: communication_feed_type;
  audienceScope?: communication_audience_scope;
  audience_scope?: communication_audience_scope;
  academicYearId?: string;
  academic_year_id?: string;
  status?: feed_post_status | 'all';
  page?: number | string;
  limit?: number | string;
}

export interface AddCommentDto {
  content?: string;
  comment?: string;
}

export interface ReactPostDto {
  reactionTypeId?: string;
  reaction_type_id?: string;
}

export interface ReactionSummaryItem {
  reactionTypeId: string;
  reactionCode: string;
  reactionLabel: string;
  emoji: string;
  count: number;
}

export interface FeedAuthorDto {
  userId: string;
  name: string;
  email?: string;
}

export interface FeedPostResponseDto {
  feedPostId: string;
  feed_post_id: string;
  orgId: string;
  org_id: string;
  feedType: communication_feed_type;
  feed_type: communication_feed_type;
  audienceScope: communication_audience_scope;
  audience_scope: communication_audience_scope;
  title: string | null;
  content: string;
  status: feed_post_status;
  author: FeedAuthorDto;
  publishedAt: string | null;
  published_at: string | null;
  createdAt: string;
  created_at: string;
  commentsEnabled: boolean;
  comments_enabled: boolean;
  reactionsEnabled: boolean;
  reactions_enabled: boolean;
  academicYearGradeTargets: Array<{ academicYearGradeId: string; gradeName?: string }>;
  sectionTargets: Array<{ sectionId: string; sectionName?: string }>;
  studentTargets: Array<{ studentId: string }>;
  reactionSummary: ReactionSummaryItem[];
  currentUserReaction: string | null;
  commentCount: number;
}

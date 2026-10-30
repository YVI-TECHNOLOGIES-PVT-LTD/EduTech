export interface ReactionType {
  reactionTypeId: string;
  reaction_type_id?: string;
  reactionCode: string;
  reaction_code?: string;
  reactionLabel: string;
  reaction_label?: string;
  emoji: string;
  displayOrder?: number;
}

export interface ReactionSummaryItem {
  reactionTypeId: string;
  reactionCode: string;
  reactionLabel: string;
  emoji: string;
  count: number;
}

export interface PostAuthor {
  userId: string;
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface AcademicGradeTarget {
  academicYearGradeId: string;
  gradeName?: string;
}

export interface SectionTarget {
  sectionId: string;
  sectionName?: string;
}

export interface StudentTarget {
  studentId: string;
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
    | 'selected_students'
    | 'staff_only';
  audience_scope:
    | 'organization'
    | 'all_parents'
    | 'selected_academic_groups'
    | 'selected_students'
    | 'staff_only';
  title: string | null;
  content: string;
  status: 'draft' | 'published' | 'removed';
  author: PostAuthor;
  publishedAt: string | null;
  published_at: string | null;
  createdAt: string;
  created_at: string;
  commentsEnabled: boolean;
  comments_enabled: boolean;
  reactionsEnabled: boolean;
  reactions_enabled: boolean;
  academicYearGradeTargets: AcademicGradeTarget[];
  sectionTargets: SectionTarget[];
  studentTargets: StudentTarget[];
  reactionSummary: ReactionSummaryItem[];
  currentUserReaction: string | null; // reactionTypeId
  commentCount: number;
}

export interface FeedComment {
  commentId: string;
  feed_comment_id?: string;
  feedPostId: string;
  content: string;
  createdAt: string;
  author: {
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
}

export interface EnrolledChild {
  student_id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  section?: string;
  admission_number?: string;
  academic_year_grade_id?: string;
  section_id?: string;
}

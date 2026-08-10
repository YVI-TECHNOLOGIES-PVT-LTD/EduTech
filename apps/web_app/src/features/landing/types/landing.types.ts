export interface AnnouncementConfig {
  id: string;
  academicYear: string;
  message: string;
  badgeText?: string;
  ctaText?: string;
  ctaLink?: string;
  isDismissible?: boolean;
}

export interface NavSubItem {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  badge?: string;
}

export interface NavCategory {
  key: string;
  label: string;
  href?: string;
  items?: NavSubItem[];
}

export interface TrustMetric {
  id: string;
  value: string;
  label: string;
  description?: string;
  iconName?: string;
}

export interface FeatureHighlight {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge?: string;
  linkText?: string;
  linkHref?: string;
}

export interface AcademicStage {
  id: string;
  title: string;
  grades: string;
  ageRange: string;
  tagline: string;
  description: string;
  highlights: string[];
  color: string;
  icon: string;
  image?: string;
}

export interface JourneyStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}

export interface CampusMediaItem {
  id: string;
  title: string;
  category: 'lab' | 'sports' | 'arts' | 'library' | 'classroom' | 'events';
  imageUrl: string;
  aspectRatio?: string;
  caption: string;
  tags?: string[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: 'parent' | 'alumni' | 'educator' | 'student';
  subtitle?: string;
  avatarUrl?: string;
  rating: number;
  gradeOrYear?: string;
}

export interface QuickEnquiryPayload {
  parentName: string;
  email: string;
  phone: string;
  studentGrade: string;
  academicYear?: string;
  notes?: string;
}

export interface QuickEnquiryResponse {
  success: boolean;
  reference: string;
  message: string;
}

export interface EduAIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: { label: string; actionKey: string }[];
}

export interface EduAIInput {
  message: string;
  sessionId?: string;
  contextGrade?: string;
}

export interface EduAIResponse {
  sessionId: string;
  reply: string;
  suggestedPrompts?: string[];
  referenceLinks?: { title: string; href: string }[];
}

export interface IEduAIService {
  sendMessage(input: EduAIInput): Promise<EduAIResponse>;
  getInitialState(): Promise<{ greeting: string; suggestedPrompts: string[] }>;
}

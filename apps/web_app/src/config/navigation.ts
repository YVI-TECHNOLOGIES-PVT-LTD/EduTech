import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderCheck,
  CreditCard,
  CheckCircle2,
  User,
  Users,
  ClipboardList,
  GraduationCap,
  Settings,
  PhoneCall,
  Calendar,
  UserCheck,
  BarChart3,
  Sparkles,
  Receipt,
  Scale,
  Clock,
  CheckSquare,
  BookOpen,
  Activity,
  Award,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon?: any;
  badge?: string;
  items?: NavigationItem[];
  children?: NavigationItem[];
  roles?: string[];
  permission?: string;
  permissions?: string[];
}

export interface NavigationGroup {
  id: string;
  title: string;
  contextLabel?: string;
  items: NavigationItem[];
  roles?: string[];
  permission?: string;
}

export const PARENT_NAVIGATION: NavigationGroup[] = [
  {
    id: 'parent_main',
    title: 'Admissions Portal',
    contextLabel: 'PARENT PORTAL',
    items: [
      {
        id: 'p_dashboard',
        title: 'Dashboard',
        url: '/app/admissions/dashboard',
        icon: LayoutDashboard,
      },
      { id: 'p_my', title: 'My Applications', url: '/app/admissions/my', icon: FileText },
      { id: 'p_wizard', title: 'New Application', url: '/app/admissions/wizard', icon: PlusCircle },
      {
        id: 'p_docs',
        title: 'Document Center',
        url: '/app/admissions/documents',
        icon: FolderCheck,
      },
      { id: 'p_fees', title: 'Fee Payment', url: '/app/parent/fees', icon: CreditCard },
      {
        id: 'p_status',
        title: 'Admission Status',
        url: '/app/admissions/status',
        icon: CheckCircle2,
      },
    ],
  },
];

export const FRONT_OFFICE_NAVIGATION: NavigationGroup[] = [
  {
    id: 'front_office_main',
    title: 'Front Office Workspace',
    contextLabel: 'FRONT OFFICE',
    items: [
      { id: 'fo_dashboard', title: 'Dashboard', url: '/app/workspace', icon: LayoutDashboard },
      {
        id: 'fo_admissions',
        title: 'Admissions',
        icon: ClipboardList,
        url: '/app/admissions/applications',
        items: [
          {
            id: 'fo_enquiries',
            title: 'Enquiries & Leads',
            url: '/app/admissions/inquiries',
            icon: PhoneCall,
            items: [
              {
                id: 'fo_enq_list',
                title: 'Enquiries & Leads',
                url: '/app/admissions/inquiries',
                icon: PhoneCall,
              },
              {
                id: 'fo_lead_pipe',
                title: 'Lead Pipeline',
                url: '/app/front-office/leads',
                icon: PhoneCall,
              },
            ],
          },
          {
            id: 'fo_counselling',
            title: 'Counselling',
            url: '/app/admissions/counselling',
            icon: UserCheck,
            items: [
              {
                id: 'fo_coun_queue',
                title: 'Counselling Queue',
                url: '/app/admissions/counselling',
                icon: UserCheck,
              },
              {
                id: 'fo_coun_followups',
                title: 'Follow-ups Desk',
                url: '/app/front-office/counselling',
                icon: Clock,
              },
            ],
          },
          {
            id: 'fo_applications',
            title: 'Applications',
            url: '/app/admissions/applications',
            icon: FileText,
            items: [
              {
                id: 'fo_app_all',
                title: 'All Applications',
                url: '/app/admissions/applications',
                icon: FileText,
              },
              {
                id: 'fo_app_review',
                title: 'Application Review',
                url: '/app/admissions/review',
                icon: CheckSquare,
              },
            ],
          },
          {
            id: 'fo_verification',
            title: 'Document Verification',
            url: '/app/admissions/verification',
            icon: CheckCircle2,
            items: [
              {
                id: 'fo_verif_desk',
                title: 'Verification Desk',
                url: '/app/admissions/verification',
                icon: CheckCircle2,
              },
              {
                id: 'fo_verif_queues',
                title: 'Verification Queues',
                url: '/app/admissions/queues',
                icon: FolderCheck,
              },
            ],
          },
          {
            id: 'fo_fees',
            title: 'Fee Collection',
            url: '/app/admissions/fees',
            icon: Receipt,
            items: [
              {
                id: 'fo_fees_desk',
                title: 'Fee Collection',
                url: '/app/admissions/fees',
                icon: Receipt,
              },
              {
                id: 'fo_fees_history',
                title: 'Payment History',
                url: '/app/front-office/fees',
                icon: CreditCard,
              },
            ],
          },
          {
            id: 'fo_visits',
            title: 'Campus Visits & Interviews',
            url: '/app/admissions/interviews',
            icon: Calendar,
            items: [
              {
                id: 'fo_interviews_desk',
                title: 'Interview Desk',
                url: '/app/admissions/interviews',
                icon: Calendar,
              },
              {
                id: 'fo_visits_schedule',
                title: 'Campus Visits',
                url: '/app/admissions/visits',
                icon: Calendar,
              },
            ],
          },
          {
            id: 'fo_exams',
            title: 'Entrance Exams',
            url: '/app/admissions/exams',
            icon: GraduationCap,
            items: [
              {
                id: 'fo_exams_desk',
                title: 'Entrance Exams',
                url: '/app/admissions/exams',
                icon: GraduationCap,
              },
              {
                id: 'fo_exams_portal',
                title: 'Assessment Portal',
                url: '/app/admissions/entrance-assessment',
                icon: BookOpen,
              },
              {
                id: 'fo_exams_monitor',
                title: 'Assessment Monitor',
                url: '/app/admissions/assessment-monitor',
                icon: Activity,
              },
            ],
          },
          {
            id: 'fo_decisions',
            title: 'Admission Decisions',
            url: '/app/admissions/decisions',
            icon: Scale,
            items: [
              {
                id: 'fo_decisions_desk',
                title: 'Decision Desk',
                url: '/app/admissions/decisions',
                icon: Scale,
              },
              {
                id: 'fo_decisions_merit',
                title: 'Merit & Allocation',
                url: '/app/admissions/merit',
                icon: Award,
              },
              {
                id: 'fo_decisions_offers',
                title: 'Offer Letters',
                url: '/app/admissions/offers',
                icon: FileText,
              },
              {
                id: 'fo_decisions_enroll',
                title: 'Enrollment Desk',
                url: '/app/admissions/enrollment',
                icon: UserCheck,
              },
            ],
          },
        ],
      },
      { id: 'fo_students', title: 'Students', url: '/app/people/students', icon: Users },
      { id: 'fo_settings', title: 'Settings', url: '/app/settings', icon: Settings },
    ],
  },
];

export const ADMIN_NAVIGATION: NavigationGroup[] = [
  {
    id: 'admin_main',
    title: 'Administration',
    contextLabel: 'ENTERPRISE ERP',
    items: [
      {
        id: 'adm_dashboard',
        title: 'Admin Dashboard',
        url: '/app/admin/dashboard',
        icon: LayoutDashboard,
      },
      { id: 'adm_exec', title: 'Executive Overview', url: '/app/executive', icon: BarChart3 },
      { id: 'adm_people', title: 'People Directory', url: '/app/people', icon: Users },
      { id: 'adm_students', title: 'Students', url: '/app/people/students', icon: GraduationCap },
      { id: 'adm_staff', title: 'Staff Directory', url: '/app/people/staff', icon: UserCheck },
      { id: 'adm_bulk', title: 'Bulk Operations', url: '/app/admin/bulk', icon: Settings },
      { id: 'adm_import', title: 'Import History', url: '/app/import/history', icon: FileText },
      { id: 'adm_settings', title: 'Settings', url: '/app/settings', icon: Settings },
    ],
  },
];

export const GENERAL_NAVIGATION: NavigationGroup[] = [
  {
    id: 'general_main',
    title: 'Workspace',
    contextLabel: 'EDUTRACK ERP',
    items: [
      { id: 'gen_dashboard', title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard },
      { id: 'gen_profile', title: 'My Profile', url: '/app/profile', icon: User },
      { id: 'gen_settings', title: 'Settings', url: '/app/settings', icon: Settings },
    ],
  },
];

export function getNavigationForUser(roles: string[] = []): NavigationGroup[] {
  const normalizedRoles = roles.map((r) => r.toUpperCase().replace(/[\s_-]+/g, '_'));

  if (
    normalizedRoles.includes('FRONT_OFFICE') ||
    normalizedRoles.includes('FO') ||
    normalizedRoles.includes('STAFF') ||
    normalizedRoles.includes('ADMISSION_OFFICER') ||
    normalizedRoles.includes('COUNSELLOR') ||
    normalizedRoles.includes('FRONT_OFFICE_STAFF')
  ) {
    return FRONT_OFFICE_NAVIGATION;
  }

  if (
    normalizedRoles.includes('ADMIN') ||
    normalizedRoles.includes('SUPERADMIN') ||
    normalizedRoles.includes('SUPER_ADMIN')
  ) {
    return ADMIN_NAVIGATION;
  }

  if (normalizedRoles.includes('PARENT')) {
    return PARENT_NAVIGATION;
  }

  return GENERAL_NAVIGATION;
}

export interface FlatNavigationItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon?: any;
  category: string;
  parentTitle?: string;
}

export function filterNavigationTree(groups: NavigationGroup[], query: string): NavigationGroup[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return groups;

  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .map((item) => {
        const itemMatches = item.title.toLowerCase().includes(trimmed);
        const children = item.items || item.children;
        const matchingChildren = children ? filterItems(children) : [];

        if (itemMatches) {
          return {
            ...item,
            items: matchingChildren.length > 0 ? matchingChildren : children,
          };
        }

        if (matchingChildren.length > 0) {
          return {
            ...item,
            items: matchingChildren,
          };
        }

        return null;
      })
      .filter(Boolean) as NavigationItem[];
  };

  return groups
    .map((group) => ({
      ...group,
      items: filterItems(group.items),
    }))
    .filter((group) => group.items.length > 0);
}

export function searchNavigationItems(
  groups: NavigationGroup[],
  query: string,
): FlatNavigationItem[] {
  const trimmed = query.trim().toLowerCase();
  const flatItems: FlatNavigationItem[] = [];

  const traverse = (item: NavigationItem, category: string, parentTitle?: string) => {
    flatItems.push({
      id: item.id,
      title: item.title,
      subtitle: parentTitle ? `${parentTitle} • ${category}` : category,
      url: item.url,
      icon: item.icon,
      category,
      parentTitle,
    });

    const children = item.items || item.children;
    if (children && children.length > 0) {
      children.forEach((child) => traverse(child, category, item.title));
    }
  };

  groups.forEach((group) => {
    group.items.forEach((item) => traverse(item, group.title));
  });

  const seen = new Set<string>();
  const uniqueItems = flatItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  if (!trimmed) {
    return uniqueItems;
  }

  return uniqueItems.filter(
    (item) =>
      item.title.toLowerCase().includes(trimmed) ||
      item.subtitle.toLowerCase().includes(trimmed) ||
      item.category.toLowerCase().includes(trimmed) ||
      item.parentTitle?.toLowerCase().includes(trimmed) ||
      item.url.toLowerCase().includes(trimmed),
  );
}

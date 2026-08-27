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
  HelpCircle,
  UserPlus,
  MessageSquare,
  ShieldCheck,
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
    contextLabel: 'ADMISSION PORTAL',
    items: [
      {
        id: 'p_dashboard',
        title: 'Dashboard',
        url: '/app/parent/dashboard',
        icon: LayoutDashboard,
      },
      { id: 'p_my', title: 'My Applications', url: '/app/admissions/my', icon: FileText },
      {
        id: 'p_docs',
        title: 'Document Center',
        url: '/app/admissions/documents',
        icon: FolderCheck,
      },
      { id: 'p_fees', title: 'Fee Payment', url: '/app/admissions/fees', icon: CreditCard },
      {
        id: 'p_status',
        title: 'Admission Status',
        url: '/app/admissions/status',
        icon: CheckCircle2,
      },
    ],
  },
];

export const POST_ADMISSION_PARENT_NAVIGATION: NavigationGroup[] = [
  {
    id: 'parent_enrolled_main',
    title: 'Parent Portal',
    contextLabel: 'PARENT PORTAL',
    items: [
      {
        id: 'p_enrolled_dashboard',
        title: 'Dashboard',
        url: '/app/parent/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'p_enrolled_my_child',
        title: 'My Child',
        url: '/app/parent/my-child',
        icon: GraduationCap,
      },
      {
        id: 'p_enrolled_fees',
        title: 'Fee Payment',
        url: '/app/parent/fees',
        icon: CreditCard,
      },
      {
        id: 'p_enrolled_docs',
        title: 'Documents',
        url: '/app/parent/documents',
        icon: FolderCheck,
      },
      {
        id: 'p_enrolled_admissions',
        title: 'Admissions Desk',
        url: '/app/admissions/my',
        icon: ClipboardList,
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
      {
        id: 'fo_dashboard',
        title: 'Dashboard',
        url: '/app/front-office/dashboard',
        icon: LayoutDashboard,
      },
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
                id: 'fo_enq_sub',
                title: 'Enquiries',
                url: '/app/admissions/inquiries',
                icon: HelpCircle,
              },
              {
                id: 'fo_leads_sub',
                title: 'Leads Pipeline',
                url: '/app/front-office/leads',
                icon: UserPlus,
              },
              {
                id: 'fo_counsel_sub',
                title: 'Counselling Desk',
                url: '/app/front-office/counselling',
                icon: MessageSquare,
              },
              {
                id: 'fo_visits_sub',
                title: 'Campus Visits',
                url: '/app/front-office/visits',
                icon: Calendar,
              },
            ],
          },
          {
            id: 'fo_apps',
            title: 'Applications',
            url: '/app/front-office/applications',
            icon: FileText,
            items: [
              {
                id: 'fo_apps_all_sub',
                title: 'All Applications',
                url: '/app/front-office/applications',
                icon: FileText,
              },
              {
                id: 'fo_apps_review_sub',
                title: 'Review Queue',
                url: '/app/admissions/review',
                icon: CheckSquare,
              },
            ],
          },
          {
            id: 'fo_verif',
            title: 'Document Verification',
            url: '/app/front-office/verification',
            icon: ShieldCheck,
            items: [
              {
                id: 'fo_verif_queue_sub',
                title: 'Pending Verification',
                url: '/app/front-office/verification',
                icon: CheckCircle2,
              },
              {
                id: 'fo_verif_docs_sub',
                title: 'Verified Documents',
                url: '/app/admissions/queues?status=verified',
                icon: FolderCheck,
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
                id: 'fo_exams_queue_sub',
                title: 'Exam Queue',
                url: '/app/admissions/exams',
                icon: GraduationCap,
              },
              {
                id: 'fo_exams_eval_sub',
                title: 'Evaluation Desk',
                url: '/app/admissions/entrance-assessment',
                icon: BookOpen,
              },
              {
                id: 'fo_exams_rules_sub',
                title: 'Assessment Rules',
                url: '/app/admissions/assessment-monitor',
                icon: Activity,
              },
              {
                id: 'fo_exams_analytics_sub',
                title: 'Assessment Analytics',
                url: '/app/admissions/exams?tab=analytics',
                icon: BarChart3,
              },
            ],
          },
          {
            id: 'fo_decisions',
            title: 'Admission Decision',
            url: '/app/admissions/decisions',
            icon: Scale,
            items: [
              {
                id: 'fo_decisions_desk_sub',
                title: 'Decision Desk',
                url: '/app/admissions/decisions',
                icon: Scale,
              },
              {
                id: 'fo_decisions_approved_sub',
                title: 'Approved Admissions',
                url: '/app/front-office/decisions?status=approved',
                icon: CheckCircle2,
              },
              {
                id: 'fo_decisions_waitlist_sub',
                title: 'Waitlisted',
                url: '/app/admissions/decisions?status=waitlisted',
                icon: Clock,
              },
              {
                id: 'fo_decisions_rejected_sub',
                title: 'Rejected',
                url: '/app/admissions/decisions?status=rejected',
                icon: Scale,
              },
              {
                id: 'fo_decisions_enroll_sub',
                title: 'Enrollment',
                url: '/app/admissions/enrollment',
                icon: UserCheck,
              },
            ],
          },
          {
            id: 'fo_fees',
            title: 'Fee Collection',
            url: '/app/front-office/fees',
            icon: Receipt,
            items: [
              {
                id: 'fo_fees_desk_sub',
                title: 'Fee Collection',
                url: '/app/front-office/fees',
                icon: Receipt,
              },
              {
                id: 'fo_fees_pending_sub',
                title: 'Pending Payments',
                url: '/app/front-office/fees?payment_status=pending',
                icon: Clock,
              },
              {
                id: 'fo_fees_history_sub',
                title: 'Payment History',
                url: '/app/front-office/fees?payment_status=paid',
                icon: CreditCard,
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

export function getNavigationForUser(
  roles: string[] = [],
  isPostAdmission: boolean = false,
): NavigationGroup[] {
  const normalizedRoles = roles.map((r) =>
    String(r)
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_'),
  );

  if (
    normalizedRoles.includes('FRONT_OFFICE') ||
    normalizedRoles.includes('FO') ||
    normalizedRoles.includes('RECEPTIONIST') ||
    normalizedRoles.includes('STAFF') ||
    normalizedRoles.includes('ADMISSION_OFFICER') ||
    normalizedRoles.includes('ADMISSIONS_OFFICER') ||
    normalizedRoles.includes('COUNSELLOR') ||
    normalizedRoles.includes('COUNSELOR') ||
    normalizedRoles.includes('FRONT_OFFICE_STAFF') ||
    normalizedRoles.includes('FINANCE') ||
    normalizedRoles.includes('FINANCE_OFFICER')
  ) {
    return FRONT_OFFICE_NAVIGATION;
  }

  if (
    normalizedRoles.includes('ADMIN') ||
    normalizedRoles.includes('SUPERADMIN') ||
    normalizedRoles.includes('SUPER_ADMIN') ||
    normalizedRoles.includes('ORG_ADMIN') ||
    normalizedRoles.includes('HOI') ||
    normalizedRoles.includes('PRINCIPAL') ||
    normalizedRoles.includes('HEAD_OF_INSTITUTE')
  ) {
    return ADMIN_NAVIGATION;
  }

  if (normalizedRoles.includes('PARENT') || normalizedRoles.includes('GUARDIAN')) {
    if (isPostAdmission || normalizedRoles.includes('ENROLLED_PARENT')) {
      return POST_ADMISSION_PARENT_NAVIGATION;
    }
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

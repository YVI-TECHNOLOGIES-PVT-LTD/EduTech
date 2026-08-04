// External URLs for redirects (now internal routes)
export const EXTERNAL_URLS = {
  ADMISSION_REGISTRATION: "/admissions/apply",
  LOGIN: "/login",
  NOTIFICATIONS_APP: "/app/notifications",
} as const;

// Navigation structure for mega menu
export const NAV_STRUCTURE = {
  academics: {
    label: "Academics",
    items: [
      {
        title: "Programs Overview",
        description: "Explore our comprehensive academic programs",
        href: "/academics",
      },
      {
        title: "Departments",
        description: "Learn about our diverse academic departments",
        href: "/departments",
      },
      {
        title: "Faculty",
        description: "Meet our distinguished educators",
        href: "/faculty",
      },
    ],
  },
  admissions: {
    label: "Admissions",
    items: [
      {
        title: "Admissions Overview",
        description: "Begin your journey with us",
        href: "/admissions",
      },
      {
        title: "Admission Process",
        description: "Step-by-step application guide",
        href: "/admission-process",
      },
      {
        title: "Apply Now",
        description: "Start your application today",
        href: EXTERNAL_URLS.ADMISSION_REGISTRATION,
        external: false,
      },
    ],
  },
  campusLife: {
    label: "Campus Life",
    items: [
      {
        title: "Campus & Facilities",
        description: "Explore our world-class infrastructure",
        href: "/campus",
      },
      {
        title: "Student Life",
        description: "Discover life beyond academics",
        href: "/student-life",
      },
      {
        title: "Achievements",
        description: "Celebrating our successes",
        href: "/achievements",
      },
      {
        title: "Events & News",
        description: "Stay updated with latest happenings",
        href: "/events",
      },
    ],
  },
} as const;

// Static notifications for the notification bell
export const NOTIFICATIONS = [
  {
    id: "1",
    title: "Admissions Open 2026-27",
    message: "Applications are now being accepted for the new academic year. Apply before the deadline!",
    type: "admission" as const,
    date: "2026-01-15",
    isNew: true,
    ctaText: "Apply Now",
    ctaLink: EXTERNAL_URLS.ADMISSION_REGISTRATION,
  },
  {
    id: "2",
    title: "Application Deadline Extended",
    message: "Last date to submit applications has been extended to March 31, 2026.",
    type: "admission" as const,
    date: "2026-01-10",
    isNew: true,
    ctaText: "Start Application",
    ctaLink: EXTERNAL_URLS.ADMISSION_REGISTRATION,
  },
  {
    id: "3",
    title: "New Academic Year 2026-27",
    message: "Welcome to the new academic session. Classes commence from April 1, 2026.",
    type: "announcement" as const,
    date: "2026-01-08",
    isNew: false,
  },
  {
    id: "4",
    title: "Annual Sports Meet",
    message: "Join us for the annual sports meet on February 15-16, 2026.",
    type: "event" as const,
    date: "2026-01-05",
    isNew: false,
  },
  {
    id: "5",
    title: "Parent-Teacher Meeting",
    message: "PTM scheduled for January 25, 2026. All parents are requested to attend.",
    type: "announcement" as const,
    date: "2026-01-02",
    isNew: false,
  },
] as const;

// School information
export const SCHOOL_INFO = {
  name: "EduTrack",
  tagline: "Excellence in Education Since 1952",
  address: "123 Academic Avenue, Education City, EC 12345",
  phone: "+1 (555) 123-4567",
  email: "info@apexinternationalschool.edu",
  established: 1952,
  socialLinks: {
    facebook: "https://facebook.com/apexinternationalschool",
    twitter: "https://twitter.com/apexinternationalschool",
    instagram: "https://instagram.com/apexinternationalschool",
    linkedin: "https://linkedin.com/school/apexinternationalschool",
    youtube: "https://youtube.com/apexinternationalschool",
  },
} as const;

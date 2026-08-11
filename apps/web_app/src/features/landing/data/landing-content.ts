import {
  AnnouncementConfig,
  TrustMetric,
  FeatureHighlight,
  AcademicStage,
  JourneyStep,
  CampusMediaItem,
  Testimonial,
} from '../types/landing.types';

export const ANNOUNCEMENT_DATA: AnnouncementConfig = {
  id: 'announcement-2026',
  academicYear: '2026–27',
  message: 'Admissions Open for Academic Session 2026–27 · Limited Seats Available',
  badgeText: 'ADMISSIONS OPEN',
  ctaText: 'Enquire Online',
  ctaLink: '/enquiry',
  isDismissible: true,
};

export const TRUST_METRICS_DATA: TrustMetric[] = [
  {
    id: 'students',
    value: '5,200+',
    label: 'Students Enrolled',
    description: 'Vibrant diverse learning community',
    iconName: 'GraduationCap',
  },
  {
    id: 'satisfaction',
    value: '98%',
    label: 'Parent Satisfaction',
    description: 'Based on annual parent surveys',
    iconName: 'HeartHandshake',
  },
  {
    id: 'excellence',
    value: '25+',
    label: 'Years of Excellence',
    description: 'Pioneering holistic education since 2001',
    iconName: 'Award',
  },
  {
    id: 'faculty',
    value: '120+',
    label: 'Expert Educators',
    description: 'Certified subject specialists & mentors',
    iconName: 'Users',
  },
];

export const WHY_EDUTRACK_DATA: FeatureHighlight[] = [
  {
    id: 'innovation',
    title: 'Innovation & STEM Labs',
    subtitle: 'Future-Ready Tech',
    description:
      'State-of-the-art robotics, coding studios, AI labs, and experiential STEM centers preparing students for future challenges.',
    icon: 'Cpu',
    badge: 'Tech-Enabled',
    linkText: 'Explore STEM',
    linkHref: '/academics',
  },
  {
    id: 'global',
    title: 'Global Curriculum',
    subtitle: 'International Standards',
    description:
      'CBSE affiliated curriculum enhanced with global learning paradigms, critical inquiry, and multi-lingual programs.',
    icon: 'Globe',
    badge: 'Affiliated',
    linkText: 'Academic Vision',
    linkHref: '/academics',
  },
  {
    id: 'arts',
    title: 'Creative & Performing Arts',
    subtitle: 'Expression & Culture',
    description:
      'Dedicated academies for music, visual arts, theater, and digital media to encourage imaginative expression.',
    icon: 'Palette',
    badge: 'Holistic',
    linkText: 'Discover Arts',
    linkHref: '/student-life',
  },
  {
    id: 'growth',
    title: 'Physical Development & Sports',
    subtitle: 'Athletic Excellence',
    description:
      'Olympic-standard athletic tracks, indoor sports arenas, swimming facilities, and professional coaching staff.',
    icon: 'Activity',
    badge: 'Wellness',
    linkText: 'Sports Complex',
    linkHref: '/campus',
  },
];

export const ACADEMIC_STAGES_DATA: AcademicStage[] = [
  {
    id: 'early-years',
    title: 'Early Years Foundation',
    grades: 'Pre-K to Kindergarten',
    ageRange: 'Ages 3 – 5',
    tagline: 'Play • Curiosity • Confidence',
    description:
      'A warm, sensorially rich environment fostering early literacy, numeracy, social empathy, and play-based discovery.',
    highlights: [
      'Montessori-inspired activity centers',
      'Language immersion & phonics foundation',
      'Motor skills development & outdoor exploration',
      'Individualized care and emotional support',
    ],
    color: 'from-amber-500 to-orange-600',
    icon: 'Baby',
  },
  {
    id: 'primary',
    title: 'Primary School',
    grades: 'Grades 1 – 5',
    ageRange: 'Ages 6 – 10',
    tagline: 'Foundations • Discovery • Collaboration',
    description:
      'Building solid core competencies in Mathematics, Science, and Languages while instilling curiosity and collaborative habits.',
    highlights: [
      'Interactive SMART classroom learning',
      'Inquiry-driven science & nature projects',
      'Structured reading & creative writing labs',
      'Introductory coding and logic modules',
    ],
    color: 'from-emerald-500 to-teal-700',
    icon: 'BookOpen',
  },
  {
    id: 'middle-school',
    title: 'Middle School',
    grades: 'Grades 6 – 8',
    ageRange: 'Ages 11 – 13',
    tagline: 'Research • Independence • Leadership',
    description:
      'Nurturing critical thinking, independent research capabilities, subject specialization, and peer leadership skills.',
    highlights: [
      'Advanced STEM & robotics workshops',
      'Inter-school debate & Model UN participation',
      'Specialized science lab experiments',
      'Comprehensive co-curricular choices',
    ],
    color: 'from-blue-600 to-indigo-700',
    icon: 'Compass',
  },
  {
    id: 'senior-school',
    title: 'Senior Secondary',
    grades: 'Grades 9 – 12',
    ageRange: 'Ages 14 – 18',
    tagline: 'Excellence • Career • University Prep',
    description:
      'Rigorous academic pathways (Science, Commerce, Humanities) complemented by entrance coaching, career counseling, and university placement.',
    highlights: [
      'Targeted competitive exam coaching (JEE/NEET/SAT)',
      'University application & portfolio guidance',
      'State-of-the-art research laboratories',
      'Leadership positions in student council',
    ],
    color: 'from-violet-600 to-purple-800',
    icon: 'GraduationCap',
  },
];

export const ADMISSION_JOURNEY_STEPS: JourneyStep[] = [
  {
    stepNumber: '01',
    title: 'Explore',
    subtitle: 'Discover Academics',
    description:
      'Explore our academic philosophy, campus facilities, programs, and community values.',
    ctaText: 'Explore Academics',
    ctaHref: '/academics',
  },
  {
    stepNumber: '02',
    title: 'Enquire',
    subtitle: 'Connect With Us',
    description:
      'Submit a quick enquiry online or talk to EduAI to receive customized admission insights.',
    ctaText: 'Quick Enquiry',
  },
  {
    stepNumber: '03',
    title: 'Counselling',
    subtitle: 'Personalized Guidance',
    description:
      'Meet our admissions counselors for a campus tour and personalized interactive session.',
    ctaText: 'Book Visit',
  },
  {
    stepNumber: '04',
    title: 'Apply',
    subtitle: 'Submit Application',
    description:
      'Fill out the digital application form and upload necessary academic and birth documents.',
    ctaText: 'Enquire Online',
    ctaHref: '/enquiry',
  },
  {
    stepNumber: '05',
    title: 'Assessment',
    subtitle: 'Interactive Interaction',
    description:
      'A friendly interaction or placement assessment to understand your child’s learning baseline.',
  },
  {
    stepNumber: '06',
    title: 'Decision',
    subtitle: 'Admission Offer',
    description: 'Receive the formal admission decision and seat allotment confirmation letter.',
  },
  {
    stepNumber: '07',
    title: 'Enroll',
    subtitle: 'Welcome to EduTrack',
    description:
      'Complete fee payment, uniform & book procurement, and join our student orientation.',
  },
];

export const CAMPUS_GALLERY_DATA: CampusMediaItem[] = [
  {
    id: 'camp-1',
    title: 'Future Tech Robotics Lab',
    category: 'lab',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    caption: 'Students assembling automated robotics prototypes in our AI & Innovation Lab.',
    tags: ['Robotics', 'AI Lab', 'STEM'],
  },
  {
    id: 'camp-2',
    title: 'Olympic-Standard Athletic Track',
    category: 'sports',
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    caption: 'All-weather synthetic running track hosting inter-school athletics events.',
    tags: ['Sports', 'Athletics', 'Fitness'],
  },
  {
    id: 'camp-3',
    title: 'Visual & Digital Arts Studio',
    category: 'arts',
    imageUrl:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    caption: 'Spacious studio equipped for painting, clay modeling, sculpture, and digital design.',
    tags: ['Art Studio', 'Creative', 'Exhibition'],
  },
  {
    id: 'camp-4',
    title: 'Central Knowledge Library',
    category: 'library',
    imageUrl:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    caption: 'Over 25,000 titles, digital archives, and quiet study pods for deep research.',
    tags: ['Library', 'Books', 'Research'],
  },
  {
    id: 'camp-5',
    title: 'Interactive Collaborative Classrooms',
    category: 'classroom',
    imageUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    caption: 'Ergonomic furniture and interactive displays supporting team-based learning.',
    tags: ['Classroom', 'Digital Learning'],
  },
  {
    id: 'camp-6',
    title: 'Annual Arts & Cultural Festival',
    category: 'events',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    caption:
      'Annual showcase of drama, orchestral music, and dance performances in our auditorium.',
    tags: ['Events', 'Performances', 'Auditorium'],
  },
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'test-1',
    quote:
      'EduTrack transformed the way our daughter approaches learning. The educators do not just teach subjects; they inspire genuine curiosity and confidence every single day.',
    author: 'Fatima Al-Rashidi',
    role: 'parent',
    subtitle: 'Parent of Grade 7 Student',
    rating: 5,
    gradeOrYear: 'Grade 7 Parent',
  },
  {
    id: 'test-2',
    quote:
      'The foundation I received at EduTrack was instrumental in my transition to Imperial College London. The STEM labs and public speaking mentoring gave me a huge head start.',
    author: 'Michael Chen',
    role: 'alumni',
    subtitle: 'Class of 2023 · Computer Engineering',
    rating: 5,
    gradeOrYear: 'Alumni 2023',
  },
  {
    id: 'test-3',
    quote:
      'As an education consultant, I have visited scores of campuses. EduTrack stands out for its seamless integration of academic rigor, character development, and modern facilities.',
    author: 'Dr. Emily Roberts',
    role: 'educator',
    subtitle: 'Senior Educational Specialist',
    rating: 5,
    gradeOrYear: 'Education Advisor',
  },
];

export const FAQ_PRESETS = [
  {
    question: 'What is the fee structure for Academic Year 2026–27?',
    category: 'fees',
  },
  {
    question: 'What are the age eligibility criteria for Kindergarten & Grade 1?',
    category: 'eligibility',
  },
  {
    question: 'When do admissions close for the upcoming session?',
    category: 'dates',
  },
  {
    question: 'How do I submit an online application?',
    category: 'process',
  },
  {
    question: 'Can I book a campus visit or virtual tour?',
    category: 'visit',
  },
];

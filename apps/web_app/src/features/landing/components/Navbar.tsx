import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  BookOpen,
  HelpCircle,
  Sparkles,
  PhoneCall,
  Calendar,
  FileText,
  Award,
  ShieldCheck,
  Search,
  Globe,
  X,
  MessageSquare,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SCHOOL_INFO } from '@/lib/public-constants';
import i18n from '@/i18n';

interface NavbarProps {
  onEnquireClick?: () => void;
  variant?: 'standard' | 'enquiry';
}

interface SearchItem {
  id: string;
  title: string;
  category: 'General' | 'Academics' | 'Admissions' | 'Campus' | 'Enquiry' | 'Support';
  href: string;
  keywords: string;
  description?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'about',
    title: 'About EduTrack',
    category: 'General',
    href: '/about',
    keywords: 'about school history mission vision leadership overview',
    description: 'School history, vision, leadership, and core values.',
  },
  {
    id: 'academics',
    title: 'Academics & Curriculum',
    category: 'Academics',
    href: '/academics',
    keywords: 'academics curriculum grades primary middle senior stem subjects',
    description: 'Early years, primary, middle, and senior secondary curriculum.',
  },
  {
    id: 'admissions-hub',
    title: 'Admissions Hub 2026–27',
    category: 'Admissions',
    href: '/admissions',
    keywords: 'admissions apply application seats open process dates',
    description: 'Overview of admissions, criteria, and available seats.',
  },
  {
    id: 'admission-process',
    title: 'Admission Process & Walkthrough',
    category: 'Admissions',
    href: '/admission-process',
    keywords: 'process guide eligibility walkthrough rules criteria',
    description: 'Step-by-step application walkthrough and eligibility rules.',
  },
  {
    id: 'apply-now',
    title: 'Online Enquiry & Counseling',
    category: 'Admissions',
    href: '/enquiry',
    keywords: 'enquiry apply application form register guest online student',
    description: 'Submit an online enquiry to talk directly with our admissions counselor.',
  },
  {
    id: 'fees',
    title: 'Fee Structure & Financial Aid',
    category: 'Admissions',
    href: '/admissions#fees',
    keywords: 'fees structure cost tuition scholarship financial aid',
    description: 'Transparent fee structures, installment options, and scholarships.',
  },
  {
    id: 'enquiry',
    title: 'Online Enquiry & Counseling',
    category: 'Enquiry',
    href: '/enquiry',
    keywords: 'enquiry ask question counselor enquiry form quick',
    description: 'Submit an enquiry to talk directly with our admissions counselor.',
  },
  {
    id: 'campus',
    title: 'Campus Facilities & Infrastructure',
    category: 'Campus',
    href: '/campus',
    keywords: 'campus facilities infrastructure sports lab library student life',
    description: 'Explore modern classrooms, science labs, sports complex, and campus.',
  },
  {
    id: 'gallery',
    title: 'Gallery & Media Center',
    category: 'Campus',
    href: '/campus#gallery',
    keywords: 'gallery photos pictures campus images events photos',
    description: 'Photo gallery, campus views, and student event highlights.',
  },
  {
    id: 'achievements',
    title: 'Student Achievements & Events',
    category: 'Campus',
    href: '/achievements',
    keywords: 'achievements events news awards activities',
    description: 'Recent academic, athletic, and cultural achievements.',
  },
  {
    id: 'faqs',
    title: 'Frequently Asked Questions (FAQs)',
    category: 'Support',
    href: '/admission-process#faqs',
    keywords: 'faqs questions help support eligibility age criteria',
    description: 'Common answers about age limits, documents, and admission policies.',
  },
  {
    id: 'contact',
    title: 'Contact Us & Office Location',
    category: 'General',
    href: '/contact',
    keywords: 'contact phone email address location helpline map',
    description: 'Get school address, helpline phone numbers, and email contact.',
  },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'te', label: 'తెలుగు (Telugu)', shortLabel: 'TE' },
];

export const Navbar: React.FC<NavbarProps> = ({ onEnquireClick, variant }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if Enquiry Page Navbar variant should be rendered
  const isEnquiryPageVariant =
    variant === 'enquiry' ||
    location.pathname === '/enquiry' ||
    location.pathname.startsWith('/admission/enquiry');

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Language Selector State
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(() => {
    const saved = localStorage.getItem('erp-language') || i18n.language || 'en';
    return saved.toLowerCase();
  });
  const langContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autofocus Search Input on Open
  useEffect(() => {
    if (isSearchOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Click Outside Handlers & Escape Key Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsLangOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (langContainerRef.current && !langContainerRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('erp-language', code);
    setCurrentLang(code);
    setIsLangOpen(false);
  };

  const handleEnquiryClick = () => {
    if (onEnquireClick) {
      onEnquireClick();
    } else {
      navigate('/enquiry');
    }
  };

  // Filter Search Items
  const filteredSearchItems = SEARCH_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredSearchItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredSearchItems.length) % Math.max(1, filteredSearchItems.length),
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSearchItems.length > 0) {
        const item = filteredSearchItems[selectedIndex] || filteredSearchItems[0];
        navigate(item.href);
        setIsSearchOpen(false);
      }
    }
  };

  const admissionsMenuItems = [
    {
      title: 'Quick Enquiry Form',
      description: 'Submit an online enquiry for counseling',
      href: '/enquiry',
      icon: FileText,
    },
    {
      title: 'Admission Guide',
      description: 'Step-by-step application walkthrough & dates',
      href: '/admission-process',
      icon: Award,
    },
    {
      title: 'Eligibility Criteria',
      description: 'Age criteria & prerequisite standards',
      href: '/admission-process#eligibility',
      icon: ShieldCheck,
    },
    {
      title: 'Fees & Scholarships',
      description: 'Transparent fee structures & financial aid options',
      href: '/admissions#fees',
      icon: Sparkles,
    },
    {
      title: 'Online Enquiry',
      description: 'Submit an enquiry to our admissions counseling team',
      href: '/enquiry',
      icon: BookOpen,
      badge: 'Open 2026–27',
    },
    {
      title: 'Talk to Admissions',
      description: 'Get in touch directly with our team',
      href: '/contact',
      icon: PhoneCall,
    },
  ];

  const academicsMenuItems = [
    {
      title: 'Early Years Foundation',
      description: 'Pre-K to Kindergarten play-based learning',
      href: '/academics#early-years',
    },
    {
      title: 'Primary School',
      description: 'Grades 1-5 fundamental development',
      href: '/academics#primary',
    },
    {
      title: 'Middle Secondary',
      description: 'Grades 6-8 critical thinking & STEM focus',
      href: '/academics#middle',
    },
    {
      title: 'Senior Secondary',
      description: 'Grades 9-12 career & university preparation',
      href: '/academics#senior',
    },
  ];

  // =========================================================
  // ENQUIRY PAGE NAVBAR VARIANT (COMPACT FLOATING PILL — SCREENSHOT 2)
  // =========================================================
  if (isEnquiryPageVariant) {
    return (
      <header className="sticky top-2 sm:top-3 z-40 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 pointer-events-none transition-all duration-300">
        {/* Compact Floating Pill Container (Target Height: 76px–84px) */}
        <div className="pointer-events-auto rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl shadow-slate-950/60 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between h-[76px] sm:h-[80px] lg:h-[84px]">
          {/* LEFT ZONE: Compact Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-105 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-300" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-base sm:text-lg font-black text-white block leading-none tracking-tight">
                {SCHOOL_INFO.name}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 block mt-0.5">
                Est. {SCHOOL_INFO.established} · Excellence
              </span>
            </div>
          </Link>

          {/* CENTER ZONE: Compact Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 lg:gap-6 xl:gap-7">
            <Link
              to="/about"
              className={cn(
                'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
                location.pathname === '/about' ? 'text-amber-400 font-bold' : 'text-slate-200',
              )}
            >
              About
            </Link>

            {/* Academics Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('academics')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={cn(
                  'flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300 cursor-pointer py-1',
                  activeDropdown === 'academics' ? 'text-amber-400 font-bold' : 'text-slate-200',
                )}
              >
                <span>Academics</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    activeDropdown === 'academics' && 'rotate-180 text-amber-400',
                  )}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'academics' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 w-68 pt-2.5 z-50"
                  >
                    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 space-y-1 text-white">
                      {academicsMenuItems.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="block p-2.5 rounded-xl hover:bg-slate-800 transition-colors group"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-amber-300">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.description}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admissions Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('admissions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={cn(
                  'flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300 cursor-pointer py-1',
                  activeDropdown === 'admissions' ? 'text-amber-400 font-bold' : 'text-slate-200',
                )}
              >
                <span>Admissions</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    activeDropdown === 'admissions' && 'rotate-180 text-amber-400',
                  )}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'admissions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[500px] pt-2.5 z-50"
                  >
                    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-3.5 text-white">
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
                          Admissions Hub 2026–27
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                          Seats Open
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {admissionsMenuItems.map((item) => (
                          <Link
                            key={item.title}
                            to={item.href}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1 truncate">
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-semibold shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/campus"
              className={cn(
                'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
                location.pathname === '/campus' ? 'text-amber-400 font-bold' : 'text-slate-200',
              )}
            >
              Campus
            </Link>

            <Link
              to="/contact"
              className={cn(
                'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
                location.pathname === '/contact' ? 'text-amber-400 font-bold' : 'text-slate-200',
              )}
            >
              Contact
            </Link>
          </nav>

          {/* RIGHT ZONE: Compact Proportional Actions ([Login] [Apply Now] [Theme]) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Prominent Orange Login CTA */}
            <Link to="/login" className="hidden sm:inline-block">
              <Button
                size="sm"
                className="bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-xs sm:text-sm h-10 sm:h-10.5 px-5 sm:px-6 rounded-full shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Login
              </Button>
            </Link>

            {/* Apply Now Secondary CTA */}
            <Link to="/enquiry" className="hidden md:inline-block">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-800 font-bold text-xs sm:text-sm h-10 sm:h-10.5 px-4 sm:px-5 rounded-full cursor-pointer"
              >
                Enquire Now
              </Button>
            </Link>

            {/* Compact Theme Control Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className="w-10 h-10 sm:w-10.5 sm:h-10.5 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
            >
              {isDarkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-300" />
              )}
            </button>

            {/* Mobile Navigation Sheet Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open Mobile Menu"
                  className="lg:hidden w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center cursor-pointer shrink-0 shadow-md border border-slate-700"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] max-w-[calc(100vw-32px)] bg-slate-950 text-white border-slate-800 p-0 flex flex-col"
              >
                <SheetHeader className="p-6 border-b border-slate-800 text-left">
                  <SheetTitle className="text-white flex items-center gap-3 text-lg font-display">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">{SCHOOL_INFO.name}</div>
                      <div className="text-xs text-slate-400 font-sans font-normal">
                        Admissions Open 2026–27
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm font-semibold">
                  <SheetClose asChild>
                    <Link
                      to="/"
                      className="block py-2 text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      Home
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/about"
                      className="block py-2 text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      About EduTrack
                    </Link>
                  </SheetClose>

                  <div className="pt-2 pb-1 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Academics
                  </div>
                  {academicsMenuItems.map((item) => (
                    <SheetClose asChild key={item.title}>
                      <Link
                        to={item.href}
                        className="block pl-3 py-1.5 text-slate-300 hover:text-amber-300 text-xs font-normal"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}

                  <div className="pt-3 pb-1 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Admissions
                  </div>
                  {admissionsMenuItems.map((item) => (
                    <SheetClose asChild key={item.title}>
                      <Link
                        to={item.href}
                        className="flex items-center justify-between pl-3 py-1.5 text-slate-300 hover:text-amber-300 text-xs font-normal"
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SheetClose>
                  ))}

                  <SheetClose asChild>
                    <Link
                      to="/campus"
                      className="block pt-3 py-2 text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      Campus Life
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/contact"
                      className="block py-2 text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      Contact Us
                    </Link>
                  </SheetClose>
                </div>

                <div className="p-6 border-t border-slate-800 space-y-3">
                  <SheetClose asChild>
                    <Link to="/login" className="block w-full">
                      <Button className="w-full bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold h-10.5 rounded-full shadow-lg">
                        Login
                      </Button>
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link to="/enquiry" className="block w-full">
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 h-10.5 rounded-full"
                      >
                        Submit Enquiry →
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    );
  }

  // =========================================================
  // STANDARD PUBLIC NAVBAR VARIANT (CENTERED FLOATING CONTAINER)
  // =========================================================
  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 pointer-events-none transition-all duration-300">
      {/* Floating Pill Container (Max-Width 1440px Centered) */}
      <div className="pointer-events-auto rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl shadow-slate-950/60 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between h-[76px] sm:h-[80px] lg:h-[84px]">
        {/* LEFT ZONE: Compact Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-105 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-300" />
          </div>
          <div>
            <span className="font-display text-base sm:text-lg font-black text-white block leading-none tracking-tight">
              {SCHOOL_INFO.name}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 block mt-0.5">
              Est. {SCHOOL_INFO.established} · Excellence
            </span>
          </div>
        </Link>

        {/* CENTER ZONE: Compact Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 lg:gap-6 xl:gap-7">
          <Link
            to="/about"
            className={cn(
              'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
              location.pathname === '/about' ? 'text-amber-400 font-bold' : 'text-slate-200',
            )}
          >
            About
          </Link>

          {/* Academics Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('academics')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                'flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300 cursor-pointer py-1',
                activeDropdown === 'academics' ? 'text-amber-400 font-bold' : 'text-slate-200',
              )}
            >
              <span>Academics</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  activeDropdown === 'academics' && 'rotate-180 text-amber-400',
                )}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'academics' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-68 pt-2.5 z-50"
                >
                  <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 space-y-1 text-white">
                    {academicsMenuItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.href}
                        className="block p-2.5 rounded-xl hover:bg-slate-800 transition-colors group"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-amber-300">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admissions Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('admissions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={cn(
                'flex items-center gap-1 text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300 cursor-pointer py-1',
                activeDropdown === 'admissions' ? 'text-amber-400 font-bold' : 'text-slate-200',
              )}
            >
              <span>Admissions</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  activeDropdown === 'admissions' && 'rotate-180 text-amber-400',
                )}
              />
            </button>

            <AnimatePresence>
              {activeDropdown === 'admissions' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 w-[500px] pt-2.5 z-50"
                >
                  <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-3.5 text-white">
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
                        Admissions Hub 2026–27
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                        Seats Open
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {admissionsMenuItems.map((item) => (
                        <Link
                          key={item.title}
                          to={item.href}
                          className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-1 truncate">
                              <span>{item.title}</span>
                              {item.badge && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-semibold shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/campus"
            className={cn(
              'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
              location.pathname === '/campus' ? 'text-amber-400 font-bold' : 'text-slate-200',
            )}
          >
            Gallery
          </Link>

          <Link
            to="/contact"
            className={cn(
              'text-xs sm:text-sm font-semibold transition-colors hover:text-amber-300',
              location.pathname === '/contact' ? 'text-amber-400 font-bold' : 'text-slate-200',
            )}
          >
            Contact
          </Link>
        </nav>

        {/* RIGHT ZONE: Compact Controls (Search, Language, Enquiry, Apply Now) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. SEARCH CONTROL BUTTON & OVERLAY */}
          <div className="relative" ref={searchContainerRef}>
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Search"
              aria-expanded={isSearchOpen}
              className={cn(
                'w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-sm',
                isSearchOpen
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white',
              )}
            >
              <Search className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2.5 w-[340px] sm:w-[420px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-3.5 z-50 text-white"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-2xl">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedIndex(0);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search EduTrack..."
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-white p-0.5 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 max-h-[300px] overflow-y-auto space-y-1 divide-y divide-slate-800/40 pr-1">
                    {filteredSearchItems.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-400">
                        No destinations matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      filteredSearchItems.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            navigate(item.href);
                            setIsSearchOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'p-2.5 rounded-2xl cursor-pointer transition-colors flex items-start justify-between group',
                            idx === selectedIndex
                              ? 'bg-indigo-600/30 border border-indigo-500/40'
                              : 'hover:bg-slate-800/80',
                          )}
                        >
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center gap-2">
                              <span>{item.title}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                                {item.category}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 shrink-0 mt-0.5" />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">ESC</kbd>{' '}
                      to exit
                    </span>
                    <span>
                      Use <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono">↑ ↓</kbd> to
                      navigate
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. LANGUAGE SELECTOR DROPDOWN */}
          <div className="relative" ref={langContainerRef}>
            <button
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-label="Select Language"
              aria-haspopup="true"
              aria-expanded={isLangOpen}
              className="px-3 py-1.5 h-9.5 sm:h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentLang.toUpperCase()}</span>
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-slate-400 transition-transform duration-200',
                  isLangOpen && 'rotate-180',
                )}
              />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2.5 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-white"
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
                    Select Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer',
                        currentLang === lang.code
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      )}
                    >
                      <span>{lang.label}</span>
                      {currentLang === lang.code && (
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. TEAL ENQUIRY BUTTON */}
          <button
            onClick={handleEnquiryClick}
            className="hidden sm:flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm h-9.5 sm:h-10 px-3.5 sm:px-4 rounded-full border border-teal-400/30 shadow-md shadow-teal-900/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-100" />
            <span>Enquiry</span>
          </button>

          {/* 4. PRIMARY PURPLE APPLY NOW BUTTON */}
          <Link to="/enquiry" className="hidden md:inline-block">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm h-9.5 sm:h-10 px-4 sm:px-5 rounded-full shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 border border-indigo-400/30"
            >
              <span>Enquire Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </Button>
          </Link>

          {/* 5. MOBILE MENU SHEET TRIGGER */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open Mobile Menu"
                className="lg:hidden w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center cursor-pointer shrink-0 shadow-md border border-slate-700"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[320px] max-w-[calc(100vw-32px)] bg-slate-950 text-white border-slate-800 p-0 flex flex-col"
            >
              <SheetHeader className="p-5 border-b border-slate-800 text-left">
                <SheetTitle className="text-white flex items-center gap-3 text-base font-display">
                  <div className="w-8.5 h-8.5 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="font-bold">{SCHOOL_INFO.name}</div>
                    <div className="text-[11px] text-slate-400 font-sans font-normal">
                      Admissions Open 2026–27
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-sm font-semibold">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="block py-1.5 text-slate-200 hover:text-amber-400 transition-colors"
                  >
                    Home
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    to="/about"
                    className="block py-1.5 text-slate-200 hover:text-amber-400 transition-colors"
                  >
                    About EduTrack
                  </Link>
                </SheetClose>

                <div className="pt-2 pb-1 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Academics
                </div>
                {academicsMenuItems.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.href}
                      className="block pl-3 py-1 text-slate-300 hover:text-amber-300 text-xs font-normal"
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}

                <div className="pt-2 pb-1 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Admissions
                </div>
                {admissionsMenuItems.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.href}
                      className="flex items-center justify-between pl-3 py-1 text-slate-300 hover:text-amber-300 text-xs font-normal"
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SheetClose>
                ))}

                <SheetClose asChild>
                  <Link
                    to="/campus"
                    className="block pt-2 py-1.5 text-slate-200 hover:text-amber-400 transition-colors"
                  >
                    Gallery & Campus Life
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    to="/contact"
                    className="block py-1.5 text-slate-200 hover:text-amber-400 transition-colors"
                  >
                    Contact Us
                  </Link>
                </SheetClose>
              </div>

              <div className="p-5 border-t border-slate-800 space-y-2.5">
                <SheetClose asChild>
                  <button
                    onClick={handleEnquiryClick}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold h-10 rounded-full flex items-center justify-center gap-2 shadow-md text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Online Enquiry</span>
                  </button>
                </SheetClose>

                <SheetClose asChild>
                  <Link to="/enquiry" className="block w-full">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 rounded-full flex items-center justify-center gap-2 shadow-lg text-xs sm:text-sm">
                      <span>Submit Enquiry</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </Button>
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

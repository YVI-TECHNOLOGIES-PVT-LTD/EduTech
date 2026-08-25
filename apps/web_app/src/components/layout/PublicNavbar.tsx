import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export interface PublicNavbarProps {
  className?: string;
  sticky?: boolean;
}

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Contact', href: '/contact' },
  { label: 'Enquiry', href: '/enquiry' },
];

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ className, sticky = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLoginActive = location.pathname === '/login';
  const isRegisterActive =
    location.pathname === '/admission/register' ||
    location.pathname === '/register' ||
    location.pathname === '/signup';

  const userRoles =
    user?.roles && user.roles.length > 0
      ? user.roles
      : (user as any)?.role
        ? [(user as any).role]
        : ['PARENT'];
  const isStaff = userRoles.some((r: string) =>
    [
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'STAFF',
      'ADMISSION_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'TEACHER',
      'FINANCE',
      'FINANCE_OFFICER',
      'EXAM_CELL_ADMIN',
      'EXAM_CELL',
    ].includes(r.toUpperCase().replace(/[\s_-]+/g, '_')),
  );
  const portalRedirectPath = isStaff ? '/app/workspace' : '/app/admissions/my';

  return (
    <header
      className={cn(
        'w-full bg-[#042A2B] text-white border-b border-white/10 z-50 transition-all duration-200 shadow-md',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* 1. LEFT: EduTrack Brand Mark & Portal Subtitle */}
        <Link
          to="/"
          className="flex items-center space-x-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B76A] rounded-xl"
        >
          <img
            src="/EduTrack_logo.png"
            alt="EduTrack"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none group-hover:text-[#E7B76A] transition-colors">
              EDUTRACK
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#E7B76A] mt-1">
              Admission Portal
            </span>
          </div>
        </Link>

        {/* 2. CENTER: Public Navigation Links */}
        <nav
          aria-label="Public Navigation"
          className="hidden md:flex items-center space-x-1 lg:space-x-4 text-xs font-bold text-emerald-100/80"
        >
          {PUBLIC_NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-[#E7B76A] bg-white/10 font-extrabold'
                    : 'hover:text-white hover:bg-white/5',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. RIGHT: Authentication Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          <ThemeSwitcher className="text-emerald-100/80 hover:text-white hover:bg-white/10" />

          {isAuthenticated ? (
            <Button
              onClick={() => navigate(portalRedirectPath)}
              size="sm"
              className="h-9 px-4 text-xs font-extrabold rounded-xl bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <>
              {/* Sign In Button */}
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 px-4 text-xs font-bold rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 transition-all',
                    isLoginActive && 'border-[#E7B76A] text-[#E7B76A] bg-white/10',
                  )}
                >
                  <span>Sign In</span>
                </Button>
              </Link>

              {/* Create Account / Apply Now Button */}
              <Link to="/admission/register">
                <Button
                  size="sm"
                  className={cn(
                    'h-9 px-4 text-xs font-extrabold rounded-xl bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]',
                    isRegisterActive && 'ring-2 ring-[#E7B76A]/50',
                  )}
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* 4. MOBILE: Language Switcher & Hamburger Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-1.5">
          <LanguageSwitcher variant="compact" />
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-white hover:text-[#E7B76A] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B76A]"
            aria-expanded={isMobileOpen}
            aria-controls="public-mobile-menu"
            aria-label={isMobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 5. MOBILE ACCESSIBLE DRAWER */}
      {isMobileOpen && (
        <div
          id="public-mobile-menu"
          className="md:hidden border-t border-white/10 bg-[#042A2B]/98 text-white backdrop-blur-xl px-4 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="space-y-1">
            {PUBLIC_NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'block px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors',
                    isActive
                      ? 'bg-white/10 text-[#E7B76A]'
                      : 'text-emerald-100/80 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-white/10 space-y-2">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setIsMobileOpen(false);
                  navigate(portalRedirectPath);
                }}
                className="w-full h-11 bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Portal</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigate('/login');
                  }}
                  variant="outline"
                  className={cn(
                    'w-full h-11 text-xs font-bold rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10',
                    isLoginActive && 'border-[#E7B76A] text-[#E7B76A] bg-white/10',
                  )}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigate('/admission/register');
                  }}
                  className="w-full h-11 bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Admission Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;

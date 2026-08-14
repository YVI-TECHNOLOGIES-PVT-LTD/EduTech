import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Search, Globe, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/search/CommandPalette';
import i18n from '@/i18n';

interface NavbarProps {
  onEnquireClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onEnquireClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
    localStorage.setItem('erp-language', newLang);
  };

  const handleEnquire = () => {
    if (onEnquireClick) {
      onEnquireClick();
    } else {
      navigate('/enquiry');
    }
  };

  return (
    <>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-30">
        {/* School Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-[#E7B76A] text-[#063F40] flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#063F40]" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#E7B76A] transition-colors">
            EDUTRACK
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-6 text-xs font-bold text-emerald-100/80">
          <Link
            to="/about"
            className={location.pathname === '/about' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            About
          </Link>
          <Link
            to="/academics"
            className={location.pathname === '/academics' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            Academics
          </Link>
          <Link
            to="/admissions"
            className={location.pathname === '/admissions' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            Admissions
          </Link>
          <Link
            to="/gallery"
            className={location.pathname === '/gallery' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            Gallery
          </Link>
          <Link
            to="/contact"
            className={location.pathname === '/contact' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            Contact
          </Link>
          <Link
            to="/enquiry"
            className={location.pathname === '/enquiry' ? 'text-[#E7B76A]' : 'hover:text-white transition-colors'}
          >
            Enquiry
          </Link>
        </div>

        {/* Desktop Utility Controls & Primary CTA */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-emerald-100/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Search Site & Modules"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-emerald-200/60 absolute left-2.5 pointer-events-none" />
            <select
              value={currentLang}
              onChange={handleLanguageChange}
              className="h-8 pl-7 pr-2 text-xs font-bold bg-[#082F35] border border-white/15 text-emerald-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E7B76A] cursor-pointer"
              aria-label="Language Selector"
            >
              <option value="en">English (EN)</option>
              <option value="te">Telugu (TE)</option>
            </select>
          </div>

          {/* Login Button */}
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-bold rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 transition-all"
          >
            Login
          </Button>

          {/* Primary Apply Now CTA */}
          <Button
            onClick={() => navigate('/admission/register')}
            size="sm"
            className="h-9 px-4 text-xs font-bold rounded-xl bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] shadow-md flex items-center space-x-1.5"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-[#E7B76A] hover:text-white"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-white hover:text-[#E7B76A] rounded-lg focus:outline-none"
            aria-expanded={isMobileOpen}
            aria-controls="mobile-menu-drawer"
            aria-label={isMobileOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Accessible Mobile Menu Drawer */}
      {isMobileOpen && (
        <div
          id="mobile-menu-drawer"
          className="fixed inset-0 top-16 z-40 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto md:hidden"
        >
          <div className="space-y-4">
            <Link
              to="/about"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              About
            </Link>
            <Link
              to="/academics"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              Academics
            </Link>
            <Link
              to="/admissions"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              Admissions
            </Link>
            <Link
              to="/gallery"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              Gallery
            </Link>
            <Link
              to="/contact"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              Contact
            </Link>
            <Link
              to="/enquiry"
              className="block text-sm font-bold text-slate-200 hover:text-white py-2 border-b border-slate-900"
            >
              Enquiry
            </Link>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Language
              </span>
              <select
                value={currentLang}
                onChange={handleLanguageChange}
                className="h-8 px-3 text-xs font-bold bg-slate-900 border border-slate-800 text-slate-200 rounded-lg"
              >
                <option value="en">English (EN)</option>
                <option value="te">Telugu (TE)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <Button
              onClick={() => {
                setIsMobileOpen(false);
                navigate('/admission/register');
              }}
              className="w-full h-11 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setIsMobileOpen(false);
                navigate('/login');
              }}
              variant="outline"
              className="w-full h-11 text-xs font-bold rounded-xl border-slate-800 text-slate-300 hover:bg-slate-900"
            >
              Parent Portal Sign In
            </Button>
          </div>
        </div>
      )}

      {/* Command Palette Modal Integration */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;


import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { SCHOOL_INFO } from '@/lib/public-constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Column 1: Brand & Contact */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-white block">
                  {SCHOOL_INFO.name}
                </span>
                <span className="text-xs text-slate-400">
                  Est. {SCHOOL_INFO.established} · Excellence in Education
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering curious minds to become confident, ethical, and creative global citizens through holistic academic excellence.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="break-words">EduTrack Campus, Knowledge Park, Academic Zone</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+1 (800) 555-EDUTRACK / +1 (800) 555-3388</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="break-all">admissions@edutrack.edu</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-display">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About EduTrack
                </Link>
              </li>
              <li>
                <Link to="/vision-mission" className="hover:text-white transition-colors">
                  Vision & Mission
                </Link>
              </li>
              <li>
                <Link to="/leadership" className="hover:text-white transition-colors">
                  School Leadership
                </Link>
              </li>
              <li>
                <Link to="/campus" className="hover:text-white transition-colors">
                  Campus Facilities
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  School Events
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-display">
              Academics
            </h3>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/academics#early-years" className="hover:text-white transition-colors">
                  Early Years Foundation
                </Link>
              </li>
              <li>
                <Link to="/academics#primary" className="hover:text-white transition-colors">
                  Primary School (Grades 1-5)
                </Link>
              </li>
              <li>
                <Link to="/academics#middle" className="hover:text-white transition-colors">
                  Middle School (Grades 6-8)
                </Link>
              </li>
              <li>
                <Link to="/academics#senior" className="hover:text-white transition-colors">
                  Senior Secondary (Grades 9-12)
                </Link>
              </li>
              <li>
                <Link to="/faculty" className="hover:text-white transition-colors">
                  Faculty Directory
                </Link>
              </li>
              <li>
                <Link to="/achievements" className="hover:text-white transition-colors">
                  Student Achievements
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Admissions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-display">
              Admissions
            </h3>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/admission-process" className="hover:text-white transition-colors">
                  Admission Guide 2026–27
                </Link>
              </li>
              <li>
                <Link to="/admission-process#eligibility" className="hover:text-white transition-colors">
                  Age & Eligibility
                </Link>
              </li>
              <li>
                <Link to="/admissions#fees" className="hover:text-white transition-colors">
                  Fee Structure
                </Link>
              </li>
              <li>
                <Link to="/admissions/apply" className="hover:text-amber-300 font-bold transition-colors">
                  Apply Online →
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Parent Portal Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-10 mt-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {SCHOOL_INFO.name}. All rights reserved. CBSE Affiliated.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">
              Terms of Use
            </Link>
            <Link to="/sitemap" className="hover:text-slate-400 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

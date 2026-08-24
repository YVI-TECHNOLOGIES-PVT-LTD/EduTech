import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#042A2B] text-slate-400 py-16 border-t border-white/10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5">
            <img
              src="/EduTrack_logo.png"
              alt="EduTrack ERP"
              className="w-8 h-8 object-contain rounded-xl shadow-md"
            />
            <span className="font-extrabold text-sm text-white tracking-tight">EDUTRACK ERP</span>
          </div>
          <p className="text-emerald-100/70 leading-relaxed">
            Next-generation enterprise education management system empowering parents, students, and
            educators.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-[#E7B76A] uppercase tracking-wider text-[11px] mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/academics" className="hover:text-white transition-colors">
                Academic Programs
              </Link>
            </li>
            <li>
              <Link to="/admissions" className="hover:text-white transition-colors">
                Admission Process
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#E7B76A] uppercase tracking-wider text-[11px] mb-4">
            Portals
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/login" className="hover:text-white transition-colors">
                Parent Guardian Portal
              </Link>
            </li>
            <li>
              <Link to="/admission/register" className="hover:text-white transition-colors">
                New Parent Registration
              </Link>
            </li>
            <li>
              <Link to="/enquiry" className="hover:text-white transition-colors">
                Admission Enquiry
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#E7B76A] uppercase tracking-wider text-[11px] mb-4">
            Contact Us
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center space-x-2.5">
              <Phone className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
              <span>+1 (800) 555-0199</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Mail className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
              <span>admissions@edutrack.com</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
              <span>Campus Drive, Innovation Park</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-center text-emerald-100/50">
        <p>© 2026 EduTrack ERP. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

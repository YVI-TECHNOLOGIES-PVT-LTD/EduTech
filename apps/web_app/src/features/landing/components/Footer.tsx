import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              E
            </div>
            <span className="font-extrabold text-sm text-white">EDUTRACK ERP</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Next-generation enterprise education management system empowering parents, students, and
            educators.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Quick Links</h4>
          <ul className="space-y-2">
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
          <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Portals</h4>
          <ul className="space-y-2">
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
          <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3">Contact Us</h4>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>+1 (800) 555-0199</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>admissions@edutrack.com</span>
            </li>
            <li className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus Drive, Innovation Park</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 text-center text-slate-500">
        <p>© 2026 EduTrack ERP. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

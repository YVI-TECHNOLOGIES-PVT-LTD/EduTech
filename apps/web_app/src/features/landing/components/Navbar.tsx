import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onEnquireClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onEnquireClick }) => {
  const navigate = useNavigate();

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-900/40">
          <Sparkles className="w-5 h-5 text-indigo-200" />
        </div>
        <span className="font-extrabold text-base tracking-tight text-white">EDUTRACK</span>
      </Link>

      <div className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-300">
        <Link to="/about" className="hover:text-white transition-colors">
          About
        </Link>
        <Link to="/academics" className="hover:text-white transition-colors">
          Academics
        </Link>
        <Link to="/admissions" className="hover:text-white transition-colors">
          Admissions
        </Link>
        <Link to="/campus" className="hover:text-white transition-colors">
          Campus
        </Link>
        <Link to="/contact" className="hover:text-white transition-colors">
          Contact
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          onClick={onEnquireClick}
          variant="outline"
          className="h-9 text-xs font-bold rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          Enquire
        </Button>
        <Button
          onClick={() => navigate('/login')}
          className="h-9 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30"
        >
          <User className="w-3.5 h-3.5 mr-1.5" />
          Parent Portal
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;

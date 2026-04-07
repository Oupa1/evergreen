import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useSchool } from '../hooks/useSchool';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Academics', href: '/academics' },
  { name: 'Admissions', href: '/admissions' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const { school } = useSchool();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary-600 p-2 rounded-lg group-hover:bg-primary-700 transition-colors">
            {school?.logo_url ? (
              <img src={school.logo_url} alt={school.name} className="w-6 h-6 object-contain" />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          <span className={cn(
            "font-bold text-xl tracking-tight transition-colors",
            scrolled ? "text-slate-900" : "text-white"
          )}>
            {school?.name || 'Evergreen Academy'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary-600',
                location.pathname === link.href
                  ? 'text-primary-600'
                  : scrolled ? 'text-slate-600' : 'text-white/90'
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95",
                scrolled 
                  ? "text-slate-600 hover:text-primary-600" 
                  : "text-white/90 hover:text-white"
              )}
            >
              Login
            </Link>
            <Link
              to="/admissions"
              className="bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className={cn("w-6 h-6", scrolled ? "text-slate-900" : "text-white")} />
          ) : (
            <Menu className={cn("w-6 h-6", scrolled ? "text-slate-900" : "text-white")} />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 p-6 shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'text-lg font-medium py-2 border-b border-slate-50',
                    location.pathname === link.href ? 'text-primary-600' : 'text-slate-600'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/admissions"
                onClick={() => setIsOpen(false)}
                className="bg-primary-600 text-white px-5 py-3 rounded-xl text-center font-semibold mt-4"
              >
                Apply Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-primary-600 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Evergreen Academy</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Empowering students to become innovative thinkers and compassionate leaders in a global society.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-primary-600 hover:text-white transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-primary-600 hover:text-white transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-primary-600 hover:text-white transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-primary-600 hover:text-white transition-all">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-6">Quick Links</h3>
          <ul className="space-y-4">
            <li><Link to="/about" className="hover:text-primary-500 transition-colors">About Our School</Link></li>
            <li><Link to="/academics" className="hover:text-primary-500 transition-colors">Academic Programs</Link></li>
            <li><Link to="/admissions" className="hover:text-primary-500 transition-colors">Admissions Process</Link></li>
            <li><Link to="/contact" className="hover:text-primary-500 transition-colors">Contact Us</Link></li>
            <li><a href="#" className="hover:text-primary-500 transition-colors">Student Portal</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-6">Academics</h3>
          <ul className="space-y-4">
            <li><a href="#" className="hover:text-primary-500 transition-colors">Early Learning</a></li>
            <li><a href="#" className="hover:text-primary-500 transition-colors">Primary Education</a></li>
            <li><a href="#" className="hover:text-primary-500 transition-colors">Secondary School</a></li>
            <li><a href="#" className="hover:text-primary-500 transition-colors">Advanced Placement</a></li>
            <li><a href="#" className="hover:text-primary-500 transition-colors">Extracurriculars</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-6">Contact Info</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-500 shrink-0" />
              <span>123 Education Lane, Knowledge Park, CA 90210</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary-500 shrink-0" />
              <span>+1 (555) 123-4567</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-500 shrink-0" />
              <span>admissions@evergreen.edu</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between gap-4">
        <p>© 2026 Evergreen Academy. All rights reserved.</p>
        <div className="flex gap-6 justify-center md:justify-start">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}

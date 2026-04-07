import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin' | 'super_admin'>('student');
  const [demoStudent, setDemoStudent] = useState<{ id: string; pass: string } | null>(null);
  const [demoTeacher, setDemoTeacher] = useState<{ email: string; pass: string } | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchDemoData = async () => {
      // Fetch demo student
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('student_id, password')
        .limit(1)
        .maybeSingle();
      
      if (sData && !sError) {
        setDemoStudent({ id: sData.student_id, pass: sData.password });
      }

      // Fetch demo teacher
      const { data: tData, error: tError } = await supabase
        .from('teachers')
        .select('email, password')
        .limit(1)
        .maybeSingle();
      
      if (tData && !tError) {
        setDemoTeacher({ email: tData.email, pass: tData.password });
      }
    };
    fetchDemoData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === 'super_admin') {
      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Invalid super admin credentials.');
        return;
      }

      localStorage.setItem('userRole', 'super_admin');
      localStorage.setItem('userEmail', email);
      navigate('/super-admin');
    } else if (role === 'admin') {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Invalid admin credentials. Please check your email and password.');
        return;
      }

      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('school_id', (data.school_id || 1).toString());
      navigate('/admin');
    } else if (role === 'teacher') {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert('Invalid teacher credentials. Please check your email and password.');
        return;
      }

      localStorage.setItem('userRole', 'teacher');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('teacherId', data.id);
      localStorage.setItem('school_id', (data.school_id || 1).toString());
      navigate('/teacher');
    } else {
      // For student, check if student exists in DB by email OR student_id AND check password
      const { data, error } = await supabase
        .from('students')
        .select('id, password, school_id')
        .or(`email.eq.${email},student_id.eq.${email}`)
        .single();

      if (error || !data) {
        alert('Student not found. Please check your Email/ID.');
        return;
      }

      if (data.password !== password) {
        alert('Incorrect password. Please use your 5-digit password.');
        return;
      }

      localStorage.setItem('userRole', 'student');
      localStorage.setItem('studentId', data.id);
      localStorage.setItem('school_id', (data.school_id || 1).toString());
      navigate('/student');
    }
  };

  const fillAdminCredentials = () => {
    setRole('admin');
    setEmail('admin@evergreen.edu');
    setPassword('admin123');
  };

  const fillSuperAdminCredentials = () => {
    setRole('super_admin');
    setEmail('superadmin@system.edu');
    setPassword('superadmin123');
  };

  const fillStudentCredentials = () => {
    if (demoStudent) {
      setRole('student');
      setEmail(demoStudent.id);
      setPassword(demoStudent.pass);
    }
  };

  const fillTeacherCredentials = () => {
    if (demoTeacher) {
      setRole('teacher');
      setEmail(demoTeacher.email);
      setPassword(demoTeacher.pass);
    }
  };

  return (
    <main className="min-h-screen pt-20 flex items-center justify-center bg-slate-50 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl text-white mb-6 shadow-lg shadow-primary-600/20">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Please enter your details to sign in</p>
            
            {/* Clickable Demo Credentials */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button 
                type="button"
                onClick={fillAdminCredentials}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
                  role === 'admin' 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                    : 'bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100'
                }`}
              >
                Demo Admin
              </button>

              <button 
                type="button"
                onClick={fillSuperAdminCredentials}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
                  role === 'super_admin' 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                    : 'bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100'
                }`}
              >
                Demo Super Admin
              </button>
              
              {demoTeacher && (
                <button 
                  type="button"
                  onClick={fillTeacherCredentials}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
                    role === 'teacher' 
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                      : 'bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100'
                  }`}
                >
                  Demo Teacher
                </button>
              )}

              {demoStudent && (
                <button 
                  type="button"
                  onClick={fillStudentCredentials}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 border ${
                    role === 'student' 
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                      : 'bg-primary-50 text-primary-600 border-primary-100 hover:bg-primary-100'
                  }`}
                >
                  Demo Student
                </button>
              )}
            </div>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'student' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole('teacher')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'teacher' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Teacher
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'admin' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole('super_admin')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'super_admin' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Super Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
                {role === 'student' ? 'Email or Accession No./ID' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder={role === 'student' ? "Email or ID" : "name@evergreen.edu"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                Remember me
              </label>
              <a href="#" className="text-primary-600 font-bold hover:text-primary-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 active:scale-[0.98]"
            >
              Sign In <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-slate-500 text-sm">
            Don't have an account? <a href="#" className="text-primary-600 font-bold hover:text-primary-700">Contact Admissions</a>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

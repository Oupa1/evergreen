import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Calendar, GraduationCap, Phone, Mail, MessageSquare,
  Send, Loader2, CheckCheck, ChevronRight, ChevronLeft, AlertCircle,
  Baby, Users, BookOpen, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const GRADES = [
  'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

const emptyForm = {
  studentFirstName: '',
  studentLastName: '',
  dateOfBirth: '',
  gradeApplying: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  additionalInfo: '',
};

type FormKey = keyof typeof emptyForm;

const STEPS = [
  { id: 1, label: 'Learner', icon: Baby, color: 'from-blue-500 to-blue-600' },
  { id: 2, label: 'Guardian', icon: Users, color: 'from-violet-500 to-violet-600' },
  { id: 3, label: 'Confirm', icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
];

function FloatingInput({
  label, name, value, onChange, type = 'text', placeholder, required, icon: Icon
}: {
  label: string; name: FormKey; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; required?: boolean; icon: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative group">
      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none z-10
        ${active ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <input
        name={name} value={value} onChange={onChange} type={type} required={required}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full pl-10 pr-4 pt-5 pb-2 rounded-2xl border text-sm text-slate-800 bg-white outline-none transition-all duration-200
          ${focused ? 'border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}
          placeholder:text-slate-300`}
      />
      <label className={`absolute left-10 transition-all duration-200 pointer-events-none font-medium
        ${active ? 'top-1.5 text-[10px] text-blue-500' : 'top-3.5 text-xs text-slate-400'}`}>
        {label}{required && ' *'}
      </label>
    </div>
  );
}

function FloatingSelect({
  label, name, value, onChange, options, required, icon: Icon
}: {
  label: string; name: FormKey; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; required?: boolean; icon: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative group">
      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none z-10
        ${active ? 'text-blue-500' : 'text-slate-400'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <select
        name={name} value={value}
        onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full pl-10 pr-4 pt-5 pb-2 rounded-2xl border text-sm text-slate-800 bg-white outline-none transition-all duration-200 appearance-none
          ${focused ? 'border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}
          ${!value ? 'text-slate-300' : 'text-slate-800'}`}
      >
        <option value="" disabled>Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <label className={`absolute left-10 transition-all duration-200 pointer-events-none font-medium
        ${active ? 'top-1.5 text-[10px] text-blue-500' : 'top-3.5 text-xs text-slate-400'}`}>
        {label}{required && ' *'}
      </label>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight className="w-4 h-4 rotate-90" />
      </div>
    </div>
  );
}

export default function Admissions() {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.studentFirstName.trim()) return 'Please enter the learner\'s first name.';
      if (!form.studentLastName.trim()) return 'Please enter the learner\'s last name.';
      if (!form.dateOfBirth) return 'Please enter the learner\'s date of birth.';
      if (!form.gradeApplying) return 'Please select the grade applying for.';
    }
    if (step === 2) {
      if (!form.parentName.trim()) return 'Please enter the parent or guardian\'s full name.';
      if (!form.parentPhone.trim()) return 'Please enter a contact phone number.';
    }
    return '';
  };

  const goNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setDir(1);
    setStep(s => s + 1);
    setError('');
  };

  const goBack = () => {
    setDir(-1);
    setStep(s => s - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const school_id = localStorage.getItem('school_id') || '1';
      const { data: school, error: fetchErr } = await supabase.from('schools').select('id, timetable_config').eq('id', school_id).single();
      if (fetchErr) throw fetchErr;
      const current: any[] = school?.timetable_config?.applications || [];
      const newApp = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        ...form,
      };
      const merged = { ...(school?.timetable_config || {}), applications: [...current, newApp] };
      const { error: saveErr } = await supabase.from('schools').update({ timetable_config: merged }).eq('id', school?.id);
      if (saveErr) throw saveErr;
      setSubmitted(true);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12">

      {/* Animated blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
      </div>

      <div className="relative w-full max-w-lg">

        {/* Brand header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Online Admissions
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Apply for Enrolment</h1>
          <p className="text-blue-200/70 text-sm mt-2">Complete the three steps below — it takes under two minutes.</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{ scale: active ? 1.15 : 1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${done ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                        : active ? `bg-gradient-to-br ${s.color} shadow-xl`
                        : 'bg-white/10 border border-white/20'}`}
                  >
                    {done
                      ? <CheckCheck className="w-5 h-5 text-white" />
                      : <s.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/40'}`} />
                    }
                  </motion.div>
                  <span className={`text-xs font-semibold transition-colors ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-white/30'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-16 h-0.5 mb-5 mx-1 transition-all duration-500"
                    style={{ background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-black/30 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="p-10 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-2">
                <CheckCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Application Received!</h2>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Thank you! Our admissions team will review your application and contact you via SMS on the number you provided.
              </p>
              <button onClick={() => { setSubmitted(false); setStep(1); }}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">
                Submit Another Application
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-8 py-7 overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                  {step === 1 && (
                    <motion.div key="step1" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: 'easeInOut' }} className="space-y-4">
                      <div className="mb-2">
                        <h2 className="text-lg font-extrabold text-slate-900">Learner Details</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Tell us about the learner applying.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FloatingInput label="First Name" name="studentFirstName" value={form.studentFirstName}
                          onChange={handleChange} required icon={User} placeholder="" />
                        <FloatingInput label="Last Name" name="studentLastName" value={form.studentLastName}
                          onChange={handleChange} required icon={User} placeholder="" />
                      </div>
                      <FloatingInput label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth}
                        onChange={handleChange} type="date" required icon={Calendar} />
                      <FloatingSelect label="Grade Applying For" name="gradeApplying" value={form.gradeApplying}
                        onChange={handleChange as any} options={GRADES} required icon={GraduationCap} />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: 'easeInOut' }} className="space-y-4">
                      <div className="mb-2">
                        <h2 className="text-lg font-extrabold text-slate-900">Parent / Guardian</h2>
                        <p className="text-xs text-slate-400 mt-0.5">We will use these details to contact you about the application.</p>
                      </div>
                      <FloatingInput label="Full Name" name="parentName" value={form.parentName}
                        onChange={handleChange} required icon={User} />
                      <FloatingInput label="Phone Number (SMS notifications)" name="parentPhone" value={form.parentPhone}
                        onChange={handleChange} required icon={Phone} placeholder="+27 XX XXX XXXX" />
                      <FloatingInput label="Email Address (optional)" name="parentEmail" value={form.parentEmail}
                        onChange={handleChange} type="email" icon={Mail} />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.28, ease: 'easeInOut' }} className="space-y-4">
                      <div className="mb-2">
                        <h2 className="text-lg font-extrabold text-slate-900">Final Details</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Review a summary and add any extra notes.</p>
                      </div>

                      {/* Summary card */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Learner</span>
                          <span className="font-bold text-slate-800">{form.studentFirstName} {form.studentLastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Date of Birth</span>
                          <span className="font-semibold text-slate-700">{form.dateOfBirth || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Grade</span>
                          <span className="font-semibold text-slate-700">{form.gradeApplying || '—'}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 mt-1 flex justify-between">
                          <span className="text-slate-400 font-medium">Guardian</span>
                          <span className="font-bold text-slate-800">{form.parentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Phone</span>
                          <span className="font-semibold text-slate-700">{form.parentPhone}</span>
                        </div>
                        {form.parentEmail && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Email</span>
                            <span className="font-semibold text-slate-700">{form.parentEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="relative">
                        <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} rows={3}
                          placeholder="Any special needs, previous school, or other relevant information…"
                          className="w-full pl-10 pr-4 pt-3 pb-3 rounded-2xl border border-slate-200 text-sm text-slate-700 outline-none
                            focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none placeholder:text-slate-300" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="px-8 pb-8 flex gap-3">
                {step > 1 && (
                  <button type="button" onClick={goBack}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all active:scale-95">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={goNext}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm
                      hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm
                      hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : <><Send className="w-4 h-4" /> Submit Application</>}
                  </button>
                )}
              </div>

              <p className="text-center text-xs text-slate-400 pb-6 px-8">
                Your information is kept confidential and used only for admissions purposes.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

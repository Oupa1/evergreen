import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Calendar, FileText, Send, Loader2, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const steps = [
  {
    title: "Inquiry",
    description: "Fill out our online application form below to start the admissions process.",
    icon: Send
  },
  {
    title: "Application",
    description: "Submit the form along with previous academic records and teacher recommendations.",
    icon: FileText
  },
  {
    title: "Assessment",
    description: "Students participate in age-appropriate assessments and a friendly interview with our faculty.",
    icon: Calendar
  },
  {
    title: "Decision",
    description: "The admissions committee reviews the application and notifies families via SMS.",
    icon: CheckCircle2
  }
];

const GRADES = [
  'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7',
  'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
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

export default function Admissions() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.studentFirstName.trim() || !form.studentLastName.trim() || !form.gradeApplying || !form.parentName.trim() || !form.parentPhone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const school_id = localStorage.getItem('school_id') || '1';
      // Fetch current school record
      const { data: school, error: fetchErr } = await supabase.from('schools').select('id, timetable_config').eq('id', school_id).single();
      if (fetchErr) throw fetchErr;

      const current: any[] = school?.timetable_config?.applications || [];
      const newApp = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        submittedAt: new Date().toISOString(),
        status: 'pending',
        ...form,
      };
      const updated = [...current, newApp];
      const merged = { ...(school?.timetable_config || {}), applications: updated };

      const { error: saveErr } = await supabase.from('schools').update({ timetable_config: merged }).eq('id', school?.id);
      if (saveErr) throw saveErr;

      setSubmitted(true);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="bg-primary-600 py-24 px-6 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Join Our Family
          </motion.h1>
          <p className="text-xl text-primary-100">
            We are excited to welcome new students who are eager to learn, grow, and contribute to our vibrant community.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">The Process</h2>
            <p className="text-4xl font-bold text-slate-900 mb-6">How to Apply</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden lg:block" />
            
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 text-center"
              >
                <div className="w-20 h-20 bg-white border-4 border-primary-50 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-8 shadow-lg">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-16 rounded-[3rem] shadow-xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Application Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Completed Application Form",
              "Birth Certificate Copy",
              "Last 2 Years of School Reports",
              "Teacher Recommendation Letter",
              "Passport-sized Photographs",
              "Immunization Records",
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" />
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Online Application Form */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Apply Online</h2>
            <p className="text-4xl font-bold text-slate-900 mb-4">Submit Your Application</p>
            <p className="text-slate-600">Fill in the form below. We will review your application and contact you via SMS.</p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-12 text-center">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Application Submitted!</h3>
              <p className="text-slate-600 mb-6">Thank you for applying. Our admissions team will review your application and contact you via SMS on the number provided.</p>
              <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 transition-all">
                Submit Another Application
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 md:p-12 space-y-8"
            >
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Student Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">First Name *</label>
                    <input name="studentFirstName" value={form.studentFirstName} onChange={handleChange} required
                      placeholder="Student's first name"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Last Name *</label>
                    <input name="studentLastName" value={form.studentLastName} onChange={handleChange} required
                      placeholder="Student's last name"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Date of Birth *</label>
                    <input name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Grade Applying For *</label>
                    <select name="gradeApplying" value={form.gradeApplying} onChange={handleChange} required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent">
                      <option value="">Select grade…</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Parent / Guardian Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Parent / Guardian Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Full Name *</label>
                    <input name="parentName" value={form.parentName} onChange={handleChange} required
                      placeholder="Parent or guardian full name"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Phone Number * <span className="text-xs font-normal text-slate-400">(SMS notifications)</span></label>
                    <input name="parentPhone" value={form.parentPhone} onChange={handleChange} required
                      placeholder="+27 XX XXX XXXX"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input name="parentEmail" value={form.parentEmail} onChange={handleChange} type="email"
                      placeholder="parent@email.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Additional Information <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} rows={4}
                  placeholder="Any special needs, previous school, or other relevant information…"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none" />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95 disabled:opacity-60">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <><Send className="w-5 h-5" /> Submit Application</>}
              </button>

              <p className="text-xs text-slate-400 text-center">
                By submitting this form you agree to be contacted regarding your application. Your information is kept confidential.
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </main>
  );
}

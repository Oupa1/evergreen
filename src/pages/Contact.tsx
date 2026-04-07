import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import React, { useState } from 'react';
import { useSchool } from '../hooks/useSchool';

export default function Contact() {
  const { school } = useSchool();
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message! We'll get back to you soon.");
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="pt-20">
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Contact Info */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8">Get in Touch</h1>
              <p className="text-xl text-slate-600 mb-12 leading-relaxed">
                Have questions about admissions, programs, or campus life? We're here to help. Reach out to us through any of the channels below.
              </p>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Our Location</h3>
                    <p className="text-slate-600">123 Education Lane, Knowledge Park, CA 90210</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Phone Number</h3>
                    <p className="text-slate-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Email Address</h3>
                    <p className="text-slate-600">{school?.domain ? `info@${school.domain}` : 'info@evergreen.edu'}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Office Hours</h3>
                    <p className="text-slate-600">Mon - Fri: 8:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="John Doe"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="john@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Admissions Inquiry"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                    placeholder="Tell us more about your inquiry..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Send Message <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-[500px] w-full bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Interactive Map Integration</p>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
          alt="Map"
          className="w-full h-full object-cover opacity-20 grayscale"
          referrerPolicy="no-referrer"
        />
      </section>
    </main>
  );
}

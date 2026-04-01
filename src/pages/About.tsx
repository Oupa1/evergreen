import { motion } from 'motion/react';
import { Target, Shield, Eye, Award, Users } from 'lucide-react';

export default function About() {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop"
          alt="About Us"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="relative z-10 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-4"
          >
            About Our School
          </motion.h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto">
            A legacy of excellence and a future of innovation.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Our Purpose</h2>
            <p className="text-4xl font-bold text-slate-900 mb-8">Mission & Vision</p>
            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Our Mission</h3>
                  <p className="text-slate-600 leading-relaxed">
                    To provide a nurturing and challenging environment that empowers students to reach their full potential, fostering a lifelong love for learning and a commitment to global citizenship.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                  <Eye className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Our Vision</h3>
                  <p className="text-slate-600 leading-relaxed">
                    To be a global leader in education, recognized for academic excellence, innovation, and the development of compassionate leaders who shape a better world.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop"
              alt="Students learning"
              className="rounded-[3rem] shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-xl max-w-xs hidden md:block">
              <p className="text-primary-600 font-bold text-4xl mb-2">25+</p>
              <p className="text-slate-600 font-medium">Years of educational excellence in the community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary-400 uppercase tracking-widest mb-4">Core Values</h2>
            <p className="text-4xl font-bold mb-6">What We Stand For</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-6">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Integrity</h3>
              <p className="text-slate-400">We uphold the highest standards of honesty and ethical behavior in everything we do.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-6">
                <Award className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Excellence</h3>
              <p className="text-slate-400">We strive for excellence in academics, arts, sports, and character development.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-6">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community</h3>
              <p className="text-slate-400">We foster a supportive and inclusive environment where every voice is heard and valued.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

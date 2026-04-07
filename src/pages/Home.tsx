import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import { BookOpen, Users, Trophy, Globe, Zap, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSchool } from '../hooks/useSchool';

const features = [
  {
    title: "Academic Excellence",
    description: "Our curriculum is designed to challenge and inspire, preparing students for the world's top universities.",
    icon: BookOpen
  },
  {
    title: "Global Community",
    description: "With students from over 30 countries, we foster an environment of cultural exchange and global citizenship.",
    icon: Globe
  },
  {
    title: "Innovative Learning",
    description: "We integrate cutting-edge technology and modern teaching methodologies into every classroom.",
    icon: Zap
  },
  {
    title: "Holistic Development",
    description: "Beyond academics, we focus on emotional intelligence, physical health, and artistic expression.",
    icon: Heart
  },
  {
    title: "Expert Faculty",
    description: "Our teachers are passionate experts dedicated to mentoring and guiding every student.",
    icon: Users
  },
  {
    title: "Award Winning",
    description: "Consistently ranked among the top schools for innovation, sports, and academic performance.",
    icon: Trophy
  }
];

const news = [
  {
    title: "Science Fair 2026: Innovation at its Best",
    date: "March 15, 2026",
    category: "Events",
    image: "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Evergreen Academy Wins Regional Basketball Finals",
    date: "March 10, 2026",
    category: "Sports",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "New Arts Center to Open This Fall",
    date: "March 5, 2026",
    category: "Campus",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1000&auto=format&fit=crop"
  }
];

export default function Home() {
  const { school } = useSchool();
  return (
    <main>
      <Hero />

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Why Choose Us</h2>
            <p className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">A Foundation for Lifelong Success</p>
            <p className="text-lg text-slate-600">
              We believe every child has unique potential. Our mission is to provide the environment and tools to help them discover and reach it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} title={feature.title} description={feature.description} icon={feature.icon} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center relative z-10">
          <div>
            <p className="text-5xl font-bold mb-2">98%</p>
            <p className="text-primary-100 font-medium uppercase tracking-wider text-sm">University Placement</p>
          </div>
          <div>
            <p className="text-5xl font-bold mb-2">12:1</p>
            <p className="text-primary-100 font-medium uppercase tracking-wider text-sm">Student-Teacher Ratio</p>
          </div>
          <div>
            <p className="text-5xl font-bold mb-2">45+</p>
            <p className="text-primary-100 font-medium uppercase tracking-wider text-sm">Extracurricular Clubs</p>
          </div>
          <div>
            <p className="text-5xl font-bold mb-2">15k+</p>
            <p className="text-primary-100 font-medium uppercase tracking-wider text-sm">Alumni Worldwide</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[40px] border-white rounded-full" />
        </div>
      </section>

      {/* News Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Latest News</h2>
              <p className="text-4xl font-bold text-slate-900">Stay Updated with {school?.name || 'Evergreen Academy'}</p>
            </div>
            <button className="text-primary-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All News <BookOpen className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-2">{item.date}</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to Join Our Community?</h2>
              <p className="text-xl text-slate-400 mb-12">
                Admissions are now open for the 2026-2027 academic year. Schedule a campus tour or start your application today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/admissions"
                  className="bg-primary-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-primary-700 transition-all active:scale-95"
                >
                  Apply Now
                </Link>
                <Link
                  to="/contact"
                  className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all active:scale-95"
                >
                  Visit Campus
                </Link>
              </div>
            </div>
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

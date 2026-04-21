import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import { BookOpen, Users, Trophy, Globe, Zap, Heart, Bell, Image as ImageIcon, ChevronRight } from 'lucide-react';
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

const FALLBACK_NEWS = [
  {
    title: "Science Fair 2026: Innovation at its Best",
    date: "March 15, 2026",
    category: "Events",
    imageUrl: "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "School Wins Regional Basketball Finals",
    date: "March 10, 2026",
    category: "Sports",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "New Arts Centre Opens This Term",
    date: "March 5, 2026",
    category: "Campus",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1000&auto=format&fit=crop"
  }
];

export default function Home() {
  const { school } = useSchool();

  const allNotices: any[] = (school as any)?.timetable_config?.notices || [];
  const visibleNotices = allNotices.filter((n: any) => n.visible);
  const pinnedNotices = visibleNotices.filter((n: any) => n.pinned && n.type === 'notice');
  const regularNotices = visibleNotices.filter((n: any) => !n.pinned && n.type === 'notice');
  const displayNotices = [...pinnedNotices, ...regularNotices].slice(0, 6);
  const galleryItems = visibleNotices.filter((n: any) => n.type === 'gallery').slice(0, 8);
  const useStaticFallback = displayNotices.length === 0;

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

      {/* Notices Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Latest Notices
              </h2>
              <p className="text-4xl font-bold text-slate-900">Stay Updated with {school?.name || 'Our School'}</p>
            </div>
            <Link to="/admissions" className="text-primary-600 font-bold flex items-center gap-2 hover:gap-3 transition-all whitespace-nowrap">
              Apply Now <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(useStaticFallback ? FALLBACK_NEWS : displayNotices.slice(0, 3)).map((item: any, i: number) => (
              <motion.div
                key={item.title || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 bg-slate-100">
                  {(item.imageUrl || item.image) ? (
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bell className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {item.category || 'Notice'}
                    </span>
                  </div>
                  {item.pinned && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">📌 Pinned</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-2">{item.date}</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                {item.content && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{item.content}</p>}
              </motion.div>
            ))}
          </div>

          {/* More notices if more than 3 */}
          {!useStaticFallback && displayNotices.length > 3 && (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayNotices.slice(3).map((item: any, i: number) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-colors"
                >
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section — only shown when admin has posted gallery items */}
      {galleryItems.length > 0 && (
        <section className="py-20 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" /> School Gallery
              </h2>
              <p className="text-4xl font-bold text-slate-900">Life at {school?.name || 'Our School'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item: any, i: number) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative overflow-hidden rounded-2xl bg-slate-200 group ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div>
                      <p className="text-white font-bold text-sm">{item.title}</p>
                      {item.content && <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{item.content}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to Join Our Community?</h2>
              <p className="text-xl text-slate-400 mb-12">
                Admissions are now open for the 2026-2027 academic year. Start your application today.
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

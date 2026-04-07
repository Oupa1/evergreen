import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchool } from '../hooks/useSchool';

export default function Hero() {
  const { school } = useSchool();
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
          alt="School Campus"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-600/20 text-primary-400 rounded-full text-sm font-semibold mb-6 border border-primary-500/30 backdrop-blur-sm">
              Excellence in Education
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-8">
              Nurturing Minds, <br />
              <span className="text-primary-500 italic font-serif">Inspiring Futures.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              At {school?.name || 'Evergreen Academy'}, we provide a world-class education that combines academic rigor with character development and creative exploration.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/admissions"
                className="group bg-primary-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-700 transition-all flex items-center gap-2 shadow-xl shadow-primary-600/20 active:scale-95"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2 active:scale-95">
                <div className="bg-white text-primary-600 p-1 rounded-full">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                Watch Campus Tour
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-16 flex items-center gap-8"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?u=${i}`}
                  alt="Student"
                  className="w-12 h-12 rounded-full border-2 border-slate-900 object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div className="text-slate-300">
              <p className="font-bold text-white">500+ Students</p>
              <p className="text-sm">Joined us this semester</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 right-0 p-12 hidden lg:block">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border border-white/10 rounded-full flex items-center justify-center"
        >
          <div className="w-24 h-24 border border-primary-500/20 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}

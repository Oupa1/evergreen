import { motion } from 'motion/react';
import { BookOpen, FlaskConical, Palette, Music, Dumbbell, Code } from 'lucide-react';

const programs = [
  {
    title: "Early Years Foundation",
    age: "Ages 3-5",
    description: "A play-based curriculum focusing on social, emotional, and cognitive development in a safe, stimulating environment.",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Primary School",
    age: "Ages 6-11",
    description: "Building strong foundations in literacy, numeracy, and inquiry-based learning through a broad and balanced curriculum.",
    icon: FlaskConical,
    color: "bg-primary-50 text-primary-600"
  },
  {
    title: "Secondary School",
    age: "Ages 12-16",
    description: "Preparing students for global qualifications with a focus on critical thinking, research, and independent study.",
    icon: Code,
    color: "bg-purple-50 text-purple-600"
  },
  {
    title: "Arts & Humanities",
    age: "All Ages",
    description: "Fostering creativity through visual arts, drama, and literature, encouraging students to find their unique voice.",
    icon: Palette,
    color: "bg-orange-50 text-orange-600"
  },
  {
    title: "Music & Performance",
    age: "All Ages",
    description: "Comprehensive music programs including individual instrument lessons, choir, and school orchestra.",
    icon: Music,
    color: "bg-pink-50 text-pink-600"
  },
  {
    title: "Physical Education",
    age: "All Ages",
    description: "Promoting health and teamwork through a wide range of sports, from swimming to competitive team games.",
    icon: Dumbbell,
    color: "bg-red-50 text-red-600"
  }
];

export default function Academics() {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="bg-slate-900 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Academic Programs
          </motion.h1>
          <p className="text-xl text-slate-400">
            A diverse and rigorous curriculum designed to inspire curiosity and foster excellence at every stage of development.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, i) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 ${program.color} rounded-2xl flex items-center justify-center mb-8`}>
                  <program.icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  {program.age}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{program.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  {program.description}
                </p>
                <button className="text-primary-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Learn More <BookOpen className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Philosophy */}
      <section className="py-24 px-6 bg-primary-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop"
              alt="Classroom"
              className="rounded-[3rem] shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-4">Our Philosophy</h2>
            <p className="text-4xl font-bold text-slate-900 mb-8">Inquiry-Based Learning</p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We believe that students learn best when they are actively engaged in the learning process. Our teachers act as facilitators, guiding students through questions and exploration rather than just delivering information.
            </p>
            <ul className="space-y-4">
              {[
                "Critical Thinking & Problem Solving",
                "Collaborative Project Work",
                "Real-World Applications",
                "Digital Literacy Integration"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

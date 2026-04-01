import { motion } from 'motion/react';
import { CheckCircle2, Calendar, FileText, Send } from 'lucide-react';

const steps = [
  {
    title: "Inquiry",
    description: "Fill out our online inquiry form to receive more information and schedule a campus tour.",
    icon: Send
  },
  {
    title: "Application",
    description: "Submit the formal application along with previous academic records and teacher recommendations.",
    icon: FileText
  },
  {
    title: "Assessment",
    description: "Students participate in age-appropriate assessments and a friendly interview with our faculty.",
    icon: Calendar
  },
  {
    title: "Decision",
    description: "The admissions committee reviews the application and notifies families of the final decision.",
    icon: CheckCircle2
  }
];

export default function Admissions() {
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
            {/* Connector Line */}
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
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 rounded-[3rem] shadow-xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Application Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Completed Application Form",
              "Birth Certificate Copy",
              "Last 2 Years of School Reports",
              "Teacher Recommendation Letter",
              "Passport-sized Photographs",
              "Application Fee Receipt",
              "Immunization Records",
              "Standardized Test Scores (if any)"
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" />
                <span className="text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <button className="bg-primary-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95">
              Download Prospectus
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

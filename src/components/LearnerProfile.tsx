import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  User, 
  Trophy, 
  AlertCircle, 
  BookOpen, 
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { generateLearnerReport } from '../lib/gemini';

interface LearnerProfileProps {
  student: any;
  results: any[]; // Kept for backward compatibility but will fetch internally
  subjects: any[];
  schoolInfo: any;
  onClose: () => void;
}

export default function LearnerProfile({ student, results: initialResults, subjects, schoolInfo, onClose }: LearnerProfileProps) {
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [studentResults, setStudentResults] = useState<any[]>(initialResults || []);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  const school_id_raw = localStorage.getItem('school_id');
  const school_id = (school_id_raw && school_id_raw !== 'undefined' && !isNaN(Number(school_id_raw))) ? Number(school_id_raw) : 1;

  useEffect(() => {
    const fetchAllStudentResults = async () => {
      setIsLoadingResults(true);
      try {
        const { data, error } = await supabase
          .from('results')
          .select('*')
          .eq('student_id', student.id)
          .eq('school_id', school_id);
        
        if (error) throw error;
        setStudentResults(data || []);
      } catch (error) {
        console.error('Error fetching student results for profile:', error);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchAllStudentResults();
  }, [student.id, school_id]);

  const getMarkColor = (score: number) => {
    if (score >= 80) return 'text-amber-500'; // Gold
    if (score >= 60) return 'text-emerald-600'; // Green
    if (score >= 40) return 'text-blue-600'; // Blue
    return 'text-red-600'; // Red
  };

  const getMarkBg = (score: number) => {
    if (score >= 80) return 'bg-amber-50 border-amber-100';
    if (score >= 60) return 'bg-emerald-50 border-emerald-100';
    if (score >= 40) return 'bg-blue-50 border-blue-100';
    return 'bg-red-50 border-red-100';
  };

  const studentSubjects = subjects.map(sub => {
    const res = studentResults.filter(r => r.subject_id === sub.id);
    const avg = res.length > 0 
      ? res.reduce((acc, curr) => acc + Number(curr.score), 0) / res.length 
      : 0;
    return { name: sub.name, score: avg };
  }).filter(s => s.score > 0);

  useEffect(() => {
    const fetchReport = async () => {
      if (!isLoadingResults && studentSubjects.length > 0) {
        setIsGenerating(true);
        const aiReport = await generateLearnerReport(`${student.first_name} ${student.last_name}`, studentSubjects);
        setReport(aiReport);
        setIsGenerating(false);
      }
    };
    fetchReport();
  }, [student.id, isLoadingResults, studentSubjects.length]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // Primary color
    doc.text(schoolInfo.name || 'School Name', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Learner Academic Profile', pageWidth / 2, 28, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(14, 35, pageWidth - 14, 35);

    // Student Info
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`Name: ${student.first_name} ${student.last_name}`, 14, 45);
    doc.text(`Student ID: ${student.student_id}`, 14, 52);
    doc.text(`Grade: ${student.sections?.grades?.name || '-'}`, 14, 59);
    doc.text(`Section: ${student.sections?.name || '-'}`, 14, 66);
    if (student.phone) {
      doc.text(`Contact: ${student.phone}`, 14, 73);
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 45, { align: 'right' });

    // Academic Performance Table
    const tableStartY = student.phone ? 82 : 75;
    autoTable(doc, {
      startY: tableStartY,
      head: [['Subject', 'Average Mark (%)', 'Status']],
      body: studentSubjects.map(s => [
        s.name,
        `${s.score.toFixed(1)}%`,
        s.score >= 50 ? 'Pass' : 'Fail'
      ]),
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: tableStartY },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // AI Report Section
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text('Academic Insights & Recommendations', 14, finalY + 15);
    
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate 700
    const splitReport = doc.splitTextToSize(report || 'Generating report...', pageWidth - 28);
    doc.text(splitReport, 14, finalY + 25);

    const afterReportY = finalY + 25 + (splitReport.length * 5) + 10;

    // Manual Comments Section
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text('Additional Teacher Comments:', 14, afterReportY);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, afterReportY + 8, pageWidth - 14, afterReportY + 8);
    doc.line(14, afterReportY + 18, pageWidth - 14, afterReportY + 18);
    doc.line(14, afterReportY + 28, pageWidth - 14, afterReportY + 28);

    // Signature and Stamp Section
    const footerSectionY = afterReportY + 45;
    
    // Teacher Signature
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.line(14, footerSectionY, 80, footerSectionY);
    doc.text('Teacher Signature', 14, footerSectionY + 5);

    // Date
    doc.line(100, footerSectionY, 140, footerSectionY);
    doc.text('Date', 100, footerSectionY + 5);

    // School Stamp Box
    doc.setDrawColor(5, 150, 105);
    doc.rect(pageWidth - 64, footerSectionY - 20, 50, 25);
    doc.setFontSize(8);
    doc.text('OFFICIAL SCHOOL STAMP', pageWidth - 60, footerSectionY - 15);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated by ${schoolInfo.name} Management System`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`${student.first_name}_${student.last_name}_Profile.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{student.first_name} {student.last_name}</h2>
              <p className="text-slate-500 font-medium">Student ID: {student.student_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              <p className="text-slate-500 font-medium">Fetching academic records...</p>
            </div>
          ) : (
            <>
              {/* Student Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-slate-400">
                    <User className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Personal Info</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Gender</p>
                      <p className="font-bold text-slate-700">{student.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Grade/Section</p>
                      <p className="font-bold text-slate-700">{student.sections?.grades?.name} - {student.sections?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-slate-400">
                    <Trophy className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Performance Overview</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Overall Average</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {(studentSubjects.reduce((acc, curr) => acc + curr.score, 0) / (studentSubjects.length || 1)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-4 text-slate-400">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Subjects</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Active Subjects</p>
                      <p className="font-bold text-slate-700">{studentSubjects.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Report */}
              <div className="bg-primary-50 rounded-[2rem] border border-primary-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles className="w-24 h-24 text-primary-600" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-primary-900">AI Academic Insights</h3>
                  </div>
                  {isGenerating ? (
                    <div className="flex items-center gap-3 text-primary-600 font-medium">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating personalized report...
                    </div>
                  ) : (
                    <p className="text-primary-800 leading-relaxed font-medium">
                      {report || "No data available to generate report."}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject Breakdown */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  Subject Performance Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentSubjects.map((s, i) => (
                    <div key={i} className={`p-6 rounded-3xl border transition-all hover:shadow-md ${getMarkBg(s.score)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{s.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">Average Performance</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${getMarkColor(s.score)}`}>
                            {s.score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 h-2 bg-white/50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score}%` }}
                          className={`h-full ${getMarkColor(s.score).replace('text-', 'bg-')}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Download, 
  User, 
  Trophy, 
  BookOpen, 
  FileText,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { buildLocalReport } from '../lib/reportEngine';

interface LearnerProfileProps {
  student: any;
  results: any[];
  subjects: any[];
  schoolInfo: any;
  onClose: () => void;
}

export default function LearnerProfile({ student, results: initialResults, subjects, schoolInfo, onClose }: LearnerProfileProps) {
  const [report, setReport] = useState<string>('');
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
          .or(`school_id.eq.${school_id},school_id.is.null`);
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
    if (score >= 80) return 'text-amber-500';
    if (score >= 60) return 'text-emerald-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  };

  const studentSubjects = subjects.map(sub => {
    const res = studentResults.filter(r => r.subject_id === sub.id);
    const avg = res.length > 0
      ? res.reduce((acc, curr) => acc + Number(curr.score), 0) / res.length
      : 0;
    return { name: sub.name, score: avg };
  }).filter(s => s.score > 0);

  const [reportError, setReportError] = useState<string>('');

  const handleGenerateReport = () => {
    if (studentSubjects.length === 0) return;
    setReportError('');
    const fullName = `${student.last_name} ${student.first_name}`.trim();
    const text = buildLocalReport(fullName, studentSubjects);
    setReport(text);
  };

  // Auto-generate report once results are loaded
  useEffect(() => {
    if (!isLoadingResults && studentSubjects.length > 0) {
      handleGenerateReport();
    }
  }, [isLoadingResults]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
    doc.text(schoolInfo.name || 'School Name', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('Learner Academic Profile', pageWidth / 2, 28, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, pageWidth - 14, 35);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Name: ${student.first_name} ${student.last_name}`, 14, 45);
    doc.text(`Student ID: ${student.student_id}`, 14, 52);
    doc.text(`Grade: ${student.sections?.grades?.name || '-'}`, 14, 59);
    doc.text(`Section: ${student.sections?.name || '-'}`, 14, 66);
    if (student.phone) {
      doc.text(`Contact: ${student.phone}`, 14, 73);
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 45, { align: 'right' });

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

    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text('Academic Insights & Recommendations', 14, finalY + 15);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const splitReport = doc.splitTextToSize(report || 'No AI insight generated yet.', pageWidth - 28);
    doc.text(splitReport, 14, finalY + 25);

    const afterReportY = finalY + 25 + (splitReport.length * 5) + 10;

    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text('Additional Teacher Comments:', 14, afterReportY);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, afterReportY + 8, pageWidth - 14, afterReportY + 8);
    doc.line(14, afterReportY + 18, pageWidth - 14, afterReportY + 18);
    doc.line(14, afterReportY + 28, pageWidth - 14, afterReportY + 28);

    const footerSectionY = afterReportY + 45;
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.line(14, footerSectionY, 80, footerSectionY);
    doc.text('Teacher Signature', 14, footerSectionY + 5);
    doc.line(100, footerSectionY, 140, footerSectionY);
    doc.text('Date', 100, footerSectionY + 5);
    doc.setDrawColor(5, 150, 105);
    doc.rect(pageWidth - 64, footerSectionY - 20, 50, 25);
    doc.setFontSize(8);
    doc.text('OFFICIAL SCHOOL STAMP', pageWidth - 60, footerSectionY - 15);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
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
                  <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-primary-900">AI Academic Insights</h3>
                    </div>
                    {studentSubjects.length > 0 && (
                      <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate
                      </button>
                    )}
                  </div>

                  {report ? (
                    <p className="text-primary-800 leading-relaxed font-medium">{report}</p>
                  ) : (
                    <p className="text-primary-400 text-sm italic">
                      {studentSubjects.length === 0
                        ? 'No subject results available to analyse.'
                        : 'Loading insights…'}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject Breakdown — grouped by level band */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  Subject Performance by Level Group
                </h3>
                {(() => {
                  const levelGroups = [
                    {
                      key: '7',
                      label: 'Outstanding Achievement',
                      sub: 'Level 7',
                      range: '80–100%',
                      filter: (s: any) => s.score >= 80,
                      headerCls: 'bg-amber-500 text-white',
                      cardCls: 'bg-amber-50 border-amber-200',
                      barCls: 'bg-amber-500',
                      scoreCls: 'text-amber-600',
                      badgeCls: 'bg-amber-100 text-amber-700',
                    },
                    {
                      key: '5-6',
                      label: 'Substantial / Meritorious',
                      sub: 'Levels 5–6',
                      range: '60–79%',
                      filter: (s: any) => s.score >= 60 && s.score < 80,
                      headerCls: 'bg-emerald-600 text-white',
                      cardCls: 'bg-emerald-50 border-emerald-200',
                      barCls: 'bg-emerald-500',
                      scoreCls: 'text-emerald-600',
                      badgeCls: 'bg-emerald-100 text-emerald-700',
                    },
                    {
                      key: '3-4',
                      label: 'Moderate / Adequate',
                      sub: 'Levels 3–4',
                      range: '40–59%',
                      filter: (s: any) => s.score >= 40 && s.score < 60,
                      headerCls: 'bg-blue-600 text-white',
                      cardCls: 'bg-blue-50 border-blue-200',
                      barCls: 'bg-blue-500',
                      scoreCls: 'text-blue-600',
                      badgeCls: 'bg-blue-100 text-blue-700',
                    },
                    {
                      key: '1-2',
                      label: 'Not Achieved / Elementary',
                      sub: 'Levels 1–2',
                      range: '0–39%',
                      filter: (s: any) => s.score < 40,
                      headerCls: 'bg-red-500 text-white',
                      cardCls: 'bg-red-50 border-red-200',
                      barCls: 'bg-red-500',
                      scoreCls: 'text-red-600',
                      badgeCls: 'bg-red-100 text-red-700',
                    },
                  ];
                  const populated = levelGroups.filter(g => studentSubjects.some(g.filter));
                  if (populated.length === 0) return (
                    <p className="text-slate-400 text-sm">No subject results available.</p>
                  );
                  return (
                    <div className="space-y-5">
                      {levelGroups.map(group => {
                        const subs = studentSubjects.filter(group.filter);
                        if (subs.length === 0) return null;
                        return (
                          <div key={group.key} className="rounded-3xl border overflow-hidden" style={{ borderColor: 'transparent' }}>
                            <div className={`flex items-center justify-between px-5 py-3 ${group.headerCls}`}>
                              <div>
                                <span className="font-black text-sm tracking-wide">{group.label}</span>
                                <span className="ml-2 text-xs opacity-75">({group.sub})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs opacity-75">{group.range}</span>
                                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{subs.length} subject{subs.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white border border-t-0 border-slate-100 rounded-b-3xl">
                              {subs.map((s, i) => (
                                <div key={i} className={`p-5 rounded-2xl border transition-all hover:shadow-sm ${group.cardCls}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.badgeCls}`}>{group.sub}</span>
                                    </div>
                                    <span className={`text-2xl font-black ${group.scoreCls}`}>{s.score.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(s.score, 100)}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                      className={`h-full rounded-full ${group.barCls}`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

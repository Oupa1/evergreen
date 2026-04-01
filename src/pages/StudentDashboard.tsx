import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  MessageSquare, 
  Bell, 
  Search,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  LogOut,
  Download,
  Lightbulb,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student, Result, Subject } from '../types';
import * as XLSX from 'xlsx';

type Tab = 'overview' | 'results' | 'timetable';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Break', 'Period 4', 'Period 5', 'Lunch', 'Period 6', 'Period 7'];

  useEffect(() => {
    fetchStudentData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchStudentData(true);
        setLastRefreshed(new Date());
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchStudentData(silent = false) {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*, sections(id, name, grades(name))')
        .eq('id', studentId)
        .single();

      if (studentData) {
        setStudent(studentData);
        
        // Fetch results for this student
        const { data: resultsData } = await supabase
          .from('results')
          .select('*, subjects(name, code, pass_mark), tasks(name, total_marks)')
          .eq('student_id', studentData.id);
        
        if (resultsData) setResults(resultsData);

        // Fetch subjects assigned to this student's section
        const { data: classSubjects } = await supabase
          .from('class_subjects')
          .select('*, subjects(*)')
          .eq('section_id', studentData.section_id);
        
        if (classSubjects) {
          setSubjects(classSubjects.map((cs: any) => cs.subjects));
        }

        // Fetch timetable for this student's section
        const { data: timetableData } = await supabase
          .from('timetable_allocations')
          .select('*, subjects(name, code), teachers(first_name, last_name)')
          .eq('section_id', studentData.section_id);
        
        if (timetableData) setTimetable(timetableData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('studentId');
    navigate('/login');
  };

  const downloadReport = () => {
    if (!student || filteredResults.length === 0) {
      alert('No results available for the selected term and year.');
      return;
    }

    const reportData = filteredResults.map(r => ({
      'Subject': r.subjects?.name,
      'Task': r.tasks?.name || 'Final Mark',
      'Score (%)': r.score,
      'Pass Mark (%)': r.subjects?.pass_mark || 50,
      'Level': getLevel(Number(r.score)).level,
      'Status': Number(r.score) >= (r.subjects?.pass_mark || 50) ? 'Pass' : 'Fail'
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedTerm} ${selectedYear}`);
    XLSX.writeFile(wb, `${student.first_name}_${student.last_name}_${selectedTerm}_${selectedYear}_Report.xlsx`);
  };

  const getLevel = (score: number) => {
    if (score >= 80) return { level: 7, label: 'Outstanding' };
    if (score >= 70) return { level: 6, label: 'Meritorious' };
    if (score >= 60) return { level: 5, label: 'Substantial' };
    if (score >= 50) return { level: 4, label: 'Adequate' };
    if (score >= 40) return { level: 3, label: 'Moderate' };
    if (score >= 30) return { level: 2, label: 'Elementary' };
    return { level: 1, label: 'Not Achieved' };
  };

  const getRecommendations = (score: number, subject: string, passMark: number = 50) => {
    if (score >= 80) {
      return [
        `Excellent work in ${subject}! Keep maintaining this standard.`,
        "Consider helping peers who might be struggling to reinforce your own understanding.",
        "Look into advanced topics or extra-curricular projects related to this subject."
      ];
    } else if (score >= 70) {
      return [
        `Meritorious performance in ${subject}. You're doing very well.`,
        "Focus on the finer details to push your score even higher.",
        "Explore more complex problem-solving in this area."
      ];
    } else if (score >= passMark) {
      return [
        `Good performance in ${subject}. You've passed, but there's room for growth.`,
        "Review the topics where you lost marks in recent assessments.",
        "Practice more past papers to get familiar with different question formats."
      ];
    } else if (score >= 30) {
      return [
        `Fair performance in ${subject}. You need to strengthen your foundational knowledge.`,
        "Schedule regular study sessions specifically for this subject.",
        "Don't hesitate to ask your teacher for clarification on difficult concepts."
      ];
    } else {
      return [
        `Urgent attention needed in ${subject}. Your current score is below the passing threshold.`,
        "Create a strict daily revision plan for this subject.",
        "Seek immediate tutoring or extra help from your teacher.",
        "Focus on understanding the core principles before moving to complex problems."
      ];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Student Profile Found</h2>
        <p className="text-slate-500 mb-6">Please contact the administrator to set up your account.</p>
        <button onClick={handleLogout} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold">
          Go Back to Login
        </button>
      </div>
    );
  }

  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const filteredResults = results.filter(r => r.term === selectedTerm && r.year.toString() === selectedYear);

  const averageScore = filteredResults.length > 0 
    ? (filteredResults.reduce((acc, curr) => acc + Number(curr.score), 0) / filteredResults.length).toFixed(1)
    : 'N/A';
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-primary-600">
            <GraduationCap className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Evergreen</span>
            <span className="ml-auto text-[10px] text-slate-400 font-normal">Updated: {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'overview' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'results' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="w-5 h-5" />
            My Results
          </button>
          <button 
            onClick={() => setActiveTab('timetable')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'timetable' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Timetable
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resources</div>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <BookOpen className="w-5 h-5" />
            My Courses
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <FileText className="w-5 h-5" />
            Assignments
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
            <MessageSquare className="w-5 h-5" />
            Messages
          </a>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-slate-500">{student.sections?.grades?.name} - {student.sections?.name}</p>
              {student.student_id && <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {student.student_id}</p>}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-900 hidden md:block">Student Portal</h1>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden lg:flex flex-col items-end mr-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-primary-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {autoRefresh ? 'Auto-refreshing (5s)' : 'Manual refresh only'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Last updated: {lastRefreshed.toLocaleTimeString()}</span>
            </div>

            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                autoRefresh 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
              {autoRefresh ? 'On' : 'Off'}
            </button>

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <button className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'overview' && (
            <>
              {/* Welcome Banner */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary-600 rounded-[2.5rem] p-8 md:p-12 text-white mb-8 relative overflow-hidden"
              >
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">Welcome back, {student.first_name}! 👋</h2>
                  <p className="text-primary-100 max-w-md">You are doing great in your studies. Check your latest results below.</p>
                  <button 
                    onClick={() => setActiveTab('timetable')}
                    className="mt-6 px-6 py-3 bg-white text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                  >
                    View My Schedule
                  </button>
                </div>
                <GraduationCap className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-primary-500/20 rotate-[-15deg]" />
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Current Courses */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Current Courses</h3>
                      <button className="text-primary-600 font-bold text-sm">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjects.map((subject, i) => (
                        <div key={i} className="p-4 border border-slate-100 rounded-2xl hover:border-primary-200 transition-colors cursor-pointer group">
                          <p className="font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">{subject.name}</p>
                          <p className="text-xs text-slate-400 mb-2">Code: {subject.code}</p>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-primary-600`} style={{ width: `100%` }} />
                          </div>
                          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                            <span>Status</span>
                            <span>Enrolled</span>
                          </div>
                        </div>
                      ))}
                      {subjects.length === 0 && (
                        <p className="text-sm text-slate-400 col-span-2 text-center py-8">No subjects assigned yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Results */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-900">Recent Results</h3>
                      <button 
                        onClick={() => setActiveTab('results')}
                        className="text-primary-600 font-bold text-sm flex items-center gap-1"
                      >
                        View Full Report <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {results.slice(0, 5).map((result, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-primary-50 text-primary-600`}>
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{result.subjects?.name}</p>
                              <p className="text-sm text-slate-500">{result.tasks?.name || result.term} - {result.year}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${result.score >= (result.subjects?.pass_mark || 50) ? 'text-emerald-600' : 'text-red-600'}`}>
                              {result.score}%
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Level {getLevel(result.score).level}</p>
                          </div>
                        </div>
                      ))}
                      {results.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">No results uploaded yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                  {/* Performance Card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Performance</h3>
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary-500 border-t-slate-100 rotate-45 mb-4">
                        <span className="text-3xl font-bold text-slate-900 -rotate-45">{averageScore}</span>
                      </div>
                      <p className="text-slate-500 font-medium">Average Score</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mt-6">
                      <div className="p-4 bg-slate-50 rounded-2xl text-center">
                        <p className="text-2xl font-bold text-slate-900">{results.length}</p>
                        <p className="text-xs text-slate-500">Tests Taken</p>
                      </div>
                    </div>
                  </div>

                  {/* Announcements */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Announcements</h3>
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Bell className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm">No new announcements</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'results' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Academic Results</h2>
                    <p className="text-sm text-slate-500 mt-1">Comprehensive view of your academic performance</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select 
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {[0, 1, 2].map(offset => {
                        const year = new Date().getFullYear() - offset;
                        return <option key={year} value={year.toString()}>{year}</option>;
                      })}
                    </select>
                    <button 
                      onClick={downloadReport}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                    >
                      <Download className="w-4 h-4" /> Download Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100">
                    <p className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">Average Mark</p>
                    <h3 className="text-3xl font-black text-primary-900">{averageScore}%</h3>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">Subjects Passed</p>
                    <h3 className="text-3xl font-black text-emerald-900">
                      {filteredResults.filter(r => Number(r.score) >= (r.subjects?.pass_mark || 50)).length} / {subjects.length}
                    </h3>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">Current Level</p>
                    <h3 className="text-3xl font-black text-amber-900">
                      Level {getLevel(Number(averageScore)).level}
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Subject</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Task/Assessment</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Score</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Pass Mark</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Level</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {subjects.map((subject) => {
                        const subjectResult = filteredResults.find(r => r.subject_id === subject.id);
                        const passMark = subject.pass_mark || 50;
                        
                        return (
                          <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                  {subject.name[0]}
                                </div>
                                <span className="font-bold text-slate-900">{subject.name}</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-slate-600">
                              {subjectResult?.tasks?.name || 'Final Mark'}
                            </td>
                            <td className="py-4 text-center">
                              {subjectResult ? (
                                <span className={`font-bold ${Number(subjectResult.score) >= passMark ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {subjectResult.score}%
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-sm">No marks captured</span>
                              )}
                            </td>
                            <td className="py-4 text-center text-sm text-slate-500">
                              {passMark}%
                            </td>
                            <td className="py-4 text-center">
                              {subjectResult ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  Number(subjectResult.score) >= passMark ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  Level {getLevel(Number(subjectResult.score)).level}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-4">
                              {subjectResult ? (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  Number(subjectResult.score) >= passMark ? 'bg-green-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>
                                  {Number(subjectResult.score) >= passMark ? 'Pass' : 'Fail'}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {subjects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No subjects assigned to your class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Study Recommendations</h3>
                  </div>
                  <div className="space-y-6">
                    {results.length > 0 ? (
                      // Group results by subject and get the latest/lowest for recommendation
                      (Array.from(new Set(results.map(r => r.subjects?.name))) as string[]).slice(0, 3).map((subjectName, idx) => {
                        const subjectResults = results.filter(r => r.subjects?.name === subjectName);
                        const latestScore = Number(subjectResults[subjectResults.length - 1].score);
                        const passMark = subjectResults[subjectResults.length - 1].subjects?.pass_mark || 50;
                        const recs = getRecommendations(latestScore, subjectName, passMark);
                        
                        return (
                          <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                              <p className="font-bold text-slate-900">{subjectName}</p>
                              <span className={`text-sm font-bold ${latestScore >= passMark ? 'text-emerald-600' : 'text-red-600'}`}>
                                {latestScore}%
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {recs.map((rec, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-400 text-center py-8">Upload results to see personalized recommendations.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Performance Insights</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Overall Average</p>
                      <p className="text-3xl font-bold text-slate-900">{averageScore}%</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Best Subject</p>
                      <p className="text-xl font-bold text-primary-600">
                        {results.length > 0 
                          ? results.reduce((prev, current) => (Number(prev.score) > Number(current.score)) ? prev : current).subjects?.name
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-sm text-slate-500 mb-1">Focus Needed In</p>
                      <p className="text-xl font-bold text-red-600">
                        {results.length > 0 
                          ? results.reduce((prev, current) => (Number(prev.score) < Number(current.score)) ? prev : current).subjects?.name
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'timetable' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Class Timetable</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {student.sections?.grades?.name} - {student.sections?.name}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Period</th>
                        {DAYS.map(day => (
                          <th key={day} className="p-4 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERIODS.map(period => (
                        <tr key={period}>
                          <td className="p-4 border border-slate-100 font-bold text-slate-700 bg-slate-50/50 text-sm">
                            {period}
                          </td>
                          {DAYS.map(day => {
                            const allocation = timetable.find(t => t.day === day && t.period === period);
                            const isBreak = period === 'Break' || period === 'Lunch';
                            
                            return (
                              <td key={`${day}-${period}`} className={`p-4 border border-slate-100 min-w-[150px] ${isBreak ? 'bg-slate-50' : ''}`}>
                                {isBreak ? (
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-center italic">{period}</span>
                                ) : allocation ? (
                                  <div className="space-y-1">
                                    <p className="text-sm font-bold text-primary-700">{allocation.subjects?.name}</p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {allocation.teachers?.first_name} {allocation.teachers?.last_name}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-300 italic">Free Period</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

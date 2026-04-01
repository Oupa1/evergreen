import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  LogOut, 
  ChevronRight, 
  Search, 
  Bell, 
  Plus, 
  FileText, 
  CheckCircle, 
  Trophy, 
  Clock, 
  Video,
  ClipboardList,
  Upload,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

type Tab = 'overview' | 'results' | 'attendance' | 'tasks' | 'timetable' | 'meetings';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const teacherId = localStorage.getItem('teacherId');
    const role = localStorage.getItem('userRole');

    if (!teacherId || role !== 'teacher') {
      navigate('/login');
      return;
    }

    fetchTeacherData(teacherId);
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchTeacherData(teacherId, true);
        setLastRefreshed(new Date());
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [navigate, autoRefresh]);

  const fetchTeacherData = async (id: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch teacher info
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .single();
      
      setTeacher(teacherData);

      // Fetch assigned classes (where teacher is class teacher OR teaches a subject)
      const { data: classTeacherData } = await supabase
        .from('sections')
        .select('*, grades(name)')
        .eq('class_teacher_id', id);

      const { data: subjectTeacherData } = await supabase
        .from('class_subjects')
        .select('section_id, sections(*, grades(name))')
        .eq('teacher_id', id);

      const uniqueClasses = new Map();
      classTeacherData?.forEach(c => uniqueClasses.set(c.id, { ...c, isClassTeacher: true }));
      subjectTeacherData?.forEach(s => {
        if (!uniqueClasses.has(s.section_id)) {
          uniqueClasses.set(s.section_id, { ...s.sections, isClassTeacher: false });
        }
      });

      const classesList = Array.from(uniqueClasses.values());
      setAssignedClasses(classesList);
      
      if (classesList.length > 0) {
        setSelectedClass(classesList[0]);
      }

      // Fetch meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });
      setMeetings(meetingsData || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass, attendanceDate]);

  const fetchClassData = async () => {
    if (!selectedClass) return;

    try {
      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('section_id', selectedClass.id);
      setStudents(studentsData || []);

      // Fetch subjects for this class
      const { data: classSubjectsData } = await supabase
        .from('class_subjects')
        .select('*, subjects(*)')
        .eq('section_id', selectedClass.id);
      setSubjects(classSubjectsData?.map(cs => cs.subjects) || []);

      // Fetch results
      const { data: resultsData } = await supabase
        .from('results')
        .select('*, students(*), subjects(*), tasks(*)')
        .in('student_id', studentsData?.map(s => s.id) || []);
      setResults(resultsData || []);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, subjects(*)')
        .eq('section_id', selectedClass.id);
      setTasks(tasksData || []);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*, subjects(*)')
        .eq('section_id', selectedClass.id);
      setLessons(lessonsData || []);

      // Fetch timetable
      const { data: timetableData } = await supabase
        .from('timetable_allocations')
        .select('*, subjects(*)')
        .eq('section_id', selectedClass.id);
      setTimetable(timetableData || []);

      // Fetch attendance for selected date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('section_id', selectedClass.id)
        .eq('date', attendanceDate);
      setAttendance(attendanceData || []);

    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  const handleMarkAttendance = (studentId: string, status: string) => {
    if (!selectedClass) return;
    const existing = attendance.find(a => a.student_id === studentId);
    if (existing) {
      setAttendance(attendance.map(a => a.student_id === studentId ? { ...a, status } : a));
    } else {
      setAttendance([...attendance, { 
        student_id: studentId, 
        section_id: selectedClass.id, 
        date: attendanceDate, 
        status,
        remarks: ''
      }]);
    }
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    if (!selectedClass) return;
    const existing = attendance.find(a => a.student_id === studentId);
    if (existing) {
      setAttendance(attendance.map(a => a.student_id === studentId ? { ...a, remarks } : a));
    } else {
      setAttendance([...attendance, { 
        student_id: studentId, 
        section_id: selectedClass.id, 
        date: attendanceDate, 
        status: 'Present', // Default status if not set
        remarks
      }]);
    }
  };

  const saveAttendance = async () => {
    if (!selectedClass?.isClassTeacher) return;
    setSavingAttendance(true);
    try {
      // Upsert all attendance records for the current date and section
      const { error } = await supabase
        .from('attendance')
        .upsert(attendance.map(a => ({
          student_id: a.student_id,
          section_id: a.section_id,
          date: a.date,
          status: a.status,
          remarks: a.remarks
        })), { onConflict: 'student_id,date' });

      if (error) throw error;
      alert('Attendance saved successfully!');
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance: ' + error.message);
    } finally {
      setSavingAttendance(false);
    }
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

  const getPassMark = (subjectId: string) => {
    // We need to fetch subjects in TeacherDashboard too if not already there
    // For now, let's assume 50 if not found, but I'll add subjects fetching
    return 50; 
  };

  const getTeacherRecommendations = () => {
    if (results.length === 0) return [];

    const recommendations = [];
    const classAverage = results.reduce((acc, curr) => acc + Number(curr.score), 0) / results.length;

    if (classAverage < 50) {
      recommendations.push("The class average is below the pass mark. Consider reviewing core concepts with the entire class.");
    }

    // Find subjects where students are struggling
    const subjectAverages = subjects.map(s => {
      const subjectResults = results.filter(r => r.subject_id === s.id);
      const avg = subjectResults.length > 0 
        ? subjectResults.reduce((acc, r) => acc + r.score, 0) / subjectResults.length 
        : 0;
      return { name: s.name, avg, passMark: s.pass_mark || 50 };
    });

    const strugglingSubjects = subjectAverages.filter(s => s.avg < s.passMark);
    if (strugglingSubjects.length > 0) {
      recommendations.push(`Students are struggling with ${strugglingSubjects.map(s => s.name).join(', ')}. Additional support or revision sessions might be needed.`);
    }

    // Attendance correlation
    const lowAttendanceStudents = students.filter(s => {
      const studentAttendance = attendance.filter(a => a.student_id === s.id);
      const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
      const rate = studentAttendance.length > 0 ? (presentCount / studentAttendance.length) * 100 : 100;
      return rate < 75;
    });

    if (lowAttendanceStudents.length > 0) {
      recommendations.push(`${lowAttendanceStudents.length} students have attendance below 75%. This may be impacting their academic performance.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("The class is performing well overall. Continue with the current teaching strategy.");
      recommendations.push("Consider introducing more challenging material for top achievers.");
    }

    return recommendations;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getBestAchievers = () => {
    const studentAverages = students.map(student => {
      const studentResults = results.filter(r => r.student_id === student.id);
      const avg = studentResults.length > 0 
        ? studentResults.reduce((acc, curr) => acc + Number(curr.score), 0) / studentResults.length 
        : 0;
      return { ...student, average: avg };
    });
    return studentAverages.sort((a, b) => b.average - a.average).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium animate-pulse">Loading Teacher Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Teacher Portal</h2>
              <p className="text-xs text-slate-500">Evergreen Academy</p>
              <p className="text-[10px] text-slate-400 mt-1">Last updated: {lastRefreshed.toLocaleTimeString()}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'results', icon: Trophy, label: 'Results' },
              { id: 'attendance', icon: ClipboardList, label: 'Attendance' },
              { id: 'tasks', icon: FileText, label: 'Tasks & Lessons' },
              { id: 'timetable', icon: Calendar, label: 'Timetable' },
              { id: 'meetings', icon: Bell, label: 'Meetings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {teacher?.first_name}</h1>
            <p className="text-slate-500 mt-1">Manage your classes and track student performance.</p>
          </div>

          <div className="flex items-center gap-4">
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

            <div className="relative">
              <select
                value={selectedClass?.id || ''}
                onChange={(e) => setSelectedClass(assignedClasses.find(c => c.id === e.target.value))}
                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
              >
                {assignedClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.grades?.name} - {c.name} {c.isClassTeacher ? '(Class Teacher)' : ''}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Students', value: students.length, icon: Users, color: 'bg-blue-500' },
                    { label: 'Class Average', value: `${(results.reduce((acc, curr) => acc + Number(curr.score), 0) / (results.length || 1)).toFixed(1)}%`, icon: Trophy, color: 'bg-amber-500' },
                    { label: 'Active Tasks', value: tasks.length, icon: FileText, color: 'bg-emerald-500' },
                    { label: 'Today\'s Attendance', value: `${((attendance.filter(a => a.status === 'Present').length / (students.length || 1)) * 100).toFixed(0)}%`, icon: CheckCircle, color: 'bg-purple-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Best Achievers */}
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Top 5 Achievers
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {getBestAchievers().map((student, i) => (
                          <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-100">
                                {i + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{student.first_name} {student.last_name}</h4>
                                <p className="text-xs text-slate-500">ID: {student.student_id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-primary-600">{student.average.toFixed(1)}%</span>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Meeting Reminders */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-600" />
                        Meeting Reminders
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {meetings.length > 0 ? meetings.map((meeting) => (
                          <div key={meeting.id} className="p-4 border border-slate-100 rounded-2xl hover:border-primary-200 transition-colors">
                            <h4 className="font-bold text-slate-900 text-sm">{meeting.title}</h4>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {new Date(meeting.date).toLocaleDateString()} at {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Video className="w-3 h-3" />
                              {meeting.location}
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-slate-400 text-sm italic">No upcoming meetings</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Recommendations */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Class Insights & Recommendations
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {getTeacherRecommendations().map((rec, i) => (
                          <div key={i} className="flex gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <p className="text-xs text-amber-900 font-medium leading-relaxed">{rec}</p>
                          </div>
                        ))}
                        {results.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-4">Upload results to see class insights</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-900">Class Academic Performance</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                      <Search className="w-4 h-4" />
                      Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20">
                      <Upload className="w-4 h-4" />
                      Export Report
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Level</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                {r.students?.first_name[0]}
                              </div>
                              <span className="font-bold text-slate-900">{r.students?.first_name} {r.students?.last_name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-slate-600 font-medium">{r.subjects?.name}</td>
                          <td className="px-8 py-4 text-sm text-slate-600">{r.tasks?.name || 'General'}</td>
                          <td className="px-8 py-4">
                            <span className={`font-bold ${Number(r.score) >= (r.subjects?.pass_mark || 50) ? 'text-green-600' : 'text-red-600'}`}>
                              {r.score}%
                            </span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            {(() => {
                              const levelInfo = getLevel(Number(r.score));
                              return (
                                <div className="flex flex-col items-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    Number(r.score) >= (r.subjects?.pass_mark || 50) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    Level {levelInfo.level}
                                  </span>
                                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">{levelInfo.label}</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              Number(r.score) >= (r.subjects?.pass_mark || 50) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {Number(r.score) >= (r.subjects?.pass_mark || 50) ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Mark Attendance</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input 
                          type="date" 
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(attendanceDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!selectedClass?.isClassTeacher && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100">
                        <AlertCircle className="w-4 h-4" />
                        Only Class Teachers can mark attendance
                      </div>
                    )}
                    <button
                      onClick={saveAttendance}
                      disabled={!selectedClass?.isClassTeacher || savingAttendance}
                      className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingAttendance ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Save Attendance
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map((student) => {
                        const record = attendance.find(a => a.student_id === student.id);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-slate-900">{student.first_name} {student.last_name}</span>
                              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">{student.student_id}</p>
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-2">
                                {[
                                  { id: 'Present', color: 'bg-emerald-500' },
                                  { id: 'Absent', color: 'bg-red-500' },
                                  { id: 'Late', color: 'bg-amber-500' },
                                  { id: 'Excused', color: 'bg-blue-500' }
                                ].map((status) => (
                                  <button
                                    key={status.id}
                                    disabled={!selectedClass?.isClassTeacher}
                                    onClick={() => handleMarkAttendance(student.id, status.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                      record?.status === status.id 
                                        ? `${status.color} text-white shadow-md` 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${record?.status === status.id ? 'bg-white' : status.color}`}></span>
                                    {status.id}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <input 
                                type="text" 
                                value={record?.remarks || ''}
                                onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                placeholder="Add remark..."
                                disabled={!selectedClass?.isClassTeacher}
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 italic">No students found in this class.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tasks Management */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      Tasks & Quizzes
                    </h3>
                    <button className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-4 border border-slate-100 rounded-2xl hover:border-primary-200 transition-colors group">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">{task.name}</h4>
                          <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wider">
                            {task.subjects?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Trophy className="w-3 h-3" />
                            {task.total_marks} Marks
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar className="w-3 h-3" />
                            Term {task.term}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons Management */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      Lessons & Materials
                    </h3>
                    <button className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="p-4 border border-slate-100 rounded-2xl hover:border-primary-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                          <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wider">
                            {lesson.subjects?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lesson.content}</p>
                        {lesson.file_url && (
                          <button className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700">
                            <Upload className="w-4 h-4" />
                            View Material
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timetable' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-xl font-bold text-slate-900">Class Timetable</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                          <th key={day} className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {['1', '2', '3', 'Break', '4', '5', 'Lunch', '6', '7'].map((period) => (
                        <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 font-bold text-slate-900 bg-slate-50/30">
                            {period === 'Break' || period === 'Lunch' ? (
                              <span className="text-primary-600">{period}</span>
                            ) : (
                              `Period ${period}`
                            )}
                          </td>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                            const slot = timetable.find(t => t.day === day && t.period === period);
                            return (
                              <td key={day} className="px-8 py-6">
                                {slot ? (
                                  <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
                                    <p className="text-sm font-bold text-primary-700">{slot.subjects?.name}</p>
                                    <p className="text-[10px] text-primary-500 font-medium mt-1 uppercase tracking-wider">Room 102</p>
                                  </div>
                                ) : (
                                  period === 'Break' || period === 'Lunch' ? null : (
                                    <span className="text-slate-300 text-xs italic">Free Period</span>
                                  )
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
            )}

            {activeTab === 'meetings' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Meetings & Reminders</h3>
                    <p className="text-slate-500 mt-1">Stay updated with staff meetings and school events.</p>
                  </div>
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Bell className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 transition-all group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {new Date(meeting.date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-slate-900">
                              {new Date(meeting.date).getDate()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">{meeting.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{meeting.description}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Clock className="w-4 h-4" />
                                {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Video className="w-4 h-4" />
                                {meeting.location}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
                          Join Meeting
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

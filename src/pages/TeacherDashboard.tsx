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
  AlertCircle,
  UserCheck,
  X,
  Loader2,
  Image as ImageIcon,
  Brain,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import LearnerProfile from '../components/LearnerProfile';
import { generateQuizFromImage } from '../lib/gemini';

type Tab = 'overview' | 'results' | 'attendance' | 'timetable' | 'meetings' | 'materials';

const PASS_MARKS: Record<string, number> = {
  'english': 40,
  'maths': 40,
  'life skills': 40,
  'xitsonga': 50,
  'nst': 40,
  'social science': 40,
  's0cial science': 40,
  'natural science': 40,
  'creative arts': 40,
  'ems': 40,
  'technology': 40,
};

const getSubjectPassMark = (subjectName: string | undefined, defaultPassMark?: number) => {
  if (!subjectName) return defaultPassMark || 40;
  const name = subjectName.toLowerCase();
  if (name.includes('xitsonga')) return 50;
  return PASS_MARKS[name] || defaultPassMark || 40;
};

export default function TeacherDashboard() {
  const school_id_raw = localStorage.getItem('school_id');
  const school_id = (school_id_raw && school_id_raw !== 'undefined' && !isNaN(Number(school_id_raw))) ? Number(school_id_raw) : 1;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [teacherTimetable, setTeacherTimetable] = useState<any[]>([]);
  const [timetableView, setTimetableView] = useState<'personal' | 'class'>('personal');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [resultPublications, setResultPublications] = useState<any[]>([]);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', grade_id: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any | null>(null);
  const [selectedAchieverSubject, setSelectedAchieverSubject] = useState<string>(''); // empty means overall
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [resultsView, setResultsView] = useState<'schedule' | 'subject'>('schedule');
  const [resultsSelectedTerm, setResultsSelectedTerm] = useState('Term 1');
  const [resultsSelectedYear, setResultsSelectedYear] = useState(new Date().getFullYear().toString());
  const [timetableConfig] = useState({
    startTime: '08:00',
    periodDuration: 40,
    knockOffTime: '14:30',
    breaks: [
      { name: 'Short Break', startTime: '10:00', duration: 15 },
      { name: 'Lunch Break', startTime: '12:00', duration: 45 },
    ]
  });
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

  const calculatePeriodTimes = () => {
    const slots: { name: string; start: string; end: string; isBreak: boolean }[] = [];
    let currentTime = timetableConfig.startTime;

    const addMinutes = (time: string, minutes: number) => {
      const [h, m] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      date.setMinutes(date.getMinutes() + minutes);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const isTimeAfter = (time1: string, time2: string) => {
      return time1 >= time2;
    };

    let periodCount = 1;
    let safety = 0;
    while (!isTimeAfter(currentTime, timetableConfig.knockOffTime) && safety < 50) {
      safety++;
      const activeBreak = timetableConfig.breaks.find(b => b.startTime === currentTime);
      
      if (activeBreak) {
        const endTime = addMinutes(currentTime, activeBreak.duration);
        slots.push({ name: activeBreak.name, start: currentTime, end: endTime, isBreak: true });
        currentTime = endTime;
      } else {
        const endTime = addMinutes(currentTime, timetableConfig.periodDuration);
        if (isTimeAfter(endTime, timetableConfig.knockOffTime) && slots.length > 0) {
           const [h1, m1] = endTime.split(':').map(Number);
           const [h2, m2] = timetableConfig.knockOffTime.split(':').map(Number);
           const diff = (h1 * 60 + m1) - (h2 * 60 + m2);
           if (diff > 5) break;
        }
        slots.push({ name: `Period ${periodCount}`, start: currentTime, end: endTime, isBreak: false });
        periodCount++;
        currentTime = endTime;
      }
    }
    return slots;
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchTeacherData = async (id: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch teacher info
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .eq('school_id', school_id)
        .single();
      
      setTeacher(teacherData);
      
      // Fetch school info
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', school_id)
        .single();
      setSchoolInfo(schoolData);

      // Fetch assigned classes (where teacher is class teacher OR teaches a subject)
      const { data: classTeacherData } = await supabase
        .from('sections')
        .select('*, grades(name)')
        .eq('class_teacher_id', id)
        .eq('school_id', school_id);

      const { data: subjectTeacherData } = await supabase
        .from('class_subjects')
        .select('section_id, sections(*, grades(name))')
        .eq('teacher_id', id)
        .eq('school_id', school_id);

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
        .eq('school_id', school_id)
        .order('date', { ascending: true });
      setMeetings(meetingsData || []);

      // Fetch teacher's personal timetable
      const { data: personalTimetableData } = await supabase
        .from('timetable_allocations')
        .select('*, subjects(*), sections(*, grades(name))')
        .eq('teacher_id', id)
        .eq('school_id', school_id);
      setTeacherTimetable(personalTimetableData || []);

      // Fetch grades for material upload
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('school_id', school_id)
        .order('name');
      setGrades(gradesData || []);

      // Fetch materials uploaded by this teacher
      const { data: materialsData } = await supabase
        .from('learning_materials')
        .select('*, grades(name)')
        .eq('teacher_id', id)
        .eq('school_id', school_id)
        .order('created_at', { ascending: false });
      setMaterials(materialsData || []);

      // Fetch result publications
      const { data: resPubsData } = await supabase
        .from('result_publications')
        .select('*')
        .eq('school_id', school_id);
      setResultPublications(resPubsData || []);

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
        .in('student_id', studentsData?.map(s => s.id) || [])
        .eq('school_id', school_id);
      setResults(resultsData || []);

      // Fetch timetable
      const { data: timetableData } = await supabase
        .from('timetable_allocations')
        .select('*, subjects(*), teachers(*), sections(*, grades(name))')
        .eq('section_id', selectedClass.id);
      setTimetable(timetableData || []);

      // Fetch attendance for selected date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('section_id', selectedClass.id)
        .eq('date', attendanceDate);
      
      if (attendanceData && attendanceData.length > 0) {
        setAttendance(attendanceData);
      } else {
        // Default everyone to present
        const defaultAttendance = studentsData?.map(s => ({
          student_id: s.id,
          section_id: selectedClass.id,
          date: attendanceDate,
          status: 'Present',
          remarks: ''
        })) || [];
        setAttendance(defaultAttendance);
      }

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
          remarks: a.remarks,
          school_id
        })), { onConflict: 'student_id,date' });

      if (error) throw error;
      showMessage('success', 'Attendance saved successfully!');
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      showMessage('error', 'Error saving attendance: ' + error.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showMessage('error', 'Only PDF files are allowed.');
        e.target.value = ''; // Reset input
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadMaterial = async () => {
    if (!selectedFile || !newMaterial.name || !newMaterial.grade_id) {
      showMessage('error', 'Please provide a name, select a grade, and choose a PDF file.');
      return;
    }

    setUploadingMaterial(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const { error } = await supabase
          .from('learning_materials')
          .insert([{
            name: newMaterial.name,
            file_content: base64String,
            file_type: selectedFile.type,
            grade_id: newMaterial.grade_id,
            teacher_id: teacher.id,
            school_id: school_id
          }]);

        if (error) throw error;

        showMessage('success', 'Material uploaded successfully!');
        setNewMaterial({ name: '', grade_id: '' });
        setSelectedFile(null);
        // Reset file input manually if needed, but the state will handle the button
        const teacherId = localStorage.getItem('teacherId');
        if (teacherId) fetchTeacherData(teacherId, true);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error('Error uploading material:', error);
      showMessage('error', error.message || 'Failed to upload material');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('learning_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage('success', 'Material deleted');
      const teacherId = localStorage.getItem('teacherId');
      if (teacherId) fetchTeacherData(teacherId, true);
    } catch (error: any) {
      showMessage('error', error.message);
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

  const getMarkColor = (score: number) => {
    if (score >= 80) return 'text-amber-500'; // Gold
    if (score >= 60) return 'text-emerald-600'; // Green
    if (score >= 40) return 'text-amber-600'; // Amber
    return 'text-red-600'; // Red
  };

  const getMarkBg = (score: number) => {
    if (score >= 80) return 'bg-amber-100 text-amber-700';
    if (score >= 60) return 'bg-emerald-100 text-emerald-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getPassMark = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return getSubjectPassMark(subject?.name, subject?.pass_mark);
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
      const passMark = getSubjectPassMark(s.name, s.pass_mark);
      return { name: s.name, avg, passMark };
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
      let studentResults = results.filter(r => r.student_id === student.id);
      
      if (selectedAchieverSubject) {
        studentResults = studentResults.filter(r => r.subject_id === selectedAchieverSubject);
      }

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
      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              { id: 'timetable', icon: Calendar, label: 'Timetable' },
              { id: 'meetings', icon: Bell, label: 'Meetings' },
              { id: 'materials', icon: FileText, label: 'Materials' },
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
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Mark Attendance', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', tab: 'attendance', show: selectedClass?.isClassTeacher },
                    { label: 'View Timetable', icon: Calendar, color: 'bg-primary-50 text-primary-600', tab: 'timetable', show: true },
                    { label: 'Upload Results', icon: Upload, color: 'bg-blue-50 text-blue-600', tab: 'results', show: true },
                  ].filter(action => action.show).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(action.tab as Tab)}
                      className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary-200 hover:shadow-md transition-all group text-left"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{action.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Quick Access</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Students', value: students.length, icon: Users, color: 'bg-blue-500' },
                    { label: 'Class Average', value: `${(results.reduce((acc, curr) => acc + Number(curr.score), 0) / (results.length || 1)).toFixed(1)}%`, icon: Trophy, color: 'bg-amber-500' },
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
                      <select 
                        value={selectedAchieverSubject}
                        onChange={(e) => setSelectedAchieverSubject(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Overall Average</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
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
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-slate-500">ID: {student.student_id}</p>
                                  {student.phone && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      • {student.phone}
                                    </span>
                                  )}
                                  <button 
                                    onClick={() => setSelectedProfileStudent(student)}
                                    className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    View Profile
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-bold ${getMarkColor(student.average)}`}>{student.average.toFixed(1)}%</span>
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
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Results Management</h2>
                      <p className="text-sm text-slate-500 mt-1">View and manage academic performance</p>
                      {resultPublications.some(p => p.term === resultsSelectedTerm && p.year === parseInt(resultsSelectedYear) && p.is_published) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold mt-2">
                          <CheckCircle className="w-3 h-3" /> Published to Learners
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold mt-2">
                          <Clock className="w-3 h-3" /> Hidden from Learners
                        </span>
                      )}
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setResultsView('schedule')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resultsView === 'schedule' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Schedule Format
                      </button>
                      <button 
                        onClick={() => setResultsView('subject')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resultsView === 'subject' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        By Subject
                      </button>
                    </div>
                  </div>

                  {resultsView === 'schedule' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <select
                          value={resultsSelectedTerm}
                          onChange={(e) => setResultsSelectedTerm(e.target.value)}
                          className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                          <option value="Term 4">Term 4</option>
                        </select>
                        <select
                          value={resultsSelectedYear}
                          onChange={(e) => setResultsSelectedYear(e.target.value)}
                          className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        >
                          {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                        </select>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-4 text-left font-bold text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Learner Name</th>
                              {subjects.map(s => (
                                <th key={s.id} className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider min-w-[120px]">
                                  {s.name}
                                  <p className="text-[10px] font-normal lowercase opacity-60">Pass: {getSubjectPassMark(s.name, s.pass_mark)}%</p>
                                </th>
                              ))}
                              <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Average</th>
                              <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {students.sort((a, b) => a.first_name.localeCompare(b.first_name)).map(student => {
                              const studentResults = results.filter(r => r.student_id === student.id && r.term === resultsSelectedTerm && r.year === resultsSelectedYear);
                              let total = 0;
                              let count = 0;
                              let failed = false;

                              return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 font-bold text-slate-900 sticky left-0 bg-white z-10">
                                    {student.first_name} {student.last_name}
                                  </td>
                                  {subjects.map(subject => {
                                    const result = studentResults.find(r => r.subject_id === subject.id);
                                    const score = result ? Number(result.score) : null;
                                    const passMark = getSubjectPassMark(subject.name, subject.pass_mark);
                                    
                                    if (score !== null) {
                                      total += score;
                                      count++;
                                      if (score < passMark) failed = true;
                                    }
                                    return (
                                      <td key={subject.id} className="p-4 text-center">
                                        {score !== null ? (
                                          <span className={`font-bold ${getMarkColor(score)}`}>{score}%</span>
                                        ) : (
                                          <span className="text-slate-300">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="p-4 text-center font-bold text-slate-900 bg-slate-50/50">
                                    {count > 0 ? `${(total / count).toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="p-4 text-center">
                                    {count > 0 ? (
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${!failed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {!failed ? 'Pass' : 'Fail'}
                                      </span>
                                    ) : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2 mb-8">
                        <button
                          onClick={() => setSelectedAchieverSubject('')}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            selectedAchieverSubject === ''
                              ? 'bg-primary-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          All Subjects
                        </button>
                        {subjects.map((subject) => (
                          <button
                            key={subject.id}
                            onClick={() => setSelectedAchieverSubject(subject.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              selectedAchieverSubject === subject.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {subject.name}
                          </button>
                        ))}
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
                            {results
                              .filter(r => !selectedAchieverSubject || r.subject_id === selectedAchieverSubject)
                              .map((r, i) => (
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
                                    <span className={`font-bold ${getMarkColor(Number(r.score))}`}>
                                      {r.score}%
                                    </span>
                                  </td>
                                  <td className="px-8 py-4 text-center">
                                    {(() => {
                                      const levelInfo = getLevel(Number(r.score));
                                      return (
                                        <div className="flex flex-col items-center">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getMarkBg(Number(r.score))}`}>
                                            Level {levelInfo.level}
                                          </span>
                                          <span className="text-[8px] text-slate-400 uppercase mt-0.5">{levelInfo.label}</span>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-8 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getMarkBg(Number(r.score))}`}>
                                      {Number(r.score) >= getSubjectPassMark(r.subjects?.name, r.subjects?.pass_mark) ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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

            {activeTab === 'timetable' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {timetableView === 'personal' ? 'My Teaching Schedule' : `${selectedClass?.grades?.name} - ${selectedClass?.name} Timetable`}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {timetableView === 'personal' ? 'Your assigned periods across all classes' : 'Weekly schedule for the selected class'}
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setTimetableView('personal')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timetableView === 'personal' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      My Schedule
                    </button>
                    {selectedClass && (
                      <button 
                        onClick={() => setTimetableView('class')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timetableView === 'class' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Class Timetable
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-4 w-32 font-bold text-slate-400 text-xs uppercase tracking-wider">Period</th>
                        {DAYS.map(day => (
                          <th key={day} className="border border-slate-200 p-4 font-bold text-slate-400 text-xs uppercase tracking-wider">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calculatePeriodTimes().map(slot => (
                        <tr key={slot.name} className={slot.isBreak ? 'bg-amber-50/30' : ''}>
                          <td className="border border-slate-200 p-4 font-bold bg-slate-50">
                            <div className="text-sm text-slate-900">{slot.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{slot.start} - {slot.end}</div>
                          </td>
                          {DAYS.map(day => {
                            if (slot.isBreak) {
                              return (
                                <td key={day} className="border border-slate-200 p-4 text-center bg-amber-50/50">
                                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{slot.name}</span>
                                </td>
                              );
                            }

                            const allocation = (timetableView === 'personal' ? teacherTimetable : timetable).find(a => 
                              a.day === day && a.period === slot.name
                            );

                            return (
                              <td key={day} className="border border-slate-200 p-4 min-h-[80px] align-top">
                                {allocation ? (
                                  <div className="space-y-1">
                                    <div className="font-bold text-primary-700">{allocation.subjects?.name}</div>
                                    {timetableView === 'personal' ? (
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        Class: {allocation.sections?.grades?.name} - {allocation.sections?.name}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        Educator: {allocation.teachers?.first_name} {allocation.teachers?.last_name}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-slate-400 italic">Room: {allocation.room || 'TBA'}</div>
                                  </div>
                                ) : (
                                  <div className="text-slate-300 italic text-[10px]">Free</div>
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
                  {meetings.length === 0 && (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No upcoming meetings or reminders.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Learning Materials</h2>
                      <p className="text-sm text-slate-500 mt-1">Upload and manage PDF documents for your students.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Form */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary-600" />
                        Upload New Material
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Document Name</label>
                          <input 
                            type="text"
                            value={newMaterial.name}
                            onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                            placeholder="e.g., Mathematics Term 1 Study Guide"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Grade</label>
                          <select 
                            value={newMaterial.grade_id}
                            onChange={(e) => setNewMaterial({ ...newMaterial, grade_id: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select Grade</option>
                            {grades.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PDF File</label>
                          <input 
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            disabled={uploadingMaterial}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all"
                          />
                        </div>
                        <button
                          onClick={handleUploadMaterial}
                          disabled={uploadingMaterial || !selectedFile || !newMaterial.name || !newMaterial.grade_id}
                          className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                        >
                          {uploadingMaterial ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Material
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Materials List */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary-600" />
                        Your Uploaded Materials
                      </h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {materials.map((m) => (
                          <div key={m.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-primary-200 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                  Grade {m.grades?.name} • {new Date(m.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteMaterial(m.id)}
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {materials.length === 0 && (
                          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No materials uploaded yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
          {selectedProfileStudent && (
            <LearnerProfile 
              student={selectedProfileStudent}
              results={results}
              subjects={subjects}
              schoolInfo={schoolInfo}
              onClose={() => setSelectedProfileStudent(null)}
            />
          )}

          {/* Add Task Modal Removed */}
        </AnimatePresence>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  Bell, 
  Search,
  LayoutDashboard,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Filter,
  LogOut,
  UserCheck,
  ArrowUpDown,
  UserPlus,
  ClipboardList,
  Folder,
  MessageSquare,
  ShieldCheck,
  Settings2,
  Printer,
  FileText,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Grade, Section, Subject, ClassSubject, Student, Result, Task } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../components/ThemeProvider';

type Tab = 'overview' | 'grades' | 'subjects' | 'assign' | 'learners' | 'results' | 'results-schedule' | 'teachers' | 'tasks' | 'sms' | 'sms-config' | 'system-settings' | 'general-config' | 'timetable-allocation' | 'timetable-generate' | 'timetable-view' | 'school-info' | 'stats';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { refreshTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['learner-info', 'curriculum']);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Evergreen Academy',
    logo: '',
    mission: '',
    vision: '',
    contact: '',
    type: 'public',
    level: 'both',
    primary_color: '#059669',
    secondary_color: '#10b981',
    sms_config: {
      username: '',
      password: ''
    }
  });
  const [timetableAllocations, setTimetableAllocations] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [statsResults, setStatsResults] = useState<any[]>([]);
  const [statsSelectedTerm, setStatsSelectedTerm] = useState('Term 1');
  const [statsSelectedYear, setStatsSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Form states
  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState({ grade_id: '', name: '', class_teacher_id: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', pass_mark: 50 });
  const [newTeacher, setNewTeacher] = useState({ first_name: '', last_name: '', email: '', phone: '', password: 'teacher123' });
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [newTask, setNewTask] = useState({ section_id: '', subject_id: '', name: '', description: '', total_marks: 100, weighting: 100, term: 'Term 1' });
  const [assignment, setAssignment] = useState({ section_id: '', subject_id: '', teacher_id: '' });

  // Filter/Sort states
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'last_name', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<'lower' | 'higher'>('higher');
  const [resultSelectedGrade, setResultSelectedGrade] = useState('');
  const [resultSelectedSection, setResultSelectedSection] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTarget, setSmsTarget] = useState<'all-students' | 'all-teachers' | 'specific-grade'>('all-students');
  const [smsSelectedGrade, setSmsSelectedGrade] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);

  const [smsBalanceError, setSmsBalanceError] = useState<string | null>(null);

  const fetchSMSBalance = async (manual = false) => {
    if (!schoolInfo.sms_config?.username || !schoolInfo.sms_config?.password) return;
    
    setIsFetchingBalance(true);
    setSmsBalanceError(null);
    try {
      const response = await fetch('/api/sms-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: schoolInfo.sms_config.username,
          password: schoolInfo.sms_config.password
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch balance');
      
      setSmsBalance(data.balance);
      if (manual) showMessage('success', 'Balance updated');
    } catch (error: any) {
      console.error('Fetch Balance Error:', error);
      setSmsBalanceError(error.message);
      if (manual) showMessage('error', error.message);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      showMessage('error', 'Please enter a message');
      return;
    }

    if (!schoolInfo.sms_config?.username || !schoolInfo.sms_config?.password) {
      showMessage('error', 'SMS configuration is missing. Please configure BulkSMS.com credentials first.');
      return;
    }

    setIsSendingSms(true);
    try {
      let recipients: string[] = [];
      if (smsTarget === 'all-students') {
        recipients = allStudents.map(s => s.phone).filter(p => p && p.trim() !== '');
      } else if (smsTarget === 'all-teachers') {
        recipients = teachers.map(t => t.phone).filter(p => p && p.trim() !== '');
      } else if (smsTarget === 'specific-grade') {
        recipients = allStudents
          .filter(s => s.sections?.grade_id === smsSelectedGrade)
          .map(s => s.phone)
          .filter(p => p && p.trim() !== '');
      }

      if (recipients.length === 0) {
        throw new Error('No valid phone numbers found for the selected target');
      }

      const messages = recipients.map(to => ({ to, body: smsMessage }));

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: schoolInfo.sms_config.username,
          password: schoolInfo.sms_config.password,
          messages
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send SMS');

      showMessage('success', `Successfully sent ${recipients.length} messages`);
      setSmsMessage('');
      fetchSMSBalance();
    } catch (error: any) {
      console.error('Send SMS Error:', error);
      showMessage('error', error.message);
    } finally {
      setIsSendingSms(false);
    }
  };
  const [resultSelectedSubject, setResultSelectedSubject] = useState('');
  const [resultSelectedTerm, setResultSelectedTerm] = useState('Term 1');
  const [resultSelectedYear, setResultSelectedYear] = useState(new Date().getFullYear().toString());
  const [scheduleSelectedGrade, setScheduleSelectedGrade] = useState('');
  const [scheduleSelectedSections, setScheduleSelectedSections] = useState<string[]>([]);
  const [scheduleSelectedTerm, setScheduleSelectedTerm] = useState('Term 1');
  const [scheduleSelectedYear, setScheduleSelectedYear] = useState(new Date().getFullYear().toString());
  const [scheduleResults, setScheduleResults] = useState<any[]>([]);
  const [timetableType, setTimetableType] = useState<'consolidated' | 'teacher'>('consolidated');
  const [viewTeacherId, setViewTeacherId] = useState('');
  const [viewTimetableGradeId, setViewTimetableGradeId] = useState('');
  const [viewTimetableSectionId, setViewTimetableSectionId] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [timetableConfig, setTimetableConfig] = useState({
    startTime: '08:00',
    periodDuration: 40,
    knockOffTime: '14:30',
    breaks: [
      { name: 'Short Break', startTime: '10:00', duration: 15 },
      { name: 'Lunch Break', startTime: '12:00', duration: 45 },
    ]
  });

  const getGradePhase = (gradeName: string) => {
    const lower = ['R', '1', '2', '3'];
    const name = gradeName.toUpperCase();
    if (lower.some(l => name.includes(`GRADE ${l}`) || name === l)) return 'lower';
    return 'higher';
  };

  useEffect(() => {
    if (activeTab === 'sms' || activeTab === 'sms-config') {
      fetchSMSBalance();
    }
  }, [activeTab, schoolInfo.sms_config]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchInitialData(true);
        setLastRefreshed(new Date());
      }, 5000); // 5 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchResults = async () => {
    if (!resultSelectedSection || !resultSelectedSubject) {
      setAllResults([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('subject_id', resultSelectedSubject)
      .eq('year', parseInt(resultSelectedYear));
    
    if (error) {
      console.error('Error fetching results:', error);
    } else {
      setAllResults(data || []);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [resultSelectedSection, resultSelectedSubject, resultSelectedTerm, resultSelectedYear]);

  const fetchStatsResults = async () => {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('term', statsSelectedTerm)
      .eq('year', parseInt(statsSelectedYear));
    
    if (error) {
      console.error('Error fetching stats results:', error);
    } else {
      setStatsResults(data || []);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStatsResults();
    }
  }, [activeTab, statsSelectedTerm, statsSelectedYear]);

  const fetchScheduleResults = async () => {
    if (!scheduleSelectedGrade || scheduleSelectedSections.length === 0) {
      setScheduleResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const studentIds = allStudents
        .filter(s => scheduleSelectedSections.includes(s.section_id))
        .map(s => s.id);

      if (studentIds.length === 0) {
        setScheduleResults([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('results')
        .select('*')
        .in('student_id', studentIds)
        .eq('term', scheduleSelectedTerm)
        .eq('year', parseInt(scheduleSelectedYear));

      if (error) throw error;
      setScheduleResults(data || []);
    } catch (error) {
      console.error('Error fetching schedule results:', error);
      showMessage('error', 'Failed to fetch schedule results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'results-schedule') {
      fetchScheduleResults();
    }
  }, [activeTab, scheduleSelectedGrade, scheduleSelectedSections, scheduleSelectedTerm, scheduleSelectedYear, allStudents]);

  async function fetchInitialData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [gradesRes, sectionsRes, subjectsRes, teachersRes, studentsRes, tasksRes, classSubjectsRes, schoolInfoRes, timetableRes, studentsCount, subjectsCount] = await Promise.all([
        supabase.from('grades').select('*').order('name'),
        supabase.from('sections').select('*, teachers(first_name, last_name)').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('teachers').select('*').order('first_name'),
        supabase.from('students').select('*, sections(name, grade_id, grades(name))').order('last_name'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('class_subjects').select('*, sections(name, grade_id), subjects(name), teachers(first_name, last_name)'),
        supabase.from('school_info').select('id, name, logo, mission, vision, contact, type, level, primary_color, secondary_color, timetable_config, sms_config').single(),
        supabase.from('timetable_allocations').select('*, sections(name, grade_id), subjects(name), teachers(first_name, last_name)'),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
      ]);

      if (gradesRes.data) setGrades(gradesRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data as any);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (teachersRes.data) {
        setTeachers(teachersRes.data);
        // Seed demo teacher if not exists
        const demoEmail = 'ag@gmail.com';
        if (!teachersRes.data.some(t => t.email === demoEmail)) {
          supabase.from('teachers').insert([{
            first_name: 'Demo',
            last_name: 'Teacher',
            email: demoEmail,
            password: 'teacher123',
            phone: '0123456789'
          }]).then(() => fetchInitialData(true));
        }
      }
      if (tasksRes.data) setTasks(tasksRes.data);
      if (classSubjectsRes.data) setClassSubjects(classSubjectsRes.data);
      if (schoolInfoRes.data) {
        setSchoolInfo(schoolInfoRes.data);
        if (schoolInfoRes.data.timetable_config) {
          setTimetableConfig(schoolInfoRes.data.timetable_config);
        }
        if (schoolInfoRes.data.sms_config) {
          setSchoolInfo(prev => ({ ...prev, sms_config: schoolInfoRes.data.sms_config }));
        }
      }
      if (timetableRes.data) setTimetableAllocations(timetableRes.data);
      if (studentsRes.data) {
        setAllStudents(studentsRes.data as any);
        setRecentStudents(studentsRes.data.slice(0, 5) as any);
      }
      
      setStats({
        totalStudents: studentsCount.count || 0,
        activeCourses: subjectsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }

  const handleSaveSMSConfig = async () => {
    setLoading(true);
    try {
      const id = (schoolInfo as any).id;
      let error;

      if (!id) {
        // If no ID, we need to insert the first record
        const { error: insertError, data } = await supabase
          .from('school_info')
          .insert([{ ...schoolInfo }])
          .select()
          .single();
        error = insertError;
        if (data) setSchoolInfo(data);
      } else {
        const { error: updateError } = await supabase
          .from('school_info')
          .update({ sms_config: schoolInfo.sms_config })
          .eq('id', id);
        error = updateError;
      }

      if (error) throw error;
      showMessage('success', 'SMS configuration saved successfully');
      fetchSMSBalance();
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimetable = async () => {
    setLoading(true);
    setGenerationProgress(0);
    try {
      // 1. Get all sections for the selected phase
      const phaseSections = sections.filter(s => {
        const gradeName = grades.find(g => g.id === s.grade_id)?.name || '';
        return getGradePhase(gradeName) === selectedPhase;
      });

      if (phaseSections.length === 0) {
        throw new Error('No sections found for the selected phase');
      }
      setGenerationProgress(10);

      // 2. Get all subject assignments for these sections
      const phaseAssignments = classSubjects.filter(cs => 
        phaseSections.some(s => s.id === cs.section_id)
      );

      if (phaseAssignments.length === 0) {
        throw new Error('No subject assignments found for the selected phase. Please allocate subjects first.');
      }
      setGenerationProgress(20);

      // 3. Delete existing allocations for these sections
      const sectionIds = phaseSections.map(s => s.id);
      await supabase.from('timetable_allocations').delete().in('section_id', sectionIds);
      setGenerationProgress(30);

      // 4. Get dynamic periods (excluding breaks)
      const allSlots = calculatePeriodTimes();
      const availablePeriods = allSlots.filter(s => !s.isBreak).map(s => s.name);

      if (availablePeriods.length === 0) {
        throw new Error('No available periods found in the current configuration. Please check school hours.');
      }

      // 5. Simple Greedy Generation
      const newAllocations: any[] = [];
      const teacherBusy: { [key: string]: boolean } = {}; // teacherId_day_period

      // Shuffle assignments to get different results each time (optional)
      const shuffledAssignments = [...phaseAssignments].sort(() => Math.random() - 0.5);
      
      const totalSteps = phaseSections.length;
      let currentStep = 0;

      for (const section of phaseSections) {
        const sectionAssignments = shuffledAssignments.filter(a => a.section_id === section.id);
        let currentDayIdx = 0;
        let currentPeriodIdx = 0;

        for (const assignment of sectionAssignments) {
          let periodsToAssign = assignment.periods_per_week || 0;
          let attempts = 0;
          const maxAttempts = DAYS.length * availablePeriods.length * 2;

          while (periodsToAssign > 0 && attempts < maxAttempts) {
            const day = DAYS[currentDayIdx];
            const period = availablePeriods[currentPeriodIdx];
            const teacherKey = `${assignment.teacher_id}_${day}_${period}`;
            
            // Check if teacher is busy or section already has a class in this slot
            const isSectionBusy = newAllocations.some(a => a.section_id === section.id && a.day === day && a.period === period);
            
            if (!teacherBusy[teacherKey] && !isSectionBusy) {
              newAllocations.push({
                section_id: section.id,
                subject_id: assignment.subject_id,
                teacher_id: assignment.teacher_id,
                day,
                period
              });
              teacherBusy[teacherKey] = true;
              periodsToAssign--;
            }

            // Move to next slot
            currentPeriodIdx++;
            if (currentPeriodIdx >= availablePeriods.length) {
              currentPeriodIdx = 0;
              currentDayIdx++;
              if (currentDayIdx >= DAYS.length) {
                currentDayIdx = 0;
              }
            }
            attempts++;
          }
        }
        currentStep++;
        setGenerationProgress(30 + Math.floor((currentStep / totalSteps) * 50));
        // Small delay to show progress
        await new Promise(r => setTimeout(r, 100));
      }

      // 6. Save to database
      if (newAllocations.length > 0) {
        setGenerationProgress(90);
        const { error } = await supabase.from('timetable_allocations').insert(newAllocations);
        if (error) throw error;
        setGenerationProgress(100);
        showMessage('success', `Generated ${newAllocations.length} slots for ${selectedPhase} phase`);
        fetchInitialData();
        setTimeout(() => setActiveTab('timetable-view'), 500);
      } else {
        showMessage('error', 'Could not generate any slots. Check allocations.');
      }

    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

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
        // Ensure period doesn't end AFTER knock off time (unless it's the last one)
        if (isTimeAfter(endTime, timetableConfig.knockOffTime) && slots.length > 0) {
           // If it's very close, we can still add it or just stop
           const [h1, m1] = endTime.split(':').map(Number);
           const [h2, m2] = timetableConfig.knockOffTime.split(':').map(Number);
           const diff = (h1 * 60 + m1) - (h2 * 60 + m2);
           if (diff > 5) break; // more than 5 mins over
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

  const askConfirmation = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  // 1. Add Grade & Section
  const handleDeleteGrade = (id: string) => {
    askConfirmation(
      'Delete Grade',
      'Are you sure you want to delete this grade? All associated sections and students will be removed.',
      async () => {
        const { error } = await supabase.from('grades').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setGrades(grades.filter(g => g.id !== id));
          showMessage('success', 'Grade deleted successfully');
        }
      }
    );
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade) return;
    const { data, error } = await supabase.from('grades').insert([{ name: newGrade }]).select();
    if (error) showMessage('error', error.message);
    else {
      setGrades([...grades, data[0]]);
      setNewGrade('');
      showMessage('success', 'Grade added successfully');
    }
  };

  const handleDeleteSection = (id: string) => {
    askConfirmation(
      'Delete Section',
      'Are you sure you want to delete this section?',
      async () => {
        const { error } = await supabase.from('sections').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setSections(sections.filter(s => s.id !== id));
          showMessage('success', 'Section deleted successfully');
        }
      }
    );
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.grade_id || !newSection.name) return;
    const { data, error } = await supabase.from('sections').insert([newSection]).select();
    if (error) showMessage('error', error.message);
    else {
      // Re-fetch to get teacher names
      fetchInitialData();
      setNewSection({ ...newSection, name: '', class_teacher_id: '' });
      showMessage('success', 'Section added successfully');
    }
  };

  const handleUpdateSectionTeacher = async (sectionId: string, teacherId: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ class_teacher_id: teacherId || null })
      .eq('id', sectionId);
    
    if (error) showMessage('error', error.message);
    else {
      fetchInitialData();
      showMessage('success', 'Class teacher updated successfully');
    }
  };

  // 2. Add Subject
  const handleDeleteSubject = (id: string) => {
    askConfirmation(
      'Delete Subject',
      'Are you sure you want to delete this subject?',
      async () => {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setSubjects(subjects.filter(s => s.id !== id));
          showMessage('success', 'Subject deleted successfully');
        }
      }
    );
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) return;
    const { data, error } = await supabase.from('subjects').insert([newSubject]).select();
    if (error) showMessage('error', error.message);
    else {
      setSubjects([...subjects, data[0]]);
      setNewSubject({ name: '', code: '', pass_mark: 50 });
      showMessage('success', 'Subject added successfully');
    }
  };

  // 3. Add Teacher
  const handleDeleteTeacher = (id: string) => {
    askConfirmation(
      'Delete Teacher',
      'Are you sure you want to delete this teacher?',
      async () => {
        const { error } = await supabase.from('teachers').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setTeachers(teachers.filter(t => t.id !== id));
          showMessage('success', 'Teacher deleted successfully');
        }
      }
    );
  };

  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  const handleExportTeacherLogins = () => {
    const data = [...teachers]
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .map(t => ({
        'First Name': t.first_name,
        'Last Name': t.last_name,
        'Email': t.email,
        'Password': t.password
      }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teacher Logins');
    XLSX.writeFile(wb, 'educator_login_details.xlsx');
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.first_name || !newTeacher.last_name || !newTeacher.email) return;
    const { data, error } = await supabase.from('teachers').insert([newTeacher]).select();
    if (error) showMessage('error', error.message);
    else {
      setTeachers([...teachers, data[0]]);
      setNewTeacher({ first_name: '', last_name: '', email: '', phone: '', password: 'teacher123' });
      showMessage('success', 'Teacher added successfully');
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher.first_name || !editingTeacher.last_name || !editingTeacher.email) return;
    
    const { data, error } = await supabase
      .from('teachers')
      .update({
        first_name: editingTeacher.first_name,
        last_name: editingTeacher.last_name,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        password: editingTeacher.password
      })
      .eq('id', editingTeacher.id)
      .select();

    if (error) showMessage('error', error.message);
    else {
      setTeachers(teachers.map(t => t.id === editingTeacher.id ? data[0] : t));
      setEditingTeacher(null);
      showMessage('success', 'Teacher updated successfully');
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent.first_name || !editingStudent.last_name || !editingStudent.student_id || !editingStudent.section_id) return;
    
    const { data, error } = await supabase
      .from('students')
      .update({
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        student_id: editingStudent.student_id,
        gender: editingStudent.gender,
        section_id: editingStudent.section_id,
        password: editingStudent.password
      })
      .eq('id', editingStudent.id)
      .select(`
        *,
        sections:section_id (
          name,
          grade_id,
          grades:grade_id (
            name
          )
        )
      `);

    if (error) showMessage('error', error.message);
    else {
      setAllStudents(allStudents.map(s => s.id === editingStudent.id ? data[0] : s));
      setEditingStudent(null);
      showMessage('success', 'Student updated successfully');
    }
  };

  // 4. Assign Subject & Teacher to Class
  const handleDeleteAssignment = (id: string) => {
    askConfirmation(
      'Delete Assignment',
      'Are you sure you want to delete this assignment?',
      async () => {
        const { error } = await supabase.from('class_subjects').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setClassSubjects(classSubjects.filter(cs => cs.id !== id));
          showMessage('success', 'Assignment deleted successfully');
        }
      }
    );
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment.section_id || !assignment.subject_id) return;
    
    const { error } = await supabase.from('class_subjects').upsert([{
      section_id: assignment.section_id,
      subject_id: assignment.subject_id,
      teacher_id: assignment.teacher_id || null
    }], { onConflict: 'section_id,subject_id' });

    if (error) showMessage('error', error.message);
    else {
      fetchInitialData();
      showMessage('success', 'Subject assigned successfully');
      setAssignment({ section_id: '', subject_id: '', teacher_id: '' });
    }
  };

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = (schoolInfo as any).id;
    const payload = { ...schoolInfo };
    if (!id) delete (payload as any).id;

    const { data, error } = await supabase
      .from('school_info')
      .upsert([payload])
      .select()
      .single();

    if (error) showMessage('error', error.message);
    else {
      if (data) setSchoolInfo(data);
      showMessage('success', 'School info updated successfully');
      refreshTheme();
    }
  };

  const handleSaveAllocation = async (allocation: any) => {
    const { error } = await supabase.from('timetable_allocations').upsert([allocation]);
    if (error) showMessage('error', error.message);
    else {
      fetchInitialData();
      showMessage('success', 'Allocation saved successfully');
    }
  };

  const handleSaveAllAllocations = async () => {
    setLoading(true);
    try {
      const updates = classSubjects.map(cs => ({
        id: cs.id,
        section_id: cs.section_id,
        subject_id: cs.subject_id,
        teacher_id: cs.teacher_id,
        periods_per_week: cs.periods_per_week || 0
      }));

      const { error } = await supabase.from('class_subjects').upsert(updates);
      if (error) throw error;
      showMessage('success', 'All allocations saved successfully');
      fetchInitialData();
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Tasks
  const handleDeleteTask = (id: string) => {
    askConfirmation(
      'Delete Task',
      'Are you sure you want to delete this task?',
      async () => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setTasks(tasks.filter(t => t.id !== id));
          showMessage('success', 'Task deleted successfully');
        }
      }
    );
  };

  const fetchStudentResults = async (student: any) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*, subjects(name), tasks(name, total_marks, weighting)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentResults(data || []);
      setShowResultsModal(true);
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.section_id || !newTask.subject_id || !newTask.name) return;
    
    const { data, error } = await supabase.from('tasks').insert([{
      ...newTask,
      year: new Date().getFullYear()
    }]).select();

    if (error) showMessage('error', error.message);
    else {
      setTasks([data[0], ...tasks]);
      setNewTask({ ...newTask, name: '', description: '' });
      showMessage('success', 'Task added successfully');
    }
  };

  // 5. Upload Excel of Learners
  const generateLearnerTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Acc No': 'S001', 'Learner': 'John,Doe', 'Gender': 'M', 'Phone': '27123456789', 'password': '12345' },
      { 'Acc No': 'S002', 'Learner': 'Jane,Smith', 'Gender': 'F', 'Phone': '27987654321', 'password': '12345' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Learners');
    XLSX.writeFile(wb, 'learner_template.xlsx');
  };

  const generateLoginCredentials = () => {
    if (!filterSection) {
      showMessage('error', 'Please select a section first');
      return;
    }

    const sectionStudents = allStudents
      .filter(s => s.section_id === filterSection)
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    if (sectionStudents.length === 0) {
      showMessage('error', 'No students found in this section');
      return;
    }

    const sectionName = sections.find(s => s.id === filterSection)?.name || 'Section';
    const data = sectionStudents.map(s => ({
      'Student Name': `${s.first_name} ${s.last_name}`,
      'Accession No / ID': s.student_id,
      'Login Password': s.password || '12345'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Login Credentials');
    XLSX.writeFile(wb, `${sectionName}_login_credentials.xlsx`);
  };

  const handleDeleteStudent = (id: string) => {
    askConfirmation(
      'Delete Student',
      'Are you sure you want to delete this student?',
      async () => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) showMessage('error', error.message);
        else {
          setAllStudents(allStudents.filter(s => s.id !== id));
          showMessage('success', 'Student deleted successfully');
        }
      }
    );
  };

  const handleLearnerUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (!file || !sectionId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      // Find the header row (the one containing "Acc No", "Learner", "first_name", or "student_id")
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i];
        if (row && row.some(cell => {
          const val = String(cell || '').toLowerCase();
          return val.includes('acc no') || val.includes('learner') || val.includes('first_name') || val.includes('student_id') || val.includes('surname') || val.includes('names');
        })) {
          headerRowIndex = i;
          break;
        }
      }

      // Re-read data starting from the header row
      const jsonData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }) as any[];

      const learners = jsonData.map(item => {
        let firstName = item.first_name || item.Names || item.names || item.Name || item.name || '';
        let lastName = item.last_name || item.Surname || item.surname || '';
        
        // Handle "Learner" column with "name,surname" format
        const learnerName = item.Learner || item.learner;
        if (learnerName && typeof learnerName === 'string') {
          if (learnerName.includes(',')) {
            const parts = learnerName.split(',');
            firstName = parts[0].trim();
            lastName = parts[1].trim();
          } else {
            const parts = learnerName.trim().split(/\s+/);
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
          }
        }

        return {
          first_name: firstName,
          last_name: lastName,
          student_id: String(item.student_id || item['Acc No'] || item.id || '').trim(),
          gender: item.gender || item.Gender,
          phone: String(item.phone || item.Phone || '').trim(),
          section_id: sectionId,
          password: String(item.password || '12345')
        };
      }).filter(l => (l.first_name || l.last_name) && l.student_id);

      if (learners.length === 0) {
        showMessage('error', 'No valid learners found in the file. Ensure "Learner" or "first_name/last_name" and "student_id" or "Acc No" columns exist.');
        return;
      }

      const { error } = await supabase.from('students').insert(learners);
      if (error) showMessage('error', error.message);
      else showMessage('success', `Uploaded ${learners.length} learners`);
    };
    reader.readAsBinaryString(file);
  };

  // 5. Upload Student Results
  const generateResultsTemplate = (sectionId: string, subjectId: string) => {
    if (!sectionId || !subjectId) {
      showMessage('error', 'Please select section and subject first');
      return;
    }

    const sectionStudents = allStudents
      .filter(s => s.section_id === sectionId)
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    // Create header rows
    const header1 = ['Acc No', 'Learner', 'Gender', 'Mark'];
    const header2 = ['', 'Weighting', '', '100'];
    const header3 = ['', 'Total Mark', '', '100'];

    const rows = sectionStudents.map(s => [
      s.student_id,
      `${s.first_name},${s.last_name}`,
      s.gender || '',
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header1, header2, header3, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Task Assessments');
    XLSX.writeFile(wb, `results_template_${resultSelectedTerm.replace(' ', '_')}.xlsx`);
  };

  const handleResultsUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string, subjectId: string) => {
    const file = e.target.files?.[0];
    if (!file || !sectionId || !subjectId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Find the header row
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i];
        if (row && row.some(cell => {
          const val = String(cell || '').toLowerCase();
          return val.includes('acc no') || val.includes('learner') || val.includes('student_id') || val.includes('surname') || val.includes('names');
        })) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        showMessage('error', 'Could not find data table in the file. Ensure "Acc No", "Learner", or "Names" column exists.');
        return;
      }

      const headers = data[headerRowIndex];
      
      // Find critical column indices
      const accNoIndex = headers.findIndex(h => {
        const val = String(h || '').toLowerCase();
        return val.includes('acc no') || val.includes('student_id');
      });
      
      const markIndex = headers.findIndex(h => {
        const val = String(h || '').toLowerCase();
        return val.includes('mark') || val.includes('score') || val.includes('result');
      });

      if (accNoIndex === -1 || markIndex === -1) {
        showMessage('error', 'Could not find "Acc No" and "Mark" columns');
        return;
      }

      // Determine where data rows start
      let dataStartRowIndex = headerRowIndex + 1;
      if (data[headerRowIndex + 1] && String(data[headerRowIndex + 1][1] || '').toLowerCase().includes('weighting')) {
        dataStartRowIndex = headerRowIndex + 3;
      }
      
      const studentRows = data.slice(dataStartRowIndex);

      // Ensure a default task exists for this subject/section/term/year
      let defaultTask = tasks.find(t => 
        t.section_id === sectionId && 
        t.subject_id === subjectId && 
        t.term === resultSelectedTerm &&
        t.year === parseInt(resultSelectedYear) &&
        t.name === 'Final Mark'
      );
      
      if (!defaultTask) {
        const { data: newTaskData, error: taskError } = await supabase
          .from('tasks')
          .insert([{
            section_id: sectionId,
            subject_id: subjectId,
            term: resultSelectedTerm,
            name: 'Final Mark',
            total_marks: 100,
            weighting: 100,
            year: parseInt(resultSelectedYear)
          }])
          .select();
          
        if (taskError) {
          showMessage('error', 'Failed to create default task: ' + taskError.message);
          return;
        }
        defaultTask = newTaskData[0];
        setTasks([defaultTask, ...tasks]);
      }

      // Fetch students for matching
      const { data: sectionStudents, error: fetchError } = await supabase
        .from('students')
        .select('id, student_id')
        .eq('section_id', sectionId);

      if (fetchError) {
        showMessage('error', 'Failed to fetch students');
        return;
      }

      const studentMap = new Map(sectionStudents.map(s => [s.student_id, s.id]));
      const resultsToInsert: any[] = [];

      studentRows.forEach(row => {
        const studentId = String(row[accNoIndex] || '').trim();
        if (!studentId || studentId === 'undefined' || studentId === 'null') return;
        
        const studentUuid = studentMap.get(studentId);
        if (!studentUuid) return;

        const score = row[markIndex];
        if (score !== undefined && score !== '') {
          resultsToInsert.push({
            student_id: studentUuid,
            subject_id: subjectId,
            task_id: defaultTask!.id,
            score: Number(score),
            term: resultSelectedTerm,
            year: parseInt(resultSelectedYear)
          });
        }
      });

      if (resultsToInsert.length === 0) {
        showMessage('error', 'No valid results found in the file');
        return;
      }

      // Delete existing results for this task to avoid duplicates
      await supabase.from('results').delete().eq('task_id', defaultTask!.id);

      const { error } = await supabase.from('results').insert(resultsToInsert);
      if (error) showMessage('error', error.message);
      else {
        showMessage('success', `Uploaded ${resultsToInsert.length} results for ${resultSelectedTerm}`);
        fetchResults();
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = allStudents
    .filter(s => {
      const gFilter = activeTab === 'results' ? resultSelectedGrade : filterGrade;
      const sFilter = activeTab === 'results' ? resultSelectedSection : filterSection;
      
      const matchesGrade = gFilter ? s.sections?.grade_id === gFilter : true;
      const matchesSection = sFilter ? s.section_id === sFilter : true;
      const matchesSearch = searchTerm ? 
        (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchesGrade && matchesSection && matchesSearch;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'level') {
        const studentTasks = tasks.filter(t => t.section_id === resultSelectedSection && t.subject_id === resultSelectedSubject && t.term === resultSelectedTerm && t.year === parseInt(resultSelectedYear));
        
        const getAvg = (student: any) => {
          const subjectResults = allResults.filter(r => r.student_id === student.id && studentTasks.some(t => t.id === r.task_id));
          if (subjectResults.length === 0) return -1;
          const totalScore = subjectResults.reduce((acc, r) => acc + (r.score / studentTasks.find(t => t.id === r.task_id)!.total_marks) * 100, 0);
          return totalScore / subjectResults.length;
        };

        const aAvg = getAvg(a);
        const bAvg = getAvg(b);

        if (sortConfig.direction === 'asc') return aAvg - bAvg;
        return bAvg - aAvg;
      }

      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
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
    return subjects.find(s => s.id === subjectId)?.pass_mark || 50;
  };

  const downloadStats = () => {
    const statsData = subjects.map(s => {
      const subjectResults = statsResults.filter(r => r.subject_id === s.id);
      const avgScore = subjectResults.length > 0 
        ? subjectResults.reduce((acc, r) => acc + r.score, 0) / subjectResults.length 
        : 0;
      const passCount = subjectResults.filter(r => r.score >= (s.pass_mark || 50)).length;
      const passRate = subjectResults.length > 0 ? (passCount / subjectResults.length) * 100 : 0;
      
      return {
        'Subject Name': s.name,
        'Subject Code': s.code,
        'Pass Mark': s.pass_mark,
        'Average Score': avgScore.toFixed(2),
        'Pass Rate (%)': passRate.toFixed(2),
        'Total Students': subjectResults.length,
        'Term': statsSelectedTerm,
        'Year': statsSelectedYear
      };
    });

    const ws = XLSX.utils.json_to_sheet(statsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Curriculum Statistics");
    XLSX.writeFile(wb, "Curriculum_Statistics.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `${activeTab.replace('-', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`School: ${schoolInfo.name}`, 14, 22);

    let tableData: any[] = [];
    let tableHeaders: string[] = [];

    if (activeTab === 'learners') {
      tableHeaders = ['First Name', 'Last Name', 'Student ID', 'Phone', 'Grade', 'Section'];
      tableData = allStudents.map(s => [
        s.first_name,
        s.last_name,
        s.student_id,
        s.phone || '-',
        s.sections?.grades?.name || '-',
        s.sections?.name || '-'
      ]);
    } else if (activeTab === 'results') {
      const studentTasks = tasks.filter(t => t.section_id === resultSelectedSection && t.subject_id === resultSelectedSubject && t.term === resultSelectedTerm && t.year === parseInt(resultSelectedYear));
      tableHeaders = ['Student', 'ID', ...studentTasks.map(t => t.name), 'Avg %', 'Level'];
      tableData = filteredStudents.map(s => {
        const subjectResults = allResults.filter(r => r.student_id === s.id && studentTasks.some(t => t.id === r.task_id));
        const avg = subjectResults.length > 0 
          ? subjectResults.reduce((acc, r) => acc + (r.score / studentTasks.find(t => t.id === r.task_id)!.total_marks) * 100, 0) / subjectResults.length 
          : 0;
        const level = getLevel(avg).level;
        return [
          `${s.first_name} ${s.last_name}`,
          s.student_id,
          ...studentTasks.map(t => allResults.find(r => r.student_id === s.id && r.task_id === t.id)?.score || '-'),
          avg.toFixed(1),
          level
        ];
      });
    } else if (activeTab === 'results-schedule') {
      const studentSubjects = subjects.filter(sub => classSubjects.some(cs => cs.subject_id === sub.id && scheduleSelectedSections.includes(cs.section_id)));
      tableHeaders = ['Learner', 'ID', ...studentSubjects.map(s => s.name), 'Total', 'Avg', 'Result'];
      tableData = allStudents
        .filter(s => scheduleSelectedSections.includes(s.section_id))
        .map(student => {
          const studentResults = scheduleResults.filter(r => r.student_id === student.id);
          let total = 0;
          let count = 0;
          let failedHL = false;
          let failedSub = 0;

          const scores = studentSubjects.map(sub => {
            const res = studentResults.find(r => r.subject_id === sub.id);
            const score = res ? res.score : 0;
            const passMark = PASS_MARKS[sub.name.toLowerCase()] || sub.pass_mark || 50;
            if (res) {
              total += score;
              count++;
              if (score < passMark) failedSub++;
              if (sub.name.toLowerCase().includes('xitsonga') && score < passMark) failedHL = true;
            }
            return res ? score : '-';
          });

          const avg = count > 0 ? (total / count).toFixed(1) : '0';
          const result = count > 0 ? (!failedHL && failedSub === 0 ? 'PASS' : failedHL ? 'FAIL (HL)' : 'FAIL') : '-';

          return [`${student.first_name} ${student.last_name}`, student.student_id, ...scores, total, `${avg}%`, result];
        });
    } else if (activeTab === 'grades') {
      tableHeaders = ['Grade Name', 'Sections'];
      tableData = grades.map(g => [
        g.name,
        sections.filter(s => s.grade_id === g.id).map(s => s.name).join(', ')
      ]);
    } else if (activeTab === 'subjects') {
      tableHeaders = ['Subject Name', 'Code', 'Pass Mark'];
      tableData = subjects.map(s => [s.name, s.code, s.pass_mark + '%']);
    } else if (activeTab === 'teachers') {
      tableHeaders = ['First Name', 'Last Name', 'Email', 'Phone'];
      tableData = teachers.map(t => [t.first_name, t.last_name, t.email, t.phone || '-']);
    } else if (activeTab === 'stats') {
      tableHeaders = ['Subject', 'Code', 'Pass Mark', 'Avg Score', 'Pass Rate %', 'Total Students'];
      tableData = subjects.map(s => {
        const subjectResults = statsResults.filter(r => r.subject_id === s.id);
        const avg = subjectResults.length > 0 ? subjectResults.reduce((acc, r) => acc + r.score, 0) / subjectResults.length : 0;
        const passCount = subjectResults.filter(r => r.score >= (s.pass_mark || 50)).length;
        const passRate = subjectResults.length > 0 ? (passCount / subjectResults.length) * 100 : 0;
        return [s.name, s.code, s.pass_mark, avg.toFixed(2), passRate.toFixed(2), subjectResults.length];
      });
    }

    if (tableData.length > 0) {
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0], fontStyle: 'bold' }
      });
      doc.save(`${activeTab}_report_${new Date().getTime()}.pdf`);
    } else {
      showMessage('error', 'No data available to export for this tab');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-primary-600">
            <GraduationCap className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Evergreen</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'overview' 
                ? 'bg-primary-50 text-primary-600' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          {[
            {
              id: 'learner-info',
              label: 'Learner Info',
              icon: Folder,
              subItems: [
                { id: 'learners', label: 'Learner Upload', icon: Users },
                { id: 'results', label: 'Results Upload', icon: Upload },
                { id: 'results-schedule', label: 'Results Schedule', icon: ClipboardList },
                { id: 'stats', label: 'Curriculum Stats', icon: BarChart3 },
              ]
            },
            {
              id: 'curriculum',
              label: 'Curriculum',
              icon: BookOpen,
              subItems: [
                { id: 'subjects', label: 'Subjects', icon: BookOpen },
                { id: 'assign', label: 'Assign Subjects', icon: Plus },
                { id: 'grades', label: 'Grades & Sections', icon: GraduationCap },
              ]
            },
            {
              id: 'communication',
              label: 'Communication',
              icon: MessageSquare,
              subItems: [
                { id: 'sms', label: 'SMS', icon: MessageSquare },
                { id: 'sms-config', label: 'SMS Configuration', icon: Settings2 },
              ]
            },
            {
              id: 'timetable',
              label: 'Timetable',
              icon: Calendar,
              subItems: [
                { id: 'timetable-allocation', label: 'Allocation', icon: ClipboardList },
                { id: 'timetable-generate', label: 'Generate', icon: Clock },
                { id: 'timetable-view', label: 'View Timetable', icon: Calendar },
              ]
            },
            {
              id: 'manage-users',
              label: 'Manage Users',
              icon: Users,
              subItems: [
                { id: 'teachers', label: 'Teachers', icon: UserCheck },
              ]
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings,
              subItems: [
                { id: 'school-info', label: 'School Info', icon: GraduationCap },
                { id: 'system-settings', label: 'System Settings', icon: ShieldCheck },
                { id: 'general-config', label: 'General Config', icon: Settings2 },
              ]
            }
          ].map((category) => (
            <div key={category.id} className="space-y-1">
              <button
                onClick={() => {
                  setExpandedCategories(prev => 
                    prev.includes(category.id) 
                      ? prev.filter(id => id !== category.id) 
                      : [...prev, category.id]
                  );
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </div>
                {expandedCategories.includes(category.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              
              {expandedCategories.includes(category.id) && (
                <div className="space-y-1 ml-2 border-l-2 border-slate-50 pl-2">
                  {category.subItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        activeTab === item.id 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <img src="https://i.pravatar.cc/150?u=admin" className="w-10 h-10 rounded-xl object-cover" alt="Admin" />
            <div>
              <p className="text-sm font-bold text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Principal</p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('userRole');
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h1>
          
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
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>

            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                autoRefresh 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
              {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
            </button>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-64 pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <button className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold ${
                  message.type === 'success' ? 'bg-primary-50 text-primary-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Active Courses', value: stats.activeCourses.toLocaleString(), icon: BookOpen, trend: '+5%', color: 'text-primary-600', bg: 'bg-primary-50' },
                ].map((stat, i) => (
                  <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-primary-50 text-primary-600' : 'bg-red-50 text-red-600'}`}>
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Add Grade', tab: 'grades', icon: GraduationCap },
                      { label: 'Add Subject', tab: 'subjects', icon: BookOpen },
                      { label: 'Add Teacher', tab: 'teachers', icon: UserPlus },
                      { label: 'Assign Class', tab: 'assign', icon: Plus },
                      { label: 'Upload Students', tab: 'learners', icon: Users },
                      { label: 'Upload Results', tab: 'results', icon: Upload },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => setActiveTab(action.tab as Tab)}
                        className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all text-center group"
                      >
                        <action.icon className="w-8 h-8 text-slate-400 group-hover:text-primary-600 mx-auto mb-3" />
                        <p className="font-bold text-slate-700 group-hover:text-primary-700 text-sm">{action.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Students</h2>
                  <div className="space-y-4">
                    {recentStudents.map((student: any) => (
                      <div key={student.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-slate-500">
                            {student.sections?.grades?.name} - {student.sections?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentStudents.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">No students added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'grades' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Grade</h2>
                <form onSubmit={handleAddGrade} className="space-y-4">
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="e.g. Grade 10"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Create Grade
                  </button>
                </form>

                <div className="mt-12">
                  <h3 className="font-bold text-slate-900 mb-4">Existing Grades</h3>
                  <div className="space-y-2">
                    {grades.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-700">{g.name}</span>
                        <button 
                          onClick={() => handleDeleteGrade(g.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Section</h2>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <select
                    value={newSection.grade_id}
                    onChange={(e) => setNewSection({ ...newSection, grade_id: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <input
                    type="text"
                    value={newSection.name}
                    onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                    placeholder="e.g. Section A"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <select
                    value={newSection.class_teacher_id}
                    onChange={(e) => setNewSection({ ...newSection, class_teacher_id: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Class Teacher (Optional)</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Create Section
                  </button>
                </form>

                <div className="mt-12">
                  <h3 className="font-bold text-slate-900 mb-4">Existing Sections</h3>
                  <div className="space-y-4">
                    {sections.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-bold text-slate-700">{s.name}</span>
                            <span className="text-xs text-slate-400 ml-2">({grades.find(g => g.id === s.grade_id)?.name})</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteSection(s.id)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Class Teacher</label>
                          <select
                            value={s.class_teacher_id || ''}
                            onChange={(e) => handleUpdateSectionTeacher(s.id, e.target.value)}
                            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">No Teacher Assigned</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Subject</h2>
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="Subject Name (e.g. Mathematics)"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    placeholder="Subject Code (e.g. MATH101)"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-2">Pass Mark (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSubject.pass_mark}
                      onChange={(e) => setNewSubject({ ...newSubject, pass_mark: parseInt(e.target.value) })}
                      placeholder="Pass Mark (e.g. 50)"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Create Subject
                  </button>
                </form>

                <div className="mt-12">
                  <h3 className="font-bold text-slate-900 mb-4">Existing Subjects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.code} • Pass Mark: {s.pass_mark}%</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteSubject(s.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assign' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Assign Subject & Teacher</h2>
                <form onSubmit={handleAssignSubject} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Section</label>
                    <select
                      value={assignment.section_id}
                      onChange={(e) => setAssignment({ ...assignment, section_id: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>
                          {grades.find(g => g.id === s.grade_id)?.name} - {s.name}
                        </option>
                      ))}
                    </select>
                    {assignment.section_id && (
                      <div className="mt-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <p className="text-xs font-bold text-primary-700 flex items-center gap-2">
                          <UserCheck className="w-3 h-3" />
                          Class Teacher: {
                            sections.find(s => s.id === assignment.section_id)?.teachers 
                              ? `${sections.find(s => s.id === assignment.section_id)?.teachers?.first_name} ${sections.find(s => s.id === assignment.section_id)?.teachers?.last_name}`
                              : 'None assigned'
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Subject</label>
                    <select
                      value={assignment.subject_id}
                      onChange={(e) => setAssignment({ ...assignment, subject_id: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Choose a subject...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Assign Teacher (Optional)</label>
                    <select
                      value={assignment.teacher_id}
                      onChange={(e) => setAssignment({ ...assignment, teacher_id: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Choose a teacher...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                      ))}
                    </select>
                  </div>

                  <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Confirm Assignment
                  </button>
                </form>

                <div className="mt-12">
                  <h3 className="font-bold text-slate-900 mb-4">Current Assignments</h3>
                  <div className="space-y-4">
                    {classSubjects.map(cs => (
                      <div key={cs.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700">
                            {grades.find(g => g.id === cs.sections?.grade_id)?.name} - {cs.sections?.name}
                          </p>
                          <p className="text-sm text-slate-600">{cs.subjects?.name}</p>
                          <p className="text-xs text-slate-400">
                            Teacher: {cs.teachers ? `${cs.teachers.first_name} ${cs.teachers.last_name}` : 'Not assigned'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteAssignment(cs.id)}
                          className="text-red-400 hover:text-red-600 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {classSubjects.length === 0 && (
                      <p className="text-center text-slate-400 py-8 italic">No subjects assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'learners' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Learner Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage and view all students in the system</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] bg-primary-50 text-primary-700 px-3 py-1 rounded-lg w-fit border border-primary-100">
                      <Lock className="w-3 h-3" />
                      <span>Students log in using their <b>Accession No / ID</b> and the <b>5-digit password</b> shown below.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={generateLearnerTemplate}
                      className="flex items-center gap-2 px-4 py-2 text-primary-600 font-bold text-sm hover:bg-primary-50 rounded-xl transition-colors"
                    >
                      <Download className="w-4 h-4" /> Template
                    </button>
                    <button
                      onClick={generateLoginCredentials}
                      className="flex items-center gap-2 px-4 py-2 text-primary-600 font-bold text-sm hover:bg-primary-50 rounded-xl transition-colors"
                    >
                      <Lock className="w-4 h-4" /> Login List
                    </button>
                    <label className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-primary-700 transition-all">
                      <Upload className="w-4 h-4" /> Upload Excel
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={(e) => {
                          const sectionId = (document.getElementById('learner-section-select') as HTMLSelectElement).value;
                          if (!sectionId) {
                            showMessage('error', 'Please select a section first');
                            e.target.value = '';
                            return;
                          }
                          handleLearnerUpload(e, sectionId);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={filterGrade}
                    onChange={(e) => {
                      setFilterGrade(e.target.value);
                      setFilterSection('');
                    }}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Grades</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select
                    id="learner-section-select"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Class (Section)</option>
                    {sections
                      .filter(s => !filterGrade || s.grade_id === filterGrade)
                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    }
                  </select>
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Sorting active</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <button onClick={() => handleSort('first_name')} className="flex items-center gap-1 hover:text-slate-600">
                            Name <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <button onClick={() => handleSort('student_id')} className="flex items-center gap-1 hover:text-slate-600">
                            ID <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <button onClick={() => handleSort('gender')} className="flex items-center gap-1 hover:text-slate-600">
                            Gender <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Grade/Section</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Phone</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Password</th>
                        <th className="pb-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                {s.first_name[0]}{s.last_name[0]}
                              </div>
                              <span className="font-bold text-slate-900">{s.first_name} {s.last_name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-mono text-slate-500">{s.student_id || 'N/A'}</td>
                          <td className="py-4 text-sm text-slate-600">{s.gender || 'N/A'}</td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                              {s.sections?.grades?.name} - {s.sections?.name}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600">{s.phone || '-'}</td>
                          <td className="py-4">
                            <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              {s.password || '12345'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => setEditingStudent(s)}
                                className="p-2 text-slate-300 hover:text-primary-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-2 text-slate-300 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400">No students found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Curriculum Statistics</h2>
                  <p className="text-sm text-slate-500 mt-1">Academic performance overview across all subjects</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={statsSelectedTerm}
                    onChange={(e) => setStatsSelectedTerm(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                  </select>
                  <select
                    value={statsSelectedYear}
                    onChange={(e) => setStatsSelectedYear(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 11 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <button 
                    onClick={downloadStats}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                  >
                    <Download className="w-4 h-4" /> Download Statistics
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pass Rate Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Pass Rate by Subject (%)</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjects.map(s => {
                          const subjectResults = statsResults.filter(r => r.subject_id === s.id);
                          const passCount = subjectResults.filter(r => r.score >= (s.pass_mark || 50)).length;
                          const passRate = subjectResults.length > 0 ? (passCount / subjectResults.length) * 100 : 0;
                          return { name: s.name, passRate: parseFloat(passRate.toFixed(1)) };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          interval={0} 
                          height={80}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="passRate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Average Score Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Average Score by Subject</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjects.map(s => {
                          const subjectResults = statsResults.filter(r => r.subject_id === s.id);
                          const avgScore = subjectResults.length > 0 
                            ? subjectResults.reduce((acc, r) => acc + r.score, 0) / subjectResults.length 
                            : 0;
                          return { name: s.name, avgScore: parseFloat(avgScore.toFixed(1)) };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          interval={0} 
                          height={80}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="avgScore" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Subject</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Total Students</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Average Score</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Pass Rate</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Pass Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map(s => {
                      const subjectResults = statsResults.filter(r => r.subject_id === s.id);
                      const avgScore = subjectResults.length > 0 
                        ? subjectResults.reduce((acc, r) => acc + r.score, 0) / subjectResults.length 
                        : 0;
                      const passCount = subjectResults.filter(r => r.score >= (s.pass_mark || 50)).length;
                      const passRate = subjectResults.length > 0 ? (passCount / subjectResults.length) * 100 : 0;
                      
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4">
                            <span className="font-bold text-slate-900">{s.name}</span>
                            <p className="text-xs text-slate-400">{s.code}</p>
                          </td>
                          <td className="px-8 py-4 text-center font-medium text-slate-600">{subjectResults.length}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={`font-bold ${avgScore >= (s.pass_mark || 50) ? 'text-emerald-600' : 'text-red-600'}`}>
                              {avgScore.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-slate-900">{passRate.toFixed(1)}%</span>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${passRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${passRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-center font-bold text-slate-400">{s.pass_mark}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-12">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Class Statistics</h2>
                  <p className="text-sm text-slate-500 mt-1">Student distribution and class teachers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Students per Class Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Students per Class</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sections.map(s => {
                          const grade = grades.find(g => g.id === s.grade_id);
                          const studentCount = allStudents.filter(st => st.section_id === s.id).length;
                          return { name: `${grade?.name} - ${s.name}`, count: studentCount };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          interval={0} 
                          height={80}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Class Distribution Pie Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Student Distribution by Grade</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={grades.map(g => {
                            const studentCount = allStudents.filter(st => st.sections?.grade_id === g.id).length;
                            return { name: g.name, value: studentCount };
                          }).filter(g => g.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {grades.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Grade & Section</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Class Teacher</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Total Students</th>
                      <th className="px-8 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center">Class Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sections.map(s => {
                      const grade = grades.find(g => g.id === s.grade_id);
                      const teacher = teachers.find(t => t.id === s.class_teacher_id);
                      const classStudents = allStudents.filter(st => st.section_id === s.id);
                      const studentIds = classStudents.map(st => st.id);
                      const classResults = allResults.filter(r => studentIds.includes(r.student_id));
                      const avgScore = classResults.length > 0 
                        ? classResults.reduce((acc, r) => acc + r.score, 0) / classResults.length 
                        : 0;
                      
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4">
                            <span className="font-bold text-slate-900">{grade?.name} - {s.name}</span>
                          </td>
                          <td className="px-8 py-4">
                            {teacher ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                  {teacher.first_name[0]}{teacher.last_name[0]}
                                </div>
                                <span className="text-sm font-medium text-slate-600">{teacher.first_name} {teacher.last_name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-center font-bold text-slate-900">{classStudents.length}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={`font-bold ${avgScore >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {avgScore > 0 ? `${avgScore.toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Teacher</h2>
                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newTeacher.first_name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, first_name: e.target.value })}
                      placeholder="First Name"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={newTeacher.last_name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })}
                      placeholder="Last Name"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    placeholder="Phone Number (Optional)"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    placeholder="Login Password"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  />
                  <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Register Teacher
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Existing Teachers</h2>
                  <button 
                    onClick={handleExportTeacherLogins}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
                  >
                    <Download className="w-4 h-4" /> Export Logins
                  </button>
                </div>
                <div className="space-y-4">
                  {teachers.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold">
                          {t.first_name[0]}{t.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{t.first_name} {t.last_name}</p>
                          <p className="text-xs text-slate-500">{t.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-mono text-slate-400">
                              Password: {showPasswords[t.id] ? t.password : '••••••••'}
                            </p>
                            <button 
                              onClick={() => setShowPasswords(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                              className="text-[10px] text-primary-600 hover:underline"
                            >
                              {showPasswords[t.id] ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingTeacher(t)}
                          className="text-primary-400 hover:text-primary-600 p-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="text-red-400 hover:text-red-600 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {teachers.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No teachers registered yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Results Management</h2>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!resultSelectedSection || !resultSelectedSubject}
                      onClick={() => {
                        generateResultsTemplate(resultSelectedSection, resultSelectedSubject);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition-colors ${
                        !resultSelectedSection || !resultSelectedSubject
                          ? 'text-slate-400 cursor-not-allowed bg-slate-50'
                          : 'text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <Download className="w-4 h-4" /> Template
                    </button>
                    <label 
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        !resultSelectedSection || !resultSelectedSubject
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-primary-600 text-white cursor-pointer hover:bg-primary-700'
                      }`}
                    >
                      <Upload className="w-4 h-4" /> Upload Results
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        disabled={!resultSelectedSection || !resultSelectedSubject}
                        onChange={(e) => {
                          if (!resultSelectedSection || !resultSelectedSubject) {
                            showMessage('error', 'Please select grade, section and subject first');
                            e.target.value = '';
                            return;
                          }
                          handleResultsUpload(e, resultSelectedSection, resultSelectedSubject);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <select
                    value={resultSelectedGrade}
                    onChange={(e) => {
                      setResultSelectedGrade(e.target.value);
                      setResultSelectedSection(''); // Reset section when grade changes
                    }}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select
                    value={resultSelectedSection}
                    onChange={(e) => {
                      setResultSelectedSection(e.target.value);
                      setResultSelectedSubject(''); // Reset subject when section changes
                    }}
                    disabled={!resultSelectedGrade}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="">Select Section</option>
                    {sections
                      .filter(s => s.grade_id === resultSelectedGrade)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={resultSelectedSubject}
                    onChange={(e) => setResultSelectedSubject(e.target.value)}
                    disabled={!resultSelectedSection}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="">Select Subject</option>
                    {classSubjects
                      .filter(cs => cs.section_id === resultSelectedSection)
                      .map(cs => {
                        const subject = subjects.find(s => s.id === cs.subject_id);
                        return subject ? (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ) : null;
                      })}
                  </select>
                  <select
                    value={resultSelectedTerm}
                    onChange={(e) => setResultSelectedTerm(e.target.value)}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                  </select>
                  <select
                    value={resultSelectedYear}
                    onChange={(e) => setResultSelectedYear(e.target.value)}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 11 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Student</th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Grade/Section</th>
                        {tasks
                          .filter(t => t.section_id === resultSelectedSection && t.subject_id === resultSelectedSubject && t.term === resultSelectedTerm && t.year === parseInt(resultSelectedYear))
                          .map(t => (
                            <th key={t.id} className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center min-w-[100px]">
                              {t.name}
                              <p className="text-[10px] font-normal lowercase opacity-60">/{t.total_marks}</p>
                            </th>
                          ))
                        }
                         <th 
                           className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-center cursor-pointer hover:text-primary-600 transition-colors"
                           onClick={() => setSortConfig({ key: 'level', direction: sortConfig.key === 'level' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                         >
                           <div className="flex items-center justify-center gap-1">
                             Level
                             <ArrowUpDown className="w-3 h-3" />
                           </div>
                         </th>
                        <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s) => {
                        const studentTasks = tasks.filter(t => t.section_id === resultSelectedSection && t.subject_id === resultSelectedSubject && t.term === resultSelectedTerm && t.year === parseInt(resultSelectedYear));
                        
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                              <span className="font-bold text-slate-900">{s.first_name} {s.last_name}</span>
                              <p className="text-xs text-slate-500">{s.student_id}</p>
                            </td>
                            <td className="py-4">
                              <span className="text-sm text-slate-600">
                                {s.sections?.grades?.name} - {s.sections?.name}
                              </span>
                            </td>
                            {studentTasks.map(t => {
                              const result = allResults.find(r => r.student_id === s.id && r.task_id === t.id);
                              const passMark = getPassMark(t.subject_id);
                              const percentage = result ? (result.score / t.total_marks) * 100 : 0;
                              const isPass = percentage >= passMark;
                              
                              return (
                                <td key={t.id} className="py-4 text-center">
                                  <span className={`text-sm font-bold ${
                                    result 
                                      ? isPass ? 'text-emerald-600' : 'text-red-600'
                                      : 'text-slate-300 italic'
                                  }`}>
                                    {result ? result.score : '-'}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="py-4 text-center">
                              {(() => {
                                const subjectResults = allResults.filter(r => r.student_id === s.id && studentTasks.some(t => t.id === r.task_id));
                                if (subjectResults.length === 0) return <span className="text-slate-300">-</span>;
                                
                                const totalScore = subjectResults.reduce((acc, r) => acc + (r.score / studentTasks.find(t => t.id === r.task_id)!.total_marks) * 100, 0);
                                const avgScore = totalScore / subjectResults.length;
                                const levelInfo = getLevel(avgScore);
                                
                                return (
                                  <div className="flex flex-col items-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      avgScore >= getPassMark(resultSelectedSubject) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      Level {levelInfo.level}
                                    </span>
                                    <span className="text-[8px] text-slate-400 uppercase mt-0.5">{levelInfo.label}</span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => fetchStudentResults(s)}
                                className="text-primary-600 font-bold text-sm hover:underline"
                              >
                                View All
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No students found matching the filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results-schedule' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Results Schedule</h2>
                    <p className="text-sm text-slate-500 mt-1">View and print academic schedules for grades and sections</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      <Printer className="w-4 h-4" /> Print Schedule
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <select
                    value={scheduleSelectedGrade}
                    onChange={(e) => {
                      setScheduleSelectedGrade(e.target.value);
                      setScheduleSelectedSections([]); // Reset sections when grade changes
                    }}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>

                  <div className="flex flex-wrap gap-2 items-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 uppercase mr-2">Sections:</span>
                    {sections
                      .filter(s => s.grade_id === scheduleSelectedGrade)
                      .map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scheduleSelectedSections.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScheduleSelectedSections([...scheduleSelectedSections, s.id]);
                              } else {
                                setScheduleSelectedSections(scheduleSelectedSections.filter(id => id !== s.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-slate-700">{s.name}</span>
                        </label>
                      ))}
                  </div>

                  <select
                    value={scheduleSelectedTerm}
                    onChange={(e) => setScheduleSelectedTerm(e.target.value)}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                  </select>

                  <select
                    value={scheduleSelectedYear}
                    onChange={(e) => setScheduleSelectedYear(e.target.value)}
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 11 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-left font-bold text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Learner Name</th>
                        <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">ID Number</th>
                        {subjects
                          .filter(s => classSubjects.some(cs => cs.subject_id === s.id && scheduleSelectedSections.includes(cs.section_id)))
                          .map(s => (
                            <th key={s.id} className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider min-w-[120px]">
                              {s.name}
                              <p className="text-[10px] font-normal lowercase opacity-60">Pass: {PASS_MARKS[s.name.toLowerCase()] || s.pass_mark || 50}%</p>
                            </th>
                          ))
                        }
                        <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Total</th>
                        <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Average</th>
                        <th className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allStudents
                        .filter(s => scheduleSelectedSections.includes(s.section_id))
                        .sort((a, b) => (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name))
                        .map(student => {
                          const studentSubjects = subjects.filter(sub => classSubjects.some(cs => cs.subject_id === sub.id && cs.section_id === student.section_id));
                          const studentResults = scheduleResults.filter(r => r.student_id === student.id);
                          
                          let totalScore = 0;
                          let subjectCount = 0;
                          let failedHomeLanguage = false;
                          let failedSubjects = 0;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold text-slate-900 sticky left-0 bg-white z-10">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="p-4 text-center text-xs text-slate-500">
                                {student.student_id}
                              </td>
                              {studentSubjects.map(subject => {
                                const result = studentResults.find(r => r.subject_id === subject.id);
                                const passMark = PASS_MARKS[subject.name.toLowerCase()] || subject.pass_mark || 50;
                                const score = result ? result.score : 0;
                                const isPass = score >= passMark;
                                
                                if (result) {
                                  totalScore += score;
                                  subjectCount++;
                                  if (!isPass) failedSubjects++;
                                  if (subject.name.toLowerCase().includes('xitsonga') && !isPass) {
                                    failedHomeLanguage = true;
                                  }
                                }

                                return (
                                  <td key={subject.id} className="p-4 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className={`text-sm font-bold ${
                                        result 
                                          ? isPass ? 'text-emerald-600' : 'text-red-600'
                                          : 'text-slate-300 italic'
                                      }`}>
                                        {result ? score : '-'}
                                      </span>
                                      {result && (
                                        <span className="text-[10px] text-slate-400">
                                          L{getLevel(score).level}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="p-4 text-center font-bold text-slate-900">
                                {totalScore}
                              </td>
                              <td className="p-4 text-center font-bold text-slate-900">
                                {subjectCount > 0 ? (totalScore / subjectCount).toFixed(1) : '0'}%
                              </td>
                              <td className="p-4 text-center">
                                {subjectCount > 0 ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    !failedHomeLanguage && failedSubjects === 0 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {failedHomeLanguage ? 'FAIL (HL)' : failedSubjects > 0 ? 'FAIL' : 'PASS'}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sms' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary-50 rounded-2xl">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">SMS Communication</h2>
                  <p className="text-sm text-slate-500">Send bulk SMS to parents and staff via BulkSMS.com</p>
                </div>
                
                {(smsBalance !== null || smsBalanceError) && (
                  <div className="ml-auto flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">
                        {smsBalanceError ? 'Error' : 'Credits'}
                      </p>
                      <p className={`text-sm font-bold ${smsBalanceError ? 'text-red-600' : 'text-primary-700'}`}>
                        {smsBalanceError ? 'Failed' : smsBalance?.toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => fetchSMSBalance(true)}
                      disabled={isFetchingBalance}
                      className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                      title={smsBalanceError || 'Refresh Balance'}
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingBalance ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Recipients</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'all-students', label: 'All Students', icon: Users },
                        { id: 'all-teachers', label: 'All Teachers', icon: UserCheck },
                        { id: 'specific-grade', label: 'Specific Grade', icon: GraduationCap },
                      ].map((target) => (
                        <button
                          key={target.id}
                          onClick={() => setSmsTarget(target.id as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            smsTarget === target.id 
                              ? 'border-primary-500 bg-primary-50 text-primary-700' 
                              : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <target.icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{target.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {smsTarget === 'specific-grade' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Select Grade</label>
                      <select
                        value={smsSelectedGrade}
                        onChange={(e) => setSmsSelectedGrade(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Choose a grade...</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700">Message</label>
                      <span className={`text-[10px] font-bold ${smsMessage.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {smsMessage.length} characters ({Math.ceil(smsMessage.length / 160)} SMS)
                      </span>
                    </div>
                    <textarea 
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Type your message here..." 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 h-48 resize-none" 
                    />
                  </div>

                  <button 
                    onClick={handleSendSMS}
                    disabled={isSendingSms || !smsMessage.trim() || (smsTarget === 'specific-grade' && !smsSelectedGrade)}
                    className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingSms ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Send Broadcast
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Broadcast Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">Target Audience</span>
                      <span className="text-sm text-slate-900 font-bold capitalize">{smsTarget.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">Estimated Recipients</span>
                      <span className="text-sm text-slate-900 font-bold">
                        {smsTarget === 'all-students' ? allStudents.filter(s => s.phone).length :
                         smsTarget === 'all-teachers' ? teachers.filter(t => t.phone).length :
                         allStudents.filter(s => s.sections?.grade_id === smsSelectedGrade && s.phone).length}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-200">
                      <span className="text-sm text-slate-500 font-medium">SMS Credits Required</span>
                      <span className="text-sm text-slate-900 font-bold">
                        {(smsTarget === 'all-students' ? allStudents.filter(s => s.phone).length :
                          smsTarget === 'all-teachers' ? teachers.filter(t => t.phone).length :
                          allStudents.filter(s => s.sections?.grade_id === smsSelectedGrade && s.phone).length) * Math.ceil(smsMessage.length / 160)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Ensure your BulkSMS.com account has sufficient credits. Messages are sent instantly to all valid phone numbers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sms-config' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">SMS Configuration (BulkSMS.com)</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  <input 
                    type="text" 
                    value={schoolInfo.sms_config?.username || ''}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, sms_config: { ...schoolInfo.sms_config!, username: e.target.value } })}
                    placeholder="Enter BulkSMS.com Username" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <input 
                    type="password" 
                    value={schoolInfo.sms_config?.password || ''}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, sms_config: { ...schoolInfo.sms_config!, password: e.target.value } })}
                    placeholder="Enter BulkSMS.com Password" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
                <button 
                  onClick={handleSaveSMSConfig}
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all"
                >
                  Save Configuration
                </button>

                {schoolInfo.sms_config?.username && schoolInfo.sms_config?.password && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">BulkSMS Account Status</h3>
                      <button 
                        onClick={() => fetchSMSBalance(true)}
                        disabled={isFetchingBalance}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh Balance"
                      >
                        <RefreshCw className={`w-4 h-4 ${isFetchingBalance ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Available Credits</p>
                          <p className="text-3xl font-bold text-slate-900">
                            {smsBalance !== null ? smsBalance.toLocaleString() : (smsBalanceError ? 'Error' : '---')}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                      </div>
                      
                      {smsBalanceError && (
                        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <p className="text-[10px] text-red-700 font-medium">
                            {smsBalanceError}
                          </p>
                        </div>
                      )}
                      
                      {smsBalance !== null && smsBalance < 50 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <p className="text-[10px] text-red-700 font-medium">
                            Low balance! Please top up your BulkSMS.com account to ensure uninterrupted service.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system-settings' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">System Settings</h2>
              <p className="text-slate-500 italic">Security and system-wide configurations will be available here.</p>
            </div>
          )}

          {activeTab === 'general-config' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">General Configuration</h2>
              <p className="text-slate-500 italic">School details, academic year, and term settings.</p>
            </div>
          )}

          {activeTab === 'school-info' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">School Information</h2>
              <form onSubmit={handleSaveSchoolInfo} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">School Name</label>
                    <input 
                      type="text" 
                      value={schoolInfo.name || ''}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                      placeholder="Enter school name" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Logo URL</label>
                    <input 
                      type="text" 
                      value={schoolInfo.logo || ''}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, logo: e.target.value })}
                      placeholder="https://example.com/logo.png" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mission</label>
                  <textarea 
                    value={schoolInfo.mission || ''}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, mission: e.target.value })}
                    placeholder="Enter school mission" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 h-32" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Vision</label>
                  <textarea 
                    value={schoolInfo.vision || ''}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, vision: e.target.value })}
                    placeholder="Enter school vision" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 h-32" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Contact Number</label>
                    <input 
                      type="text" 
                      value={schoolInfo.contact || ''}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, contact: e.target.value })}
                      placeholder="+1234567890" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">School Type</label>
                    <select 
                      value={schoolInfo.type || 'public'}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, type: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">School Level</label>
                    <select 
                      value={schoolInfo.level || 'both'}
                      onChange={(e) => setSchoolInfo({ ...schoolInfo, level: e.target.value as any })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="primary">Primary (Grade 4-7)</option>
                      <option value="high">High School (Grade 8-12)</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Primary Color (School Color)</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="color" 
                        value={schoolInfo.primary_color || '#059669'}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, primary_color: e.target.value })}
                        className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 overflow-hidden" 
                      />
                      <input 
                        type="text" 
                        value={schoolInfo.primary_color || '#059669'}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, primary_color: e.target.value })}
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Secondary Color</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="color" 
                        value={schoolInfo.secondary_color || '#10b981'}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, secondary_color: e.target.value })}
                        className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 overflow-hidden" 
                      />
                      <input 
                        type="text" 
                        value={schoolInfo.secondary_color || '#10b981'}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, secondary_color: e.target.value })}
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      />
                    </div>
                  </div>
                </div>
                <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all">Save School Information</button>
              </form>
            </div>
          )}

          {activeTab === 'timetable-allocation' && (
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Subject Allocation</h2>
                  <p className="text-sm text-slate-500">Define the number of periods per week for each subject assignment</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setSelectedPhase('lower')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'lower' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Lower (R-3)
                    </button>
                    <button 
                      onClick={() => setSelectedPhase('higher')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'higher' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Higher (4-7)
                    </button>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print List
                  </button>
                  <button 
                    onClick={handleSaveAllAllocations}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save All Changes
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">Teacher</th>
                      <th className="p-4 border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">Subject</th>
                      <th className="p-4 border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">Grade</th>
                      <th className="p-4 border-b border-slate-100 bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">Section</th>
                      <th className="p-4 border-b border-slate-100 bg-slate-50 text-center text-xs font-bold text-slate-500 uppercase w-40">Periods / Week</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {classSubjects
                      .filter(cs => {
                        const gradeName = grades.find(g => g.id === cs.sections?.grade_id)?.name || '';
                        return getGradePhase(gradeName) === selectedPhase;
                      })
                      .map((cs) => {
                        const index = classSubjects.findIndex(item => item.id === cs.id);
                        return (
                          <tr key={cs.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-sm font-medium text-slate-700">
                              {cs.teachers ? `${cs.teachers.first_name} ${cs.teachers.last_name}` : <span className="text-slate-400 italic">Unassigned</span>}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {cs.subjects?.name}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {grades.find(g => g.id === cs.sections?.grade_id)?.name}
                            </td>
                            <td className="p-4 text-sm text-slate-600 font-bold">
                              {cs.sections?.name}
                            </td>
                            <td className="p-4 text-center flex items-center justify-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="40"
                                value={cs.periods_per_week || 0}
                                onChange={(e) => {
                                  const newVal = parseInt(e.target.value) || 0;
                                  const updated = [...classSubjects];
                                  updated[index] = { ...updated[index], periods_per_week: newVal };
                                  setClassSubjects(updated);
                                }}
                                className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-primary-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                              />
                              <button 
                                onClick={async () => {
                                  setLoading(true);
                                  try {
                                    const { error } = await supabase.from('class_subjects').upsert([{
                                      id: cs.id,
                                      section_id: cs.section_id,
                                      subject_id: cs.subject_id,
                                      teacher_id: cs.teacher_id,
                                      periods_per_week: cs.periods_per_week || 0
                                    }]);
                                    if (error) throw error;
                                    showMessage('success', 'Allocation saved');
                                    fetchInitialData();
                                  } catch (error: any) {
                                    showMessage('error', error.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Save this row"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {classSubjects.filter(cs => {
                      const gradeName = grades.find(g => g.id === cs.sections?.grade_id)?.name || '';
                      return getGradePhase(gradeName) === selectedPhase;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                          No subject assignments found for {selectedPhase === 'lower' ? 'Lower (R-3)' : 'Higher (4-7)'} phase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'timetable-generate' && (
            <div className="space-y-6">
              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Generate Weekly Timetable</h2>
                    <p className="text-sm text-slate-500">
                      Configure school hours and generate a consolidated timetable
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setSelectedPhase('lower')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'lower' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Lower (R-3)
                      </button>
                      <button 
                        onClick={() => setSelectedPhase('higher')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'higher' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Higher (4-7)
                      </button>
                    </div>
                    <button 
                      className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleGenerateTimetable}
                      disabled={generationProgress > 0}
                    >
                      {generationProgress > 0 ? 'Generating...' : 'Generate Now'}
                    </button>
                    <button 
                      className="px-8 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100"
                      onClick={() => {
                        askConfirmation(
                          'Clear Timetable',
                          `Are you sure you want to clear the timetable for ${selectedPhase} phase?`,
                          async () => {
                            setLoading(true);
                            try {
                              const phaseSections = sections.filter(s => {
                                const gradeName = grades.find(g => g.id === s.grade_id)?.name || '';
                                return getGradePhase(gradeName) === selectedPhase;
                              });
                              const sectionIds = phaseSections.map(s => s.id);
                              await supabase.from('timetable_allocations').delete().in('section_id', sectionIds);
                              showMessage('success', 'Timetable cleared');
                              fetchInitialData();
                            } catch (error: any) {
                              showMessage('error', error.message);
                            } finally {
                              setLoading(false);
                            }
                          }
                        );
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {generationProgress > 0 && (
                  <div className="mb-8 p-6 bg-primary-50 rounded-2xl border border-primary-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary-700">Generation Progress</span>
                      <span className="text-sm font-bold text-primary-700">{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-primary-200 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="bg-primary-600 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-primary-600 mt-2 font-medium">
                      {generationProgress < 30 ? 'Analyzing sections and assignments...' : 
                       generationProgress < 80 ? 'Allocating subjects to time slots...' : 
                       generationProgress < 100 ? 'Finalizing and saving to database...' : 'Generation complete!'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary-600" />
                        School Hours
                      </h3>
                      <div className="space-y-4">
                        <button 
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const id = (schoolInfo as any).id;
                              let error;

                              if (!id) {
                                const { error: insertError, data } = await supabase
                                  .from('school_info')
                                  .insert([{ ...schoolInfo, timetable_config: timetableConfig }])
                                  .select()
                                  .single();
                                error = insertError;
                                if (data) setSchoolInfo(data);
                              } else {
                                const { error: updateError } = await supabase
                                  .from('school_info')
                                  .update({ timetable_config: timetableConfig })
                                  .eq('id', id);
                                error = updateError;
                              }

                              if (error) throw error;
                              showMessage('success', 'Configuration saved successfully');
                            } catch (error: any) {
                              showMessage('error', error.message);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all mb-4"
                        >
                          Save Configuration
                        </button>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                          <input 
                            type="time"
                            value={timetableConfig.startTime || '08:00'}
                            onChange={(e) => setTimetableConfig({...timetableConfig, startTime: e.target.value})}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Period Duration (min)</label>
                          <input 
                            type="number"
                            value={timetableConfig.periodDuration || 40}
                            onChange={(e) => setTimetableConfig({...timetableConfig, periodDuration: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Knock Off Time</label>
                          <input 
                            type="time"
                            value={timetableConfig.knockOffTime || '14:30'}
                            onChange={(e) => setTimetableConfig({...timetableConfig, knockOffTime: e.target.value})}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary-600" />
                        Breaks
                      </h3>
                      <div className="space-y-3">
                        {timetableConfig.breaks.map((brk, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="flex-1">
                              <div className="text-xs font-bold text-slate-900">{brk.name}</div>
                              <div className="text-[10px] text-slate-500">{brk.startTime} • {brk.duration} min</div>
                            </div>
                            <button 
                              onClick={() => {
                                const newBreaks = [...timetableConfig.breaks];
                                newBreaks.splice(idx, 1);
                                setTimetableConfig({...timetableConfig, breaks: newBreaks});
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const name = prompt('Break Name (e.g. Lunch)');
                            const startTime = prompt('Start Time (HH:MM)');
                            const duration = parseInt(prompt('Duration (minutes)') || '0');
                            if (name && startTime && duration) {
                              setTimetableConfig({
                                ...timetableConfig,
                                breaks: [...timetableConfig.breaks, { name, startTime, duration }]
                              });
                            }
                          }}
                          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-primary-300 hover:text-primary-600 transition-all"
                        >
                          + Add Break
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 h-full">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Time Slot Preview</h3>
                      <div className="space-y-2">
                        {calculatePeriodTimes().map((slot, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${slot.isBreak ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${slot.isBreak ? 'bg-amber-200 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                                {idx + 1}
                              </div>
                              <div>
                                <div className={`text-sm font-bold ${slot.isBreak ? 'text-amber-900' : 'text-slate-900'}`}>{slot.name}</div>
                                <div className="text-xs text-slate-500">{slot.start} - {slot.end}</div>
                              </div>
                            </div>
                            {slot.isBreak && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Break</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'timetable-view' && (
            <div className="space-y-6">
              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">View Weekly Timetable</h2>
                    <p className="text-sm text-slate-500">
                      View, print, and download consolidated or personal educator timetables
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 no-print">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setTimetableType('consolidated')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timetableType === 'consolidated' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Consolidated
                      </button>
                      <button 
                        onClick={() => setTimetableType('teacher')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timetableType === 'teacher' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Educator
                      </button>
                    </div>

                    {timetableType === 'teacher' && (
                      <select 
                        value={viewTeacherId}
                        onChange={(e) => setViewTeacherId(e.target.value)}
                        className="px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="">Select Educator</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => {
                          setSelectedPhase('lower');
                          setViewTimetableGradeId('');
                          setViewTimetableSectionId('');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'lower' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Lower (R-3)
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedPhase('higher');
                          setViewTimetableGradeId('');
                          setViewTimetableSectionId('');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedPhase === 'higher' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Higher (4-7)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={viewTimetableGradeId}
                        onChange={(e) => {
                          setViewTimetableGradeId(e.target.value);
                          setViewTimetableSectionId('');
                        }}
                        className="px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="">All Grades</option>
                        {grades.filter(g => getGradePhase(g.name) === selectedPhase).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>

                      <select 
                        value={viewTimetableSectionId}
                        onChange={(e) => setViewTimetableSectionId(e.target.value)}
                        className="px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                        disabled={!viewTimetableGradeId}
                      >
                        <option value="">All Sections</option>
                        {sections.filter(s => s.grade_id === viewTimetableGradeId).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                      title="Print Timetable"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        const data = timetableAllocations.filter(a => {
                          const gradeName = grades.find(g => g.id === a.sections?.grade_id)?.name || '';
                          const matchesPhase = getGradePhase(gradeName) === selectedPhase;
                          const matchesGrade = !viewTimetableGradeId || a.sections?.grade_id === viewTimetableGradeId;
                          const matchesSection = !viewTimetableSectionId || a.section_id === viewTimetableSectionId;
                          
                          if (timetableType === 'teacher') {
                            return matchesPhase && matchesGrade && matchesSection && a.teacher_id === viewTeacherId;
                          }
                          return matchesPhase && matchesGrade && matchesSection;
                        });
                        const ws = XLSX.utils.json_to_sheet(data.map(a => ({
                          Day: a.day,
                          Period: a.period,
                          Section: a.sections?.name,
                          Subject: a.subjects?.name,
                          Teacher: `${a.teachers?.first_name} ${a.teachers?.last_name}`
                        })));
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
                        XLSX.writeFile(wb, `timetable_${timetableType}_${selectedPhase}.xlsx`);
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                      title="Download Current View Excel"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        const wb = XLSX.utils.book_new();
                        teachers.forEach(teacher => {
                          const teacherAllocations = timetableAllocations.filter(a => a.teacher_id === teacher.id);
                          if (teacherAllocations.length === 0) return;
                          
                          const data = teacherAllocations.map(a => ({
                            Day: a.day,
                            Period: a.period,
                            Section: a.sections?.name,
                            Subject: a.subjects?.name
                          }));
                          const ws = XLSX.utils.json_to_sheet(data);
                          XLSX.utils.book_append_sheet(wb, ws, `${teacher.first_name} ${teacher.last_name}`.substring(0, 31));
                        });
                        XLSX.writeFile(wb, `all_educator_timetables_${selectedPhase}.xlsx`);
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                      title="Download All Educator Timetables"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                  <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-6">
                    {schoolInfo.logo && <img src={schoolInfo.logo} className="w-20 h-20 mx-auto mb-2 object-contain" alt="Logo" />}
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{schoolInfo.name}</h1>
                    <p className="text-sm font-bold text-slate-600 mt-1">{schoolInfo.contact}</p>
                    <div className="mt-4 inline-block px-6 py-2 bg-slate-900 text-white font-bold text-sm uppercase tracking-widest">
                      Weekly Timetable - {selectedPhase === 'lower' ? 'Lower Phase (R-3)' : 'Higher Phase (4-7)'}
                      {viewTimetableGradeId && ` - ${grades.find(g => g.id === viewTimetableGradeId)?.name}`}
                      {viewTimetableSectionId && ` - ${sections.find(s => s.id === viewTimetableSectionId)?.name}`}
                    </div>
                  </div>

                  {timetableType === 'consolidated' ? (
                    <div className="space-y-12">
                      {sections
                        .filter(s => {
                          const gradeName = grades.find(g => g.id === s.grade_id)?.name || '';
                          const matchesPhase = getGradePhase(gradeName) === selectedPhase;
                          const matchesGrade = !viewTimetableGradeId || s.grade_id === viewTimetableGradeId;
                          const matchesSection = !viewTimetableSectionId || s.id === viewTimetableSectionId;
                          return matchesPhase && matchesGrade && matchesSection;
                        })
                        .map(section => (
                          <div key={section.id} className="page-break-after">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center justify-between">
                              <span>Grade & Section: {section.name}</span>
                              <span className="text-sm font-normal text-slate-500 no-print">{selectedPhase === 'lower' ? 'Lower Phase' : 'Higher Phase'}</span>
                            </h3>
                            <table className="w-full border-collapse border border-slate-200 text-sm">
                              <thead>
                                <tr className="bg-slate-50">
                                  <th className="border border-slate-200 p-2 w-24">Period</th>
                                  {DAYS.map(day => (
                                    <th key={day} className="border border-slate-200 p-2">{day}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {calculatePeriodTimes().map(slot => (
                                  <tr key={slot.name} className={slot.isBreak ? 'bg-amber-50/30' : ''}>
                                    <td className="border border-slate-200 p-2 font-bold bg-slate-50">
                                      <div className="text-xs">{slot.name}</div>
                                      <div className="text-[10px] text-slate-400 font-normal">{slot.start}-{slot.end}</div>
                                    </td>
                                    {DAYS.map(day => {
                                      if (slot.isBreak) {
                                        return (
                                          <td key={day} className="border border-slate-200 p-2 text-center bg-amber-50/50">
                                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{slot.name}</span>
                                          </td>
                                        );
                                      }
                                      const allocation = timetableAllocations.find(a => 
                                        a.section_id === section.id && 
                                        a.day === day && 
                                        a.period === slot.name
                                      );
                                      return (
                                        <td key={day} className="border border-slate-200 p-2 min-h-[60px] vertical-top">
                                          {allocation ? (
                                            <div className="space-y-1">
                                              <div className="font-bold text-primary-700">{allocation.subjects?.name}</div>
                                              <div className="text-xs text-slate-500">{allocation.teachers?.first_name} {allocation.teachers?.last_name}</div>
                                            </div>
                                          ) : (
                                            <div className="text-slate-300 italic text-xs">Free</div>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div>
                      {viewTeacherId ? (
                        <div className="page-break-after">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
                            Educator Timetable: {teachers.find(t => t.id === viewTeacherId)?.first_name} {teachers.find(t => t.id === viewTeacherId)?.last_name}
                          </h3>
                          <table className="w-full border-collapse border border-slate-200 text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-200 p-2 w-24">Period</th>
                                {DAYS.map(day => (
                                  <th key={day} className="border border-slate-200 p-2">{day}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {calculatePeriodTimes().map(slot => (
                                <tr key={slot.name} className={slot.isBreak ? 'bg-amber-50/30' : ''}>
                                  <td className="border border-slate-200 p-2 font-bold bg-slate-50">
                                    <div className="text-xs">{slot.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{slot.start}-{slot.end}</div>
                                  </td>
                                  {DAYS.map(day => {
                                    if (slot.isBreak) {
                                      return (
                                        <td key={day} className="border border-slate-200 p-2 text-center bg-amber-50/50">
                                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{slot.name}</span>
                                        </td>
                                      );
                                    }
                                    const allocation = timetableAllocations.find(a => 
                                      a.teacher_id === viewTeacherId && 
                                      a.day === day && 
                                      a.period === slot.name &&
                                      (!viewTimetableGradeId || a.sections?.grade_id === viewTimetableGradeId) &&
                                      (!viewTimetableSectionId || a.section_id === viewTimetableSectionId)
                                    );
                                    return (
                                      <td key={day} className="border border-slate-200 p-2 min-h-[60px] vertical-top">
                                        {allocation ? (
                                          <div className="space-y-1">
                                            <div className="font-bold text-primary-700">{allocation.subjects?.name}</div>
                                            <div className="text-xs text-slate-500">Class: {allocation.sections?.name}</div>
                                          </div>
                                        ) : (
                                          <div className="text-slate-300 italic text-xs">Free</div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-slate-400 italic">
                          Please select an educator to view their personal timetable.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {showResultsModal && selectedStudent && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Results: {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p className="text-slate-500">ID: {selectedStudent.student_id} | {selectedStudent.sections?.grades?.name} - {selectedStudent.sections?.name}</p>
                  </div>
                  <button 
                    onClick={() => setShowResultsModal(false)}
                    className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1">
                  {studentResults.length > 0 ? (
                    <div className="space-y-8">
                      {/* Group by Subject */}
                      {Array.from(new Set(studentResults.map(r => r.subjects?.name))).map(subjectName => (
                        <div key={subjectName} className="space-y-4">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                            {subjectName}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentResults
                              .filter(r => r.subjects?.name === subjectName)
                              .map(result => (
                                <div key={result.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                  <div>
                                    <p className="font-bold text-slate-700">{result.tasks?.name || 'General Result'}</p>
                                    <p className="text-xs text-slate-500">{result.term} {result.year}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-primary-600">
                                      {result.score}
                                      <span className="text-xs text-slate-400 font-normal ml-1">
                                        / {result.tasks?.total_marks || 100}
                                      </span>
                                    </p>
                                    {result.tasks?.weighting && (
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                        Weight: {result.tasks.weighting}%
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">No results found for this student.</p>
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setShowResultsModal(false)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Edit Teacher Modal */}
          <AnimatePresence>
            {editingTeacher && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Edit Teacher</h2>
                    <button onClick={() => setEditingTeacher(null)} className="p-2 hover:bg-slate-100 rounded-full">
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateTeacher} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">First Name</label>
                        <input
                          type="text"
                          value={editingTeacher.first_name || ''}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, first_name: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Last Name</label>
                        <input
                          type="text"
                          value={editingTeacher.last_name || ''}
                          onChange={(e) => setEditingTeacher({ ...editingTeacher, last_name: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2">Email Address</label>
                      <input
                        type="email"
                        value={editingTeacher.email || ''}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editingTeacher.phone || ''}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2">Login Password</label>
                      <input
                        type="text"
                        value={editingTeacher.password || ''}
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setEditingTeacher(null)}
                        className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {editingStudent && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Edit Student</h2>
                    <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-slate-100 rounded-full">
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">First Name</label>
                        <input
                          type="text"
                          value={editingStudent.first_name || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Last Name</label>
                        <input
                          type="text"
                          value={editingStudent.last_name || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, last_name: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Accession No / ID</label>
                        <input
                          type="text"
                          value={editingStudent.student_id || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, student_id: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Gender</label>
                        <select
                          value={editingStudent.gender || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2">Class (Section)</label>
                      <select
                        value={editingStudent.section_id || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, section_id: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Class</option>
                        {sections.map(s => {
                          const grade = grades.find(g => g.id === s.grade_id);
                          return (
                            <option key={s.id} value={s.id}>
                              {grade?.name} - {s.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2">Login Password</label>
                      <input
                        type="text"
                        value={editingStudent.password || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 px-6 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {confirmModal.show && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center"
                >
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h2>
                  <p className="text-slate-500 mb-8">{confirmModal.message}</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                      className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        await confirmModal.onConfirm();
                        setConfirmModal({ ...confirmModal, show: false });
                      }}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

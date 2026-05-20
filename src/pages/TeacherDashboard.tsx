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
  Trash2,
  Menu,
  Printer,
  Sparkles,
  BookMarked,
  ChevronDown,
  BarChart2,
  BarChart3,
  NotebookPen,
  CheckSquare,
  Square,
  Save,
  PlusCircle,
  ListChecks,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  Download,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import LearnerProfile from '../components/LearnerProfile';
import { generateQuizFromImage } from '../lib/gemini';
import { generateCAPSLessonPlan, generateCAPSTermPlan } from '../lib/lessonPlanEngine';

type Tab = 'overview' | 'results' | 'attendance' | 'timetable' | 'meetings' | 'materials' | 'learner-list' | 'subject-ranking' | 'lesson-plan' | 'analysis-of-results' | 'lesson-prep' | 'at-risk';

const PASS_MARKS: Record<string, number> = {
  'english': 40,
  'maths': 50,
  'mathematics': 50,
  'life skills': 40,
  'life skill': 40,
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
  if (name.includes('math')) return 50;
  return PASS_MARKS[name] || defaultPassMark || 40;
};

export default function TeacherDashboard() {
  const school_id_raw = localStorage.getItem('school_id');
  const school_id = (school_id_raw && school_id_raw !== 'undefined' && !isNaN(Number(school_id_raw))) ? Number(school_id_raw) : 1;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
  const [sportEvents, setSportEvents] = useState<any[]>([]);
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
  const [schoolEmis, setSchoolEmis] = useState('');
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any | null>(null);
  const [selectedAchieverSubject, setSelectedAchieverSubject] = useState<string>(''); // empty means overall
  const [llGrade, setLlGrade] = useState('');
  const [llSubject, setLlSubject] = useState('');
  const [llLevel, setLlLevel] = useState('all');
  const [llTerm, setLlTerm] = useState('Term 1');
  const [llYear, setLlYear] = useState(new Date().getFullYear().toString());
  const [llResults, setLlResults] = useState<any[]>([]);
  const [llLoading, setLlLoading] = useState(false);
  const [srSubject, setSrSubject] = useState('');
  const [srGrade, setSrGrade] = useState('');
  const [srTerm, setSrTerm] = useState('Term 1');
  const [srYear, setSrYear] = useState(new Date().getFullYear().toString());
  const [srResults, setSrResults] = useState<any[]>([]);
  const [srLoading, setSrLoading] = useState(false);
  const [lpMode, setLpMode] = useState<'weekly' | 'term'>('weekly');
  const [lpSubject, setLpSubject] = useState('');
  const [lpGrade, setLpGrade] = useState('');
  const [lpTerm, setLpTerm] = useState('Term 1');
  const [lpWeek, setLpWeek] = useState(1);
  const [lpDuration, setLpDuration] = useState(40);
  const [lpTopic, setLpTopic] = useState('');
  const [lpLoading, setLpLoading] = useState(false);
  const [lpPlan, setLpPlan] = useState<any>(null);
  const [lpTotalWeeks, setLpTotalWeeks] = useState(10);
  const [lpTermPlan, setLpTermPlan] = useState<any>(null);
  const [lpError, setLpError] = useState('');

  // Lesson Preparation
  const DEFAULT_CHECKLIST = [
    { id: 'objectives', label: 'Lesson objectives prepared and ready to write on the board', checked: false },
    { id: 'resources', label: 'Teaching resources gathered (textbooks, worksheets, manipulatives)', checked: false },
    { id: 'examples', label: 'Worked examples and practice problems prepared', checked: false },
    { id: 'whiteboard', label: 'Whiteboard / projector checked and working', checked: false },
    { id: 'seating', label: 'Seating arrangement planned for the lesson activity', checked: false },
    { id: 'differentiation', label: 'Support and extension activities ready for all learner levels', checked: false },
    { id: 'assessment', label: 'Formative assessment activity or questions planned', checked: false },
    { id: 'homework', label: 'Homework task identified and ready to assign', checked: false },
  ];
  const [prepSubject, setPrepSubject] = useState('');
  const [prepGrade, setPrepGrade] = useState('');
  const [prepDate, setPrepDate] = useState(new Date().toISOString().split('T')[0]);
  const [prepPeriod, setPrepPeriod] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [prepChecklist, setPrepChecklist] = useState<{id: string; label: string; checked: boolean}[]>(DEFAULT_CHECKLIST);
  const [prepResources, setPrepResources] = useState<string[]>([]);
  const [prepNewResource, setPrepNewResource] = useState('');
  const [prepNewItem, setPrepNewItem] = useState('');
  const [prepSavedAt, setPrepSavedAt] = useState<string | null>(null);
  const [riskGrade, setRiskGrade] = useState('');
  const [riskSubject, setRiskSubject] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'watch'>('all');
  const [riskData, setRiskData] = useState<any[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskExpanded, setRiskExpanded] = useState<string | null>(null);

  const getPrepKey = () => {
    const uid = localStorage.getItem('user_id') || 'teacher';
    return `prep_${uid}_${prepSubject}_${prepGrade}_${prepDate}`;
  };

  const savePrep = () => {
    const key = getPrepKey();
    const data = { prepNotes, prepChecklist, prepResources, prepPeriod };
    localStorage.setItem(key, JSON.stringify(data));
    setPrepSavedAt(new Date().toLocaleTimeString());
  };

  const loadPrep = (subjectId: string, gradeId: string, date: string) => {
    const uid = localStorage.getItem('user_id') || 'teacher';
    const key = `prep_${uid}_${subjectId}_${gradeId}_${date}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setPrepNotes(data.prepNotes || '');
        setPrepChecklist(data.prepChecklist || DEFAULT_CHECKLIST);
        setPrepResources(data.prepResources || []);
        setPrepPeriod(data.prepPeriod || '');
        setPrepSavedAt(null);
      } catch { /* ignore */ }
    } else {
      setPrepNotes('');
      setPrepChecklist(DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })));
      setPrepResources([]);
      setPrepPeriod('');
      setPrepSavedAt(null);
    }
  };

  const handlePrepPrint = () => {
    const subjectName = subjects.find((s: any) => s.id === prepSubject)?.name || '—';
    const gradeName = grades.find((g: any) => g.id === prepGrade)?.name || '—';
    const checked = prepChecklist.filter(i => i.checked).length;
    const total = prepChecklist.length;
    const checkRows = prepChecklist.map(item => `
      <tr>
        <td style="width:24px;text-align:center;font-size:16px">${item.checked ? '✓' : '○'}</td>
        <td style="color:${item.checked ? '#059669' : '#374151'};text-decoration:${item.checked ? 'none' : 'none'}">${item.label}</td>
      </tr>`).join('');
    const resourceRows = prepResources.map(r => `<li>${r}</li>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Lesson Preparation — ${subjectName} ${gradeName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff;padding:28px}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #2563eb}
      .header img{height:52px;width:52px;object-fit:contain;border-radius:8px}
      .header h1{font-size:20px;font-weight:bold;color:#1e293b;margin:0 0 2px}
      .header h2{font-size:13px;font-weight:500;color:#64748b;margin:0}
      .meta{display:flex;flex-wrap:wrap;gap:24px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;margin-bottom:18px;font-size:11px}
      .meta strong{display:block;font-size:9px;text-transform:uppercase;color:#94a3b8;margin-bottom:2px}
      .progress{background:#e2e8f0;border-radius:4px;height:8px;margin-bottom:18px}
      .progress-bar{background:#2563eb;height:8px;border-radius:4px;width:${total > 0 ? Math.round((checked/total)*100) : 0}%}
      h3{font-size:13px;font-weight:bold;color:#1e293b;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      td{padding:5px 8px;vertical-align:top;border-bottom:1px solid #f1f5f9;font-size:11px}
      ul{padding-left:20px;margin-bottom:16px}
      li{margin-bottom:4px;font-size:11px}
      .notes-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;min-height:80px;font-size:11px;line-height:1.6;margin-bottom:16px;white-space:pre-wrap}
      .footer{margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;text-align:center}
      .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:bold;background:#dbeafe;color:#1d4ed8}
    </style></head><body>
    <div class="header">
      ${schoolInfo?.logo ? `<img src="${schoolInfo.logo}" alt="Logo"/>` : ''}
      <div>
        <h1>${schoolInfo?.name || 'School'}</h1>
        <h2>Lesson Preparation Sheet</h2>
      </div>
    </div>
    <div class="meta">
      <div><strong>Subject</strong>${subjectName}</div>
      <div><strong>Grade</strong>${gradeName}</div>
      <div><strong>Date</strong>${prepDate}</div>
      ${prepPeriod ? `<div><strong>Period / Time</strong>${prepPeriod}</div>` : ''}
      <div><strong>Readiness</strong><span class="badge">${checked}/${total} items complete</span></div>
    </div>
    <div class="progress"><div class="progress-bar"></div></div>
    <h3>Preparation Checklist</h3>
    <table>${checkRows}</table>
    ${prepResources.length > 0 ? `<h3>Resources Needed</h3><ul>${resourceRows}</ul>` : ''}
    ${prepNotes ? `<h3>Teacher Preparation Notes</h3><div class="notes-box">${prepNotes}</div>` : ''}
    <div class="footer">Generated by ${schoolInfo?.name || 'School'} Management System · ${new Date().toLocaleString()}</div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // Analysis of Results
  const [arGrade, setArGrade] = useState('');
  const [arSection, setArSection] = useState('');
  const [arSubject, setArSubject] = useState('');
  const [arYear, setArYear] = useState(new Date().getFullYear().toString());
  const [arResults, setArResults] = useState<any[]>([]);
  const [arLoading, setArLoading] = useState(false);
  const [arSections, setArSections] = useState<any[]>([]);
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
      if (schoolData?.timetable_config?.emis) {
        setSchoolEmis(schoolData.timetable_config.emis);
      }

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

      const classesList = Array.from(uniqueClasses.values())
        .sort((a: any, b: any) => {
          const gradeA = a.grades?.name || '';
          const gradeB = b.grades?.name || '';
          return gradeA.localeCompare(gradeB) || a.name.localeCompare(b.name);
        });
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

      // Fetch sports events
      const { data: sportsData } = await supabase
        .from('sports_events')
        .select('*')
        .eq('school_id', school_id)
        .order('date', { ascending: true });
      setSportEvents(sportsData || []);

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

  // ── Learners at Risk (Teacher) ────────────────────────────────────────────
  const tGetInterventions = (capsLevel: number, subjectName: string, trend: string): string[] => {
    const s = subjectName.toLowerCase();
    const isMaths = s.includes('math');
    const isLang = s.includes('english') || s.includes('xitsonga') || s.includes('afrikaans') || s.includes('zulu') || s.includes('sesotho') || s.includes('sepedi') || s.includes('setswana');
    const list: string[] = [];
    if (capsLevel <= 1) {
      list.push('Schedule an urgent individual support session with the learner');
      list.push('Notify parent/guardian immediately and arrange a face-to-face meeting');
      list.push('Refer to school learning support or remedial programme');
      list.push('Develop an Individual Support Plan (ISP) in consultation with the HOD');
      if (isMaths) {
        list.push('Daily number drills and basic operations revision (15 min per day)');
        list.push('Use concrete manipulatives (counters, number lines) to build conceptual understanding');
        list.push('Identify and address specific gaps using a diagnostic assessment');
      } else if (isLang) {
        list.push('Daily oral reading sessions with a reading partner or teacher');
        list.push('Intensive vocabulary and phonics reinforcement activities');
        list.push('Refer to a reading recovery or language support programme');
      } else {
        list.push('Provide simplified notes and structured study guides');
        list.push('Break content into smaller achievable chunks with clear milestones');
      }
    } else if (capsLevel === 2) {
      list.push('Assign a peer study buddy or organise a small-group session (2–4 learners)');
      list.push('Send home a written progress concern notice to parents/guardians');
      list.push('Provide additional targeted practice worksheets every week');
      if (isMaths) {
        list.push('Focus on foundational concepts before introducing new work');
        list.push('Use visual models, number lines, and diagrams to support reasoning');
      } else if (isLang) {
        list.push('Guided reading group sessions twice per week');
        list.push('Comprehension booster activities with scaffolded questions');
      } else {
        list.push('Use mind maps and graphic organisers for key concepts');
        list.push('Regular low-stakes formative quizzes to build confidence');
      }
    } else {
      list.push('Provide differentiated in-class support activities');
      list.push('Weekly mini-assessments to monitor progress closely');
      list.push('Encourage peer discussion and collaborative learning');
      if (isMaths) list.push('Additional targeted problem-solving practice at home');
      else if (isLang) list.push('Targeted comprehension and writing exercises');
      else list.push('Encourage self-study using provided notes and resources');
    }
    if (trend === 'down') {
      list.push('Investigate root cause of declining performance (home environment, motivation, health)');
      list.push('Increase check-in frequency — brief individual conversations once or twice a week');
    }
    return list;
  };

  const tCapsLevel = (score: number): number => {
    if (score >= 80) return 7; if (score >= 70) return 6; if (score >= 60) return 5;
    if (score >= 50) return 4; if (score >= 40) return 3; if (score >= 30) return 2; return 1;
  };

  const fetchAtRisk = async () => {
    setRiskLoading(true);
    setRiskData([]);
    try {
      // Get students in teacher's assigned classes
      const classIds = assignedClasses.map((c: any) => c.id);
      if (classIds.length === 0) { setRiskLoading(false); return; }

      const studentMap = new Map<string, { grade: string; section: string; name: string }>();
      let sfrom = 0;
      while (true) {
        const { data: sdata } = await supabase
          .from('students')
          .select('id, name, sections(name, grades(name))')
          .in('section_id', classIds)
          .range(sfrom, sfrom + 499);
        for (const s of (sdata || [])) {
          const sec = Array.isArray(s.sections) ? s.sections[0] : s.sections;
          const gradeObj = Array.isArray(sec?.grades) ? sec.grades[0] : sec?.grades;
          const gName = gradeObj?.name || '';
          if (gName) studentMap.set(String(s.id), { grade: gName, section: sec?.name || '', name: s.name || '' });
        }
        if ((sdata || []).length < 500) break;
        sfrom += 500;
      }

      const stuIds = [...studentMap.keys()];
      if (stuIds.length === 0) { setRiskLoading(false); return; }

      let allRows: any[] = [];
      let rfrom = 0;
      while (true) {
        const { data, error } = await supabase
          .from('results')
          .select('score, student_id, term, year, subjects(name)')
          .eq('school_id', school_id)
          .in('student_id', stuIds.map(Number))
          .range(rfrom, rfrom + 499);
        if (error) throw error;
        allRows = [...allRows, ...(data || [])];
        if ((data || []).length < 500) break;
        rfrom += 500;
      }

      const groupMap = new Map<string, { termScores: Map<string, number[]>; info: any; subject: string }>();
      for (const row of allRows) {
        const score = Number(row.score);
        if (isNaN(score)) continue;
        const subj = (row.subjects?.name || '').trim();
        if (!subj) continue;
        const sid = String(row.student_id);
        const info = studentMap.get(sid);
        if (!info) continue;
        const key = `${sid}|||${subj}`;
        if (!groupMap.has(key)) groupMap.set(key, { termScores: new Map(), info, subject: subj });
        const termKey = `${row.year}|${row.term}`;
        const g = groupMap.get(key)!;
        if (!g.termScores.has(termKey)) g.termScores.set(termKey, []);
        g.termScores.get(termKey)!.push(score);
      }

      const rows: any[] = [];
      for (const [key, { termScores, info, subject }] of groupMap.entries()) {
        const sorted = [...termScores.keys()].sort((a, b) => {
          const [ya, ta] = a.split('|'); const [yb, tb] = b.split('|');
          return (parseInt(ya) * 10 + (parseInt(ta.replace(/\D/g, '')) || 1)) - (parseInt(yb) * 10 + (parseInt(tb.replace(/\D/g, '')) || 1));
        });
        const termAvgs = sorted.map(tk => { const sc = termScores.get(tk)!; return sc.reduce((a, b) => a + b, 0) / sc.length; });
        const latest = termAvgs[termAvgs.length - 1];
        const prev = termAvgs.length >= 2 ? termAvgs[termAvgs.length - 2] : null;
        const trend = prev === null ? 'new' : latest > prev + 5 ? 'up' : latest < prev - 5 ? 'down' : 'stable';
        const passmark = getSubjectPassMark(subject);
        const capsLevel = tCapsLevel(latest);
        const deficit = passmark - latest;
        let prob = deficit > 0 ? 0.5 + (deficit / passmark) * 0.45 : Math.max(0, 0.35 - ((-deficit) / passmark) * 0.5);
        if (trend === 'down') prob = Math.min(0.99, prob + 0.1);
        if (trend === 'up') prob = Math.max(0, prob - 0.1);
        prob = Math.min(0.99, Math.max(0, prob));
        if (prob < 0.20) continue;
        const tier = prob >= 0.60 ? 'high' : prob >= 0.35 ? 'medium' : 'watch';
        const [sid] = key.split('|||');
        rows.push({ studentId: sid, studentName: info.name, grade: info.grade, section: info.section, subject, latest, prev, trend, passmark, prob, tier, capsLevel, interventions: tGetInterventions(capsLevel, subject, trend) });
      }
      rows.sort((a, b) => (['high','medium','watch'].indexOf(a.tier)) - (['high','medium','watch'].indexOf(b.tier)) || a.grade.localeCompare(b.grade) || a.studentName.localeCompare(b.studentName));
      setRiskData(rows);
    } catch (err: any) {
      console.error('Teacher at-risk fetch error:', err.message);
    } finally {
      setRiskLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'at-risk' && assignedClasses.length > 0) fetchAtRisk();
  }, [activeTab]);

  const fetchLearnerList = async () => {
    if (!llSubject) return;
    setLlLoading(true);
    try {
      const { data, error } = await supabase
        .from('results')
        .select('score, student_id, students(id, first_name, last_name, student_id, sections(name, grade_id, grades(name)))')
        .eq('school_id', school_id)
        .eq('subject_id', llSubject)
        .eq('term', llTerm)
        .eq('year', parseInt(llYear));
      if (error) throw error;
      // Aggregate: one entry per student using their AVERAGE score across all tasks
      const byStudent = new Map<string, { score: number; count: number; row: any }>();
      for (const row of (data || [])) {
        const sid = row.student_id;
        if (!sid) continue;
        const s = Number(row.score) || 0;
        if (byStudent.has(sid)) {
          const existing = byStudent.get(sid)!;
          existing.score += s;
          existing.count += 1;
        } else {
          byStudent.set(sid, { score: s, count: 1, row });
        }
      }
      const aggregated = Array.from(byStudent.values()).map(({ score, count, row }) => ({
        ...row,
        score: count > 0 ? score / count : 0,
      }));
      setLlResults(aggregated);
    } catch (err: any) {
      console.error('Learner list fetch error:', err.message);
      setLlResults([]);
    } finally {
      setLlLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'learner-list' && llSubject) {
      fetchLearnerList();
    }
  }, [activeTab, llSubject, llTerm, llYear]);

  const fetchSubjectRanking = async () => {
    if (!srSubject) return;
    setSrLoading(true);
    try {
      const { data, error } = await supabase
        .from('results')
        .select('score, student_id, students(id, first_name, last_name, student_id, sections(name, grade_id, grades(name)))')
        .eq('school_id', school_id)
        .eq('subject_id', srSubject)
        .eq('term', srTerm)
        .eq('year', parseInt(srYear));
      if (error) throw error;
      setSrResults(data || []);
    } catch (err: any) {
      console.error('Subject ranking fetch error:', err.message);
      setSrResults([]);
    } finally {
      setSrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subject-ranking' && srSubject) {
      fetchSubjectRanking();
    }
  }, [activeTab, srSubject, srTerm, srYear]);

  // Fetch sections when grade changes for Analysis of Results
  useEffect(() => {
    if (!arGrade) { setArSections([]); setArSection(''); return; }
    supabase.from('sections').select('*').eq('grade_id', arGrade).eq('school_id', school_id)
      .order('name').then(({ data }) => { setArSections(data || []); setArSection(''); });
  }, [arGrade]);

  const fetchAnalysisResults = async () => {
    if (!arSection || !arSubject) return;
    setArLoading(true);
    try {
      const { data: sectionStudents } = await supabase
        .from('students').select('id').eq('section_id', arSection).eq('school_id', school_id);
      const studentIds = (sectionStudents || []).map((s: any) => s.id);
      if (studentIds.length === 0) { setArResults([]); setArLoading(false); return; }
      const { data, error } = await supabase
        .from('results')
        .select('score, term, student_id')
        .in('student_id', studentIds)
        .eq('subject_id', arSubject)
        .eq('year', parseInt(arYear))
        .eq('school_id', school_id);
      if (error) throw error;
      setArResults(data || []);
    } catch (err: any) {
      console.error('Analysis fetch error:', err.message);
      setArResults([]);
    } finally {
      setArLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analysis-of-results' && arSection && arSubject) {
      fetchAnalysisResults();
    }
  }, [activeTab, arSection, arSubject, arYear]);

  const computeTermStats = (term: string) => {
    const termResults = arResults.filter((r: any) => r.term === term);
    const total = termResults.length;
    const counts = [0, 0, 0, 0, 0, 0, 0]; // index 0 = level 1 ... 6 = level 7
    termResults.forEach((r: any) => { const lvl = getLevel(Number(r.score)).level; counts[lvl - 1]++; });
    const l4Above = counts.slice(3).reduce((a: number, b: number) => a + b, 0);
    const l5Above = counts.slice(4).reduce((a: number, b: number) => a + b, 0);
    return { total, counts, l4Above, l5Above };
  };

  const handleArPrint = () => {
    const subjectName = subjects.find((s: any) => s.id === arSubject)?.name || '—';
    const gradeName = grades.find((g: any) => g.id === arGrade)?.name || '—';
    const sectionName = arSections.find((s: any) => s.id === arSection)?.name || '—';
    const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    const termData = TERMS.map(t => ({ term: t, ...computeTermStats(t) }));

    const termTableHtml = (td: ReturnType<typeof computeTermStats> & { term: string }) => {
      const rows = [1,2,3,4,5,6,7].map(lvl => {
        const count = td.counts[lvl - 1];
        const pct = td.total > 0 ? ((count / td.total) * 100).toFixed(1) : '0.0';
        return `<tr><td>${lvl}</td><td style="text-align:center">${count}</td><td style="text-align:center">${pct}%</td></tr>`;
      }).join('');
      const avgScore = td.total > 0
        ? (arResults.filter((r:any) => r.term === td.term).reduce((s:number,r:any) => s + Number(r.score), 0) / td.total).toFixed(1)
        : '0';
      return `
        <div class="term-block">
          <h3>${td.term}</h3>
          <table>
            <thead><tr><th>Level</th><th>No of Learners</th><th>%</th></tr></thead>
            <tbody>
              ${rows}
              <tr class="total-row"><td colspan="2"><strong>Total/Avg</strong></td><td style="text-align:center"><strong>${td.total > 0 ? avgScore + '%' : '—'}</strong></td></tr>
            </tbody>
          </table>
          <p class="summary-line">Learners level 4 and above: <span class="fill-line">${td.l4Above}</span></p>
          <p class="summary-line">Learners level 5 and above: <span class="fill-line">${td.l5Above}</span></p>
        </div>`;
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Analysis of Results</title>
    <style>
      body{font-family:Arial,sans-serif;padding:28px;font-size:11px;color:#111}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #1e293b}
      .header img{width:60px;height:60px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0}
      h1{font-size:20px;margin:0 0 2px;text-decoration:underline}
      h2{font-size:12px;font-weight:normal;color:#555;margin:0}
      .meta{display:flex;gap:24px;margin-bottom:16px;font-size:11px}
      .meta span{font-weight:bold;text-decoration:underline}
      .meta em{font-weight:normal;text-decoration:none}
      .terms-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:10px}
      .term-block{}
      .term-block h3{text-align:center;font-size:11px;font-weight:bold;margin:0 0 6px;text-decoration:underline}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th{border:1px solid #000;padding:4px 6px;text-align:left;font-size:9px;writing-mode:initial}
      td{border:1px solid #000;padding:4px 6px}
      .total-row td{background:#f0f0f0;font-weight:bold}
      .summary-line{font-size:10px;margin:5px 0 0;display:flex;align-items:center;gap:4px}
      .fill-line{border-bottom:1px solid #000;min-width:30px;display:inline-block;text-align:center;font-weight:bold}
      .footer{margin-top:18px;font-size:9px;color:#888;border-top:1px solid #e2e8f0;padding-top:8px}
    </style></head><body>
    <div class="header">
      ${schoolInfo?.logo ? `<img src="${schoolInfo.logo}" alt="Logo" />` : ''}
      <div>
        <h1>Analysis of Results</h1>
        ${schoolEmis ? `<p style="font-size:10px;color:#64748b;margin:2px 0">EMIS: ${schoolEmis}</p>` : ''}
        <h2>${schoolInfo?.name || 'School'}</h2>
      </div>
    </div>
    <div class="meta">
      <div><span>Subject: </span><em>${subjectName}</em></div>
      <div><span>Grade: </span><em>${gradeName}</em></div>
      <div><span>Class: </span><em>${sectionName}</em></div>
      <div><span>Year: </span><em>${arYear}</em></div>
    </div>
    <div class="terms-grid">
      ${termData.map(termTableHtml).join('')}
    </div>
    <div class="footer">Printed: ${new Date().toLocaleString()}</div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const fetchClassData = async () => {
    if (!selectedClass) return;

    try {
      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('section_id', selectedClass.id)
        .order('last_name')
        .order('first_name');
      setStudents(studentsData || []);

      // Fetch subjects for this class
      const { data: classSubjectsData } = await supabase
        .from('class_subjects')
        .select('*, subjects(*)')
        .eq('section_id', selectedClass.id);
      setSubjects(
        (classSubjectsData?.map(cs => cs.subjects) || [])
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
      );

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
    if (score >= 40) return 'text-blue-600'; // Blue
    return 'text-red-600'; // Red
  };

  const getMarkBg = (score: number) => {
    if (score >= 80) return 'bg-amber-100 text-amber-700';
    if (score >= 60) return 'bg-emerald-100 text-emerald-700';
    if (score >= 40) return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  };

  const getPassMark = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return getSubjectPassMark(subject?.name, subject?.pass_mark);
  };

  const handleLlPrint = () => {
    const subjectName = subjects.find((s: any) => s.id === llSubject)?.name || '—';
    const gradeName = llGrade ? grades.find((g: any) => g.id === llGrade)?.name : 'All Grades';
    const levelLabel = llLevel === 'all' ? 'All Levels'
      : llLevel === '7' ? 'L7 — Outstanding (80–100%)'
      : llLevel === '5-6' ? 'L5–6 — Substantial / Meritorious (60–79%)'
      : llLevel === '3-4' ? 'L3–4 — Moderate / Adequate (40–59%)'
      : llLevel === '1-2' ? 'L1–2 — Not Achieved / Elementary (0–39%)'
      : llLevel;
    const filteredResults = llResults
      .filter((r: any) => {
        if (llGrade && r.students?.sections?.grade_id !== llGrade) return false;
        if (llLevel !== 'all') {
          const lvl = getLevel(Number(r.score)).level;
          if (llLevel === '7' && lvl !== 7) return false;
          if (llLevel === '5-6' && (lvl < 5 || lvl > 6)) return false;
          if (llLevel === '3-4' && (lvl < 3 || lvl > 4)) return false;
          if (llLevel === '1-2' && lvl > 2) return false;
        }
        return true;
      })
      .sort((a: any, b: any) =>
        `${a.students?.last_name || ''} ${a.students?.first_name || ''}`.localeCompare(
          `${b.students?.last_name || ''} ${b.students?.first_name || ''}`
        )
      );
    const rows = filteredResults.map((r: any, idx: number) => {
      const score = Number(r.score);
      const lvl = getLevel(score).level;
      const passMark = getSubjectPassMark(subjectName, 40);
      const isPassed = score >= passMark;
      return `<tr>
        <td>${idx + 1}</td>
        <td>${r.students?.last_name || ''}, ${r.students?.first_name || ''}</td>
        <td>${r.students?.student_id || '—'}</td>
        <td>${r.students?.sections?.grades?.name || '—'}</td>
        <td>${r.students?.sections?.name || '—'}</td>
        <td style="text-align:center;font-weight:bold">${score}%</td>
        <td style="text-align:center;font-weight:bold">${lvl}</td>
        <td style="text-align:center;font-weight:bold;color:${isPassed ? '#15803d' : '#dc2626'}">${isPassed ? 'PASS' : 'FAIL'}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Learner Profiling</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;font-size:12px;color:#111}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}
      .header img{width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0}
      h1{font-size:22px;margin:0 0 2px}
      h2{font-size:14px;font-weight:normal;color:#555;margin:0}
      .meta{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:20px;font-size:11px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}
      .meta strong{color:#0f172a}
      table{width:100%;border-collapse:collapse;margin-top:4px}
      th{background:#1e293b;color:#fff;padding:9px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
      td{border-bottom:1px solid #e2e8f0;padding:8px 12px}
      tr:nth-child(even) td{background:#f8fafc}
      .footer{margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    </style></head><body>
    <div class="header">
      ${schoolInfo?.logo ? `<img src="${schoolInfo.logo}" alt="Logo" />` : ''}
      <div>
        <h1>${schoolInfo?.name || 'School'}</h1>
        ${schoolEmis ? `<p style="font-size:11px;color:#64748b;margin:0 0 2px 0">EMIS: ${schoolEmis}</p>` : ''}
        <h2>Learner Profiling</h2>
      </div>
    </div>
    <div class="meta">
      <span><strong>Subject:</strong> ${subjectName}</span>
      <span><strong>Grade:</strong> ${gradeName}</span>
      <span><strong>Level:</strong> ${levelLabel}</span>
      <span><strong>Term:</strong> ${llTerm}</span>
      <span><strong>Year:</strong> ${llYear}</span>
      <span><strong>Total:</strong> ${filteredResults.length} learner${filteredResults.length !== 1 ? 's' : ''}</span>
    </div>
    <table><thead><tr>
      <th>#</th><th>Learner Name</th><th>Student ID</th><th>Grade</th><th>Section</th><th>Score</th><th>Level</th><th>Status</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Printed: ${new Date().toLocaleString()}</div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleSrPrint = () => {
    const subjectName = subjects.find((s: any) => s.id === srSubject)?.name || '—';
    const gradeName = srGrade ? grades.find((g: any) => g.id === srGrade)?.name : 'All Grades';
    const ranked = srResults
      .filter((r: any) => !srGrade || r.students?.sections?.grade_id === srGrade)
      .sort((a: any, b: any) => Number(b.score) - Number(a.score));
    const avg = ranked.length > 0 ? ranked.reduce((s: number, r: any) => s + Number(r.score), 0) / ranked.length : 0;
    const passMark = getSubjectPassMark(subjectName, 40);
    const passCount = ranked.filter((r: any) => Number(r.score) >= passMark).length;
    const passRate = ranked.length > 0 ? ((passCount / ranked.length) * 100).toFixed(1) : '0';
    const medalColor = (rank: number) => rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#1e293b';
    const rows = ranked.map((r: any, idx: number) => {
      const score = Number(r.score);
      const lvl = getLevel(score).level;
      const isPassed = score >= passMark;
      const rank = idx + 1;
      return `<tr>
        <td style="text-align:center;font-weight:bold;color:${medalColor(rank)}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</td>
        <td>${r.students?.last_name || ''}, ${r.students?.first_name || ''}</td>
        <td>${r.students?.student_id || '—'}</td>
        <td>${r.students?.sections?.grades?.name || '—'}</td>
        <td>${r.students?.sections?.name || '—'}</td>
        <td style="text-align:center;font-weight:bold">${score}%</td>
        <td style="text-align:center;font-weight:bold">${lvl}</td>
        <td style="text-align:center;font-weight:bold;color:${isPassed ? '#15803d' : '#dc2626'}">${isPassed ? 'PASS' : 'FAIL'}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subject Ranking Report</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;font-size:12px;color:#111}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}
      .header img{width:64px;height:64px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0}
      h1{font-size:22px;margin:0 0 2px} h2{font-size:14px;font-weight:normal;color:#555;margin:0}
      .meta{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:16px;font-size:11px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}
      .meta strong{color:#0f172a}
      .stats-bar{display:flex;gap:12px;margin-bottom:16px}
      .stat-box{flex:1;padding:10px 14px;border-radius:6px;border:1px solid #e2e8f0;text-align:center}
      .stat-box .val{font-size:18px;font-weight:bold;color:#0f172a}
      .stat-box .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
      table{width:100%;border-collapse:collapse;margin-top:4px}
      th{background:#1e293b;color:#fff;padding:9px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
      td{border-bottom:1px solid #e2e8f0;padding:8px 12px}
      tr:nth-child(even) td{background:#f8fafc}
      .footer{margin-top:20px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    </style></head><body>
    <div class="header">
      ${schoolInfo?.logo ? `<img src="${schoolInfo.logo}" alt="Logo" />` : ''}
      <div>
        <h1>${schoolInfo?.name || 'School'}</h1>
        ${schoolEmis ? `<p style="font-size:11px;color:#64748b;margin:0 0 2px 0">EMIS: ${schoolEmis}</p>` : ''}
        <h2>Subject Ranking Report</h2>
      </div>
    </div>
    <div class="meta">
      <span><strong>Subject:</strong> ${subjectName}</span>
      <span><strong>Grade:</strong> ${gradeName}</span>
      <span><strong>Term:</strong> ${srTerm}</span>
      <span><strong>Year:</strong> ${srYear}</span>
      <span><strong>Total Learners:</strong> ${ranked.length}</span>
    </div>
    <div class="stats-bar">
      <div class="stat-box"><div class="val">${avg.toFixed(1)}%</div><div class="lbl">Average Score</div></div>
      <div class="stat-box"><div class="val">${ranked.length > 0 ? Number(ranked[0].score).toFixed(1) : '—'}%</div><div class="lbl">Highest Score</div></div>
      <div class="stat-box"><div class="val">${ranked.length > 0 ? Number(ranked[ranked.length-1].score).toFixed(1) : '—'}%</div><div class="lbl">Lowest Score</div></div>
      <div class="stat-box"><div class="val">${passRate}%</div><div class="lbl">Pass Rate</div></div>
      <div class="stat-box"><div class="val">${passMark}%</div><div class="lbl">Pass Mark</div></div>
    </div>
    <table><thead><tr>
      <th>Rank</th><th>Learner Name</th><th>Student ID</th><th>Grade</th><th>Section</th><th>Score</th><th>Level</th><th>Status</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Printed: ${new Date().toLocaleString()}</div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleLpGenerate = async () => {
    if (!lpSubject || !lpGrade) {
      setLpError('Please select a subject and grade before generating.');
      return;
    }
    setLpError('');
    setLpLoading(true);
    setLpPlan(null);
    try {
      const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
      const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;
      const plan = await generateCAPSLessonPlan(
        subjectName,
        gradeName,
        lpTerm,
        lpWeek,
        lpDuration,
        lpTopic.trim() || undefined
      );
      setLpPlan(plan);
    } catch (err: any) {
      setLpError(err.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setLpLoading(false);
    }
  };

  const handleLpGenerateTerm = async () => {
    if (!lpSubject || !lpGrade) {
      setLpError('Please select a subject and grade before generating.');
      return;
    }
    setLpError('');
    setLpLoading(true);
    setLpTermPlan(null);
    try {
      const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
      const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;
      const plan = await generateCAPSTermPlan(
        subjectName,
        gradeName,
        lpTerm,
        lpTotalWeeks,
        lpTopic.trim() || undefined
      );
      setLpTermPlan(plan);
    } catch (err: any) {
      setLpError(err.message || 'Failed to generate term plan. Please try again.');
    } finally {
      setLpLoading(false);
    }
  };

  const handleLpPrintTerm = () => {
    if (!lpTermPlan) return;
    const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
    const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;
    const overview = lpTermPlan.termOverview || {};
    const weeks: any[] = lpTermPlan.weeklyPlans || [];

    const weekRows = weeks.map((w: any) => `
      <tr>
        <td style="font-weight:bold;color:#1e293b;white-space:nowrap">Week ${w.week}</td>
        <td><strong>${w.topic}</strong><br/><span style="font-size:10px;color:#64748b">${w.subTopic || ''}</span></td>
        <td style="font-size:10px">${(w.objectives || []).join('<br/>')}</td>
        <td style="font-size:10px">${w.keyActivities || ''}</td>
        <td style="font-size:10px">${(w.resources || []).join(', ')}</td>
        <td style="font-size:10px">${w.assessment || ''}</td>
        <td style="font-size:10px">${w.homework || ''}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Term Plan — ${subjectName} ${gradeName} ${lpTerm}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1e293b;background:#fff;padding:24px}
      .header{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #059669}
      .header img{height:52px;width:52px;object-fit:contain}
      .header h1{font-size:18px;font-weight:bold;color:#059669;margin:0 0 2px}
      .header h2{font-size:13px;font-weight:600;color:#1e293b;margin:0}
      .overview{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
      .ov-box{padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}
      .ov-box .lbl{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:2px}
      .ov-box .val{font-size:12px;font-weight:bold;color:#1e293b}
      .fat-list{margin:0 0 16px;padding:0 0 0 16px;color:#334155}
      h3{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#059669;margin:16px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:10px}
      thead tr{background:#1e293b;color:#fff}
      th{padding:8px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em}
      td{border-bottom:1px solid #e2e8f0;padding:7px 10px;vertical-align:top}
      tr:nth-child(even) td{background:#f8fafc}
      .reflection{margin-top:20px;padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#fffbeb}
      .footer{margin-top:18px;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    </style></head><body>
    <div class="header">
      <div>
        <h1>${subjectName} — ${lpTerm} Term Plan</h1>
        <h2>${gradeName} &nbsp;·&nbsp; ${overview.totalWeeks || lpTotalWeeks} Weeks &nbsp;·&nbsp; CAPS Aligned</h2>
      </div>
    </div>

    <div class="overview">
      <div class="ov-box"><div class="lbl">Term Focus</div><div class="val">${overview.focus || '—'}</div></div>
      <div class="ov-box"><div class="lbl">Strand / Content Area</div><div class="val">${overview.strand || '—'}</div></div>
      <div class="ov-box"><div class="lbl">Teaching Approach</div><div class="val">${overview.teachingApproach || '—'}</div></div>
    </div>

    ${(overview.formalAssessmentTasks || []).length > 0 ? `
    <h3>Formal Assessment Tasks</h3>
    <ul class="fat-list">${(overview.formalAssessmentTasks || []).map((t: string) => `<li>${t}</li>`).join('')}</ul>` : ''}

    <h3>Weekly Plan</h3>
    <table>
      <thead><tr>
        <th>Week</th><th>Topic / Sub-Topic</th><th>Learning Objectives</th>
        <th>Key Activities</th><th>Resources</th><th>Assessment</th><th>Homework</th>
      </tr></thead>
      <tbody>${weekRows}</tbody>
    </table>

    <div class="reflection">
      <div style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#b45309;margin-bottom:6px">Teacher Reflection (complete at end of term)</div>
      <div style="color:#92400e;font-style:italic">${lpTermPlan.termReflection || 'What worked well? What would I change? Was CAPS pacing maintained?'}</div>
    </div>

    <div class="footer">Generated: ${new Date().toLocaleString()} &nbsp;·&nbsp; CAPS-Aligned Curriculum Plan &nbsp;·&nbsp; ${subjectName} ${gradeName}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleLpPrint = () => {
    if (!lpPlan) return;
    const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
    const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;

    const phasesHtml = (lpPlan.phases || []).map((phase: any) => `
      <div class="phase">
        <div class="phase-header">
          <span class="phase-name">${phase.name}</span>
          <span class="phase-duration">${phase.duration}</span>
        </div>
        <div class="phase-body">
          <div class="phase-col">
            <div class="col-label">Teacher Activities</div>
            <ul>${(phase.teacherActivities || []).map((a: string) => `<li>${a}</li>`).join('')}</ul>
          </div>
          <div class="phase-col">
            <div class="col-label">Learner Activities</div>
            <ul>${(phase.learnerActivities || []).map((a: string) => `<li>${a}</li>`).join('')}</ul>
          </div>
        </div>
      </div>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CAPS Lesson Plan</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;padding:28px;font-size:11px;color:#111;max-width:900px;margin:0 auto}
      .header{display:flex;align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:3px solid #059669}
      .header img{width:60px;height:60px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0}
      h1{font-size:20px;margin:0 0 2px;color:#059669}
      h2{font-size:12px;font-weight:normal;color:#555;margin:0}
      .caps-badge{display:inline-block;background:#059669;color:#fff;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:12px;letter-spacing:.08em;margin-top:4px}
      .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px}
      .info-item .label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;font-weight:bold}
      .info-item .value{font-size:12px;font-weight:bold;color:#111;margin-top:2px}
      .section{margin-bottom:14px}
      .section-title{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.07em;color:#059669;border-bottom:1px solid #d1fae5;padding-bottom:4px;margin-bottom:8px}
      .objectives li, .resources li{margin-bottom:3px}
      .phase{border:1px solid #e2e8f0;border-radius:6px;margin-bottom:8px;overflow:hidden}
      .phase-header{display:flex;justify-content:space-between;align-items:center;background:#1e293b;color:#fff;padding:6px 12px}
      .phase-name{font-size:11px;font-weight:bold}
      .phase-duration{font-size:10px;opacity:.75;background:rgba(255,255,255,.15);padding:1px 8px;border-radius:10px}
      .phase-body{display:grid;grid-template-columns:1fr 1fr;gap:0}
      .phase-col{padding:8px 12px}
      .phase-col:first-child{border-right:1px solid #e2e8f0}
      .col-label{font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:4px}
      .phase-col ul{margin:0;padding-left:14px}
      .phase-col li{margin-bottom:2px}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .assessment-box,.diff-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px}
      .tag{display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:9px;padding:2px 6px;border-radius:4px;margin:2px}
      .reflect-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;font-style:italic;color:#78350f}
      .footer{margin-top:20px;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;display:flex;justify-content:space-between}
    </style></head><body>
    <div class="header">
      ${schoolInfo?.logo ? `<img src="${schoolInfo.logo}" alt="Logo" />` : ''}
      <div>
        <h1>${schoolInfo?.name || 'School'}</h1>
        ${schoolEmis ? `<p style="font-size:10px;color:#64748b;margin:1px 0">EMIS: ${schoolEmis}</p>` : ''}
        <h2>CAPS Lesson Plan</h2>
        <span class="caps-badge">CAPS ALIGNED</span>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Subject</div><div class="value">${subjectName}</div></div>
      <div class="info-item"><div class="label">Grade</div><div class="value">${gradeName}</div></div>
      <div class="info-item"><div class="label">Term</div><div class="value">${lpTerm}</div></div>
      <div class="info-item"><div class="label">Week</div><div class="value">${lpWeek}</div></div>
      <div class="info-item"><div class="label">Duration</div><div class="value">${lpDuration} minutes</div></div>
      <div class="info-item"><div class="label">Date</div><div class="value">${new Date().toLocaleDateString('en-ZA')}</div></div>
    </div>
    <div class="section">
      <div class="section-title">CAPS Alignment</div>
      <p><strong>Topic:</strong> ${lpPlan.capsAlignment?.topic || '—'}</p>
      <p><strong>Sub-Topic:</strong> ${lpPlan.capsAlignment?.subTopic || '—'}</p>
      <p><strong>Strand / Content Area:</strong> ${lpPlan.capsAlignment?.strand || '—'}</p>
    </div>
    <div class="section">
      <div class="section-title">Prior Knowledge</div>
      <p>${lpPlan.priorKnowledge || '—'}</p>
    </div>
    <div class="section">
      <div class="section-title">Learning Objectives</div>
      <ul class="objectives">${(lpPlan.learningObjectives || []).map((o: string) => `<li>${o}</li>`).join('')}</ul>
    </div>
    <div class="section">
      <div class="section-title">Resources</div>
      <ul class="resources">${(lpPlan.resources || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
    </div>
    <div class="section">
      <div class="section-title">Lesson Phases</div>
      ${phasesHtml}
    </div>
    <div class="two-col">
      <div class="section">
        <div class="section-title">Assessment</div>
        <div class="assessment-box">
          <p><strong>Type:</strong> ${lpPlan.assessment?.type || 'Formative'}</p>
          <p><strong>Methods:</strong></p>
          <div>${(lpPlan.assessment?.methods || []).map((m: string) => `<span class="tag">${m}</span>`).join('')}</div>
          <p style="margin-top:8px"><strong>Success Criteria:</strong></p>
          <ul>${(lpPlan.assessment?.successCriteria || []).map((c: string) => `<li>${c}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Differentiation</div>
        <div class="diff-box">
          <p><strong>Support:</strong> ${lpPlan.differentiation?.support || '—'}</p>
          <p style="margin-top:6px"><strong>Extension:</strong> ${lpPlan.differentiation?.extension || '—'}</p>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">Homework</div>
      <p>${lpPlan.homework || 'No homework assigned.'}</p>
    </div>
    <div class="section">
      <div class="section-title">Teacher Reflection (Complete after lesson)</div>
      <div class="reflect-box">${lpPlan.teacherReflection || '—'}</div>
    </div>
    <div class="footer">
      <span>Prepared by: ${teacher?.first_name ? teacher.first_name + ' ' + (teacher.last_name || '') : 'Teacher'}</span>
      <span>Printed: ${new Date().toLocaleString('en-ZA')}</span>
    </div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
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

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky inset-y-0 left-0 top-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16 w-64'}`}>
        <div className={`border-b border-slate-100 flex items-center ${sidebarOpen ? 'p-5 gap-3' : 'p-3 justify-center'}`}>
          {schoolInfo?.logo ? (
            <img src={schoolInfo.logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl flex-shrink-0 border border-slate-100" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20 flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
          {sidebarOpen && (
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 leading-tight truncate">Teacher Portal</h2>
              <p className="text-xs text-slate-500 truncate">{schoolInfo?.name || 'Evergreen Academy'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{lastRefreshed.toLocaleTimeString()}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'results', icon: Trophy, label: 'Results' },
            { id: 'learner-list', icon: Users, label: 'Learner List' },
            { id: 'subject-ranking', icon: Trophy, label: 'Subject Ranking' },
            { id: 'analysis-of-results', icon: BarChart2, label: 'Analysis of Results' },
            { id: 'attendance', icon: ClipboardList, label: 'Attendance' },
            { id: 'timetable', icon: Calendar, label: 'Timetable' },
            { id: 'meetings', icon: Bell, label: 'Meetings' },
            { id: 'lesson-plan', icon: BookMarked, label: 'Lesson Plan' },
            { id: 'lesson-prep', icon: NotebookPen, label: 'Lesson Preparation' },
            { id: 'materials', icon: FileText, label: 'Materials' },
            { id: 'at-risk', icon: ShieldAlert, label: 'Learners at Risk' },
          ].map((item) => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => { setActiveTab(item.id as Tab); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${sidebarOpen ? '' : 'justify-center'} ${
                activeTab === item.id 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`border-t border-slate-100 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all ${sidebarOpen ? '' : 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">Welcome, {teacher?.first_name}</h1>
            <p className="text-slate-500 text-xs sm:text-sm hidden sm:block">Manage your classes and track student performance.</p>
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
            className="p-6 md:p-10"
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

                  {/* Class selector — shown for both views */}
                  {assignedClasses.length > 1 ? (
                    <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Class:</span>
                      <div className="flex flex-wrap gap-2">
                        {assignedClasses.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedClass(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selectedClass?.id === c.id
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                            }`}
                          >
                            {c.grades?.name} — {c.name}
                            {c.isClassTeacher && <span className="ml-1 opacity-60 text-[10px]">(CT)</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : selectedClass ? (
                    <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-primary-50 rounded-xl border border-primary-100 w-fit">
                      <span className="text-xs font-bold text-primary-700">Viewing: {selectedClass.grades?.name} — {selectedClass.name}</span>
                      {selectedClass.isClassTeacher && <span className="text-[10px] bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full font-bold">Class Teacher</span>}
                    </div>
                  ) : null}

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

                      {/* Mobile card list */}
                      <div className="md:hidden space-y-3">
                        {students.sort((a, b) => a.first_name.localeCompare(b.first_name)).map(student => {
                          const studentResults = results.filter(r =>
                            r.student_id === student.id &&
                            r.term === resultsSelectedTerm &&
                            String(r.year) === resultsSelectedYear
                          );
                          let total = 0; let count = 0; let failed = false;
                          const rows = subjects.map(subject => {
                            const result = studentResults.find(r => r.subject_id === subject.id);
                            const score = result ? Number(result.score) : null;
                            const passMark = getSubjectPassMark(subject.name, subject.pass_mark);
                            if (score !== null) { total += score; count++; if (score < passMark) failed = true; }
                            return { subject, score, isPass: score !== null ? score >= passMark : null };
                          });
                          const avg = count > 0 ? `${(total / count).toFixed(1)}%` : null;
                          return (
                            <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-slate-900">{student.first_name} {student.last_name}</p>
                                {avg && (
                                  <div className="text-right">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${!failed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{!failed ? 'Pass' : 'Fail'}</span>
                                    <p className={`text-base font-black mt-0.5 ${getMarkColor(total / count)}`}>{avg}</p>
                                  </div>
                                )}
                              </div>
                              <div className="divide-y divide-slate-50">
                                {rows.map(({ subject, score, isPass }) => (
                                  <div key={subject.id} className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-600">{subject.name}</span>
                                    {score !== null ? (
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${getMarkColor(score)}`}>{score}%</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPass ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{isPass ? 'P' : 'F'}</span>
                                      </div>
                                    ) : <span className="text-slate-300 text-sm">—</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-2xl">
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
                              const studentResults = results.filter(r =>
                                r.student_id === student.id &&
                                r.term === resultsSelectedTerm &&
                                String(r.year) === resultsSelectedYear
                              );
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
                    <h3 className="text-2xl font-bold text-slate-900">Meetings & Events</h3>
                    <p className="text-slate-500 mt-1">Stay updated with staff meetings and upcoming sports day events.</p>
                  </div>
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Bell className="w-8 h-8" />
                  </div>
                </div>

                {/* Sports Day Events */}
                {sportEvents.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Trophy className="w-5 h-5 text-amber-500" /> Upcoming Sports Day Events
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {sportEvents.map((s: any) => {
                        const dt = new Date(s.date + 'T00:00:00');
                        const isPast = dt < new Date(new Date().toDateString());
                        return (
                          <div key={s.id} className={`bg-white rounded-2xl border ${isPast ? 'border-slate-100 opacity-60' : 'border-amber-100'} shadow-sm overflow-hidden flex gap-0 flex-col`}>
                            {s.image_url && (
                              <img src={s.image_url} alt={s.name} className="w-full h-28 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                            )}
                            <div className="p-4 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span className="font-bold text-slate-900">{s.name}</span>
                                {isPast && <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">Past</span>}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
                                <Calendar className="w-3.5 h-3.5" />
                                {dt.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {s.description && <p className="text-xs text-slate-500 mt-1">{s.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

            {activeTab === 'learner-list' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Learner Profiling</h2>
                    <p className="text-sm text-slate-500 mt-1">Filter by grade, subject and achievement level then print.</p>
                  </div>
                  <button
                    onClick={handleLlPrint}
                    disabled={!llSubject || llLoading || llResults.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  {[
                    { label: 'Grade', content: (
                      <select value={llGrade} onChange={(e) => { setLlGrade(e.target.value); setLlSubject(''); }}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="">All Grades</option>
                        {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )},
                    { label: 'Subject', content: (
                      <select value={llSubject} onChange={(e) => setLlSubject(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="">Select Subject</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )},
                    { label: 'Level Group', content: (
                      <select value={llLevel} onChange={(e) => setLlLevel(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="all">All Levels</option>
                        <option value="7">L7 — Outstanding (80–100%)</option>
                        <option value="5-6">L5–6 — Substantial / Meritorious (60–79%)</option>
                        <option value="3-4">L3–4 — Moderate / Adequate (40–59%)</option>
                        <option value="1-2">L1–2 — Not Achieved / Elementary (0–39%)</option>
                      </select>
                    )},
                    { label: 'Term', content: (
                      <select value={llTerm} onChange={(e) => setLlTerm(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option>Term 1</option><option>Term 2</option><option>Term 3</option><option>Term 4</option>
                      </select>
                    )},
                    { label: 'Year', content: (
                      <select value={llYear} onChange={(e) => setLlYear(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                          <option key={y} value={y.toString()}>{y}</option>
                        ))}
                      </select>
                    )},
                  ].map(({ label, content }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                      {content}
                    </div>
                  ))}
                </div>

                {!llSubject ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Select a subject to load the learner list</p>
                  </div>
                ) : llLoading ? (
                  <div className="ll-no-print bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading learners…</p>
                  </div>
                ) : (() => {
                  const filteredLlResults = llResults
                    .filter((r: any) => {
                      if (llGrade && r.students?.sections?.grade_id !== llGrade) return false;
                      if (llLevel !== 'all') {
                        const lvl = getLevel(Number(r.score)).level;
                        if (llLevel === '7' && lvl !== 7) return false;
                        if (llLevel === '5-6' && (lvl < 5 || lvl > 6)) return false;
                        if (llLevel === '3-4' && (lvl < 3 || lvl > 4)) return false;
                        if (llLevel === '1-2' && lvl > 2) return false;
                      }
                      return true;
                    })
                    .sort((a: any, b: any) => {
                      const aName = `${a.students?.last_name || ''} ${a.students?.first_name || ''}`;
                      const bName = `${b.students?.last_name || ''} ${b.students?.first_name || ''}`;
                      return aName.localeCompare(bName);
                    });
                  return filteredLlResults.length === 0 ? (
                    <div className="ll-no-print bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">No learners found for the selected filters</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                      <div className="ll-no-print px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <p className="font-bold text-slate-900">{filteredLlResults.length} Learner{filteredLlResults.length !== 1 ? 's' : ''}</p>
                        <span className="text-xs text-slate-500">{subjects.find((s: any) => s.id === llSubject)?.name} · {llTerm} {llYear}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              {['#', 'Learner Name', 'Student ID', 'Grade', 'Section', 'Score', 'Level', 'Status'].map(h => (
                                <th key={h} className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredLlResults.map((r: any, idx: number) => {
                              const score = Number(r.score);
                              const levelInfo = getLevel(score);
                              const subjectName = subjects.find((s: any) => s.id === llSubject)?.name;
                              const passMark = getSubjectPassMark(subjectName, 40);
                              const isPassed = score >= passMark;
                              return (
                                <tr key={r.student_id || idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                  <td className="px-6 py-4 font-bold text-slate-900">
                                    {r.students?.last_name}, {r.students?.first_name}
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.students?.student_id || '—'}</td>
                                  <td className="px-6 py-4 text-slate-600">{r.students?.sections?.grades?.name || '—'}</td>
                                  <td className="px-6 py-4 text-slate-600">{r.students?.sections?.name || '—'}</td>
                                  <td className="px-6 py-4">
                                    <span className={`font-black ${getMarkColor(score)}`}>{score}%</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 ${getMarkBg(score)}`}>
                                      {levelInfo.level}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {isPassed ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="ll-print-show px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                        Total: {filteredLlResults.length} learner{filteredLlResults.length !== 1 ? 's' : ''} · Printed: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'subject-ranking' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Subject Ranking Report</h2>
                    <p className="text-sm text-slate-500 mt-1">Learners ranked by score for a subject. Includes average and summary stats.</p>
                  </div>
                  <button
                    onClick={handleSrPrint}
                    disabled={!srSubject || srLoading || srResults.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  {[
                    { label: 'Grade', content: (
                      <select value={srGrade} onChange={(e) => setSrGrade(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">All Grades</option>
                        {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )},
                    { label: 'Subject', content: (
                      <select value={srSubject} onChange={(e) => setSrSubject(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">Select Subject</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )},
                    { label: 'Term', content: (
                      <select value={srTerm} onChange={(e) => setSrTerm(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option>Term 1</option><option>Term 2</option><option>Term 3</option><option>Term 4</option>
                      </select>
                    )},
                    { label: 'Year', content: (
                      <select value={srYear} onChange={(e) => setSrYear(e.target.value)}
                        className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                          <option key={y} value={y.toString()}>{y}</option>
                        ))}
                      </select>
                    )},
                  ].map(({ label, content }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                      {content}
                    </div>
                  ))}
                </div>

                {!srSubject ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                    <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Select a subject to see the ranking</p>
                  </div>
                ) : srLoading ? (
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading ranking…</p>
                  </div>
                ) : (() => {
                  const ranked = srResults
                    .filter((r: any) => !srGrade || r.students?.sections?.grade_id === srGrade)
                    .sort((a: any, b: any) => Number(b.score) - Number(a.score));
                  const subjectName = subjects.find((s: any) => s.id === srSubject)?.name || '';
                  const passMark = getSubjectPassMark(subjectName, 40);
                  const avg = ranked.length > 0 ? ranked.reduce((s: number, r: any) => s + Number(r.score), 0) / ranked.length : 0;
                  const highest = ranked.length > 0 ? Number(ranked[0].score) : 0;
                  const lowest = ranked.length > 0 ? Number(ranked[ranked.length - 1].score) : 0;
                  const passCount = ranked.filter((r: any) => Number(r.score) >= passMark).length;
                  const passRate = ranked.length > 0 ? ((passCount / ranked.length) * 100).toFixed(1) : '0';
                  return ranked.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-16 text-center">
                      <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">No results found for the selected filters</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {[
                          { label: 'Average Score', value: `${avg.toFixed(1)}%`, color: 'text-blue-600' },
                          { label: 'Highest Score', value: `${highest.toFixed(1)}%`, color: 'text-amber-500' },
                          { label: 'Lowest Score', value: `${lowest.toFixed(1)}%`, color: 'text-red-500' },
                          { label: 'Pass Rate', value: `${passRate}%`, color: Number(passRate) >= 50 ? 'text-emerald-600' : 'text-red-500' },
                          { label: 'Pass Mark', value: `${passMark}%`, color: 'text-slate-700' },
                        ].map(stat => (
                          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-center">
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                          <p className="font-bold text-slate-900">{ranked.length} Learner{ranked.length !== 1 ? 's' : ''} Ranked</p>
                          <span className="text-xs text-slate-500">{subjectName} · {srTerm} {srYear}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                {['Rank', 'Learner Name', 'Student ID', 'Grade', 'Section', 'Score', 'Level', 'Status'].map(h => (
                                  <th key={h} className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {ranked.map((r: any, idx: number) => {
                                const score = Number(r.score);
                                const levelInfo = getLevel(score);
                                const isPassed = score >= passMark;
                                const rank = idx + 1;
                                const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                                return (
                                  <tr key={r.student_id || idx} className={`hover:bg-slate-50/50 transition-colors ${rank <= 3 ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                      {medalEmoji ? (
                                        <span className="text-xl">{medalEmoji}</span>
                                      ) : (
                                        <span className="font-mono text-sm text-slate-500">{rank}</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                      {r.students?.last_name || ''}, {r.students?.first_name || ''}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{r.students?.student_id || '—'}</td>
                                    <td className="px-6 py-4 text-slate-600">{r.students?.sections?.grades?.name || '—'}</td>
                                    <td className="px-6 py-4 text-slate-600">{r.students?.sections?.name || '—'}</td>
                                    <td className="px-6 py-4">
                                      <span className={`font-black ${getMarkColor(score)}`}>{score}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 ${getMarkBg(score)}`}>
                                        {levelInfo.level}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {isPassed ? 'Pass' : 'Fail'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ── LESSON PLAN TAB ── */}
            {activeTab === 'lesson-plan' && (
              <motion.div key="lesson-plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <BookMarked className="w-6 h-6 text-emerald-600" />
                      CAPS Lesson Plan Generator
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Generate structured, CAPS-aligned lesson plans using AI — for a single lesson or an entire term</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lpPlan && lpMode === 'weekly' && (
                      <button onClick={handleLpPrint} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm">
                        <Printer className="w-4 h-4" /> Print Lesson Plan
                      </button>
                    )}
                    {lpTermPlan && lpMode === 'term' && (
                      <button onClick={handleLpPrintTerm} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm">
                        <Printer className="w-4 h-4" /> Print Term Plan
                      </button>
                    )}
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  {([
                    { key: 'weekly', label: 'Single Lesson (Weekly)', icon: '📄' },
                    { key: 'term',   label: 'Full Term Plan', icon: '📅' },
                  ] as const).map(m => (
                    <button
                      key={m.key}
                      onClick={() => { setLpMode(m.key); setLpPlan(null); setLpTermPlan(null); setLpError(''); }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                        lpMode === m.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    {lpMode === 'weekly' ? 'Lesson Details' : 'Term Plan Details'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Subject</label>
                      <select value={lpSubject} onChange={e => setLpSubject(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">Select...</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Grade</label>
                      <select value={lpGrade} onChange={e => setLpGrade(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="">Select...</option>
                        {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Term</label>
                      <select value={lpTerm} onChange={e => setLpTerm(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        {['Term 1','Term 2','Term 3','Term 4'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {lpMode === 'weekly' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Week</label>
                          <input type="number" min={1} max={12} value={lpWeek} onChange={e => setLpWeek(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Duration (min)</label>
                          <input type="number" min={20} max={120} step={5} value={lpDuration} onChange={e => setLpDuration(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Weeks</label>
                        <input type="number" min={1} max={14} value={lpTotalWeeks} onChange={e => setLpTotalWeeks(Number(e.target.value))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {lpMode === 'weekly' ? 'Topic (optional)' : 'Term Focus (optional)'}
                      </label>
                      <input type="text" value={lpTopic} onChange={e => setLpTopic(e.target.value)}
                        placeholder={lpMode === 'weekly' ? 'e.g. Fractions' : 'e.g. Number Sense'}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>

                  {lpMode === 'term' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-4 text-xs text-emerald-800">
                      <strong>Full Term Plan</strong> — AI will generate a week-by-week CAPS-aligned overview covering all {lpTotalWeeks} weeks of {lpTerm}, including topics, objectives, activities, resources, assessment and homework for each week. This plan can be printed as a single document.
                    </div>
                  )}

                  {lpError && <p className="text-sm text-red-600 mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{lpError}</p>}

                  <button
                    onClick={lpMode === 'weekly' ? handleLpGenerate : handleLpGenerateTerm}
                    disabled={lpLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {lpLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {lpMode === 'weekly' ? 'Generating lesson plan…' : `Generating ${lpTotalWeeks}-week term plan…`}</>
                      : <><Sparkles className="w-4 h-4" /> {lpMode === 'weekly' ? 'Generate Lesson Plan' : `Generate Full Term Plan (${lpTotalWeeks} Weeks)`}</>
                    }
                  </button>
                  {!lpLoading && !lpPlan && !lpTermPlan && (
                    <p className="text-xs text-slate-400 mt-2">
                      {lpMode === 'weekly'
                        ? 'Leave Topic blank to let AI choose the appropriate CAPS topic for the selected term and week.'
                        : 'Leave Term Focus blank to use the official CAPS curriculum sequence for the selected subject and grade.'
                      }
                    </p>
                  )}
                </div>

                {/* Generated Plan — Weekly Mode */}
                {lpMode === 'weekly' && lpPlan && (() => {
                  const plan = lpPlan;
                  const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
                  const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;
                  const phaseColors = ['bg-sky-600','bg-violet-600','bg-amber-600','bg-emerald-600'];
                  return (
                    <div className="space-y-4">
                      {/* CAPS Alignment Banner */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BookMarked className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">CAPS Aligned</span>
                              <span className="text-xs text-slate-500">{subjectName} · {gradeName} · {lpTerm} · Week {lpWeek} · {lpDuration} min</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900">{plan.capsAlignment?.topic}</h3>
                            <p className="text-sm text-emerald-700 font-medium">{plan.capsAlignment?.subTopic}</p>
                            <p className="text-xs text-slate-500 mt-1">Strand: {plan.capsAlignment?.strand}</p>
                          </div>
                        </div>
                      </div>

                      {/* Prior Knowledge + Objectives */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Prior Knowledge</h4>
                          <p className="text-sm text-slate-700 leading-relaxed">{plan.priorKnowledge}</p>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Learning Objectives</h4>
                          <ul className="space-y-1.5">
                            {(plan.learningObjectives || []).map((obj: string, i: number) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-700">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Resources */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Resources Needed</h4>
                        <div className="flex flex-wrap gap-2">
                          {(plan.resources || []).map((r: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{r}</span>
                          ))}
                        </div>
                      </div>

                      {/* Lesson Phases */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Lesson Phases</h4>
                        <div className="space-y-3">
                          {(plan.phases || []).map((phase: any, i: number) => (
                            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                              <div className={`flex items-center justify-between px-4 py-2.5 ${phaseColors[i % phaseColors.length]}`}>
                                <span className="text-sm font-bold text-white">{phase.name}</span>
                                <span className="text-xs text-white/75 bg-white/10 px-2.5 py-0.5 rounded-full">{phase.duration}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                <div className="p-4">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teacher Activities</p>
                                  <ul className="space-y-1">
                                    {(phase.teacherActivities || []).map((a: string, j: number) => (
                                      <li key={j} className="flex gap-2 text-xs text-slate-600"><span className="text-slate-400 flex-shrink-0">›</span>{a}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-4 bg-slate-50/50">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Learner Activities</p>
                                  <ul className="space-y-1">
                                    {(phase.learnerActivities || []).map((a: string, j: number) => (
                                      <li key={j} className="flex gap-2 text-xs text-slate-600"><span className="text-slate-400 flex-shrink-0">›</span>{a}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assessment + Differentiation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Assessment</h4>
                          <p className="text-xs text-slate-500 mb-2">Type: <span className="font-bold text-slate-700">{plan.assessment?.type}</span></p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(plan.assessment?.methods || []).map((m: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">{m}</span>
                            ))}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Success Criteria</p>
                          <ul className="space-y-1">
                            {(plan.assessment?.successCriteria || []).map((c: string, i: number) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Differentiation</h4>
                          <div className="mb-3">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Support</p>
                            <p className="text-xs text-slate-600">{plan.differentiation?.support}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1">Extension</p>
                            <p className="text-xs text-slate-600">{plan.differentiation?.extension}</p>
                          </div>
                        </div>
                      </div>

                      {/* Homework + Reflection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Homework</h4>
                          <p className="text-sm text-slate-700">{plan.homework}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5">
                          <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Teacher Reflection (after lesson)</h4>
                          <p className="text-xs text-amber-800 italic leading-relaxed">{plan.teacherReflection}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Generated Plan — Full Term Mode */}
                {lpMode === 'term' && lpTermPlan && (() => {
                  const overview = lpTermPlan.termOverview || {};
                  const weeks: any[] = lpTermPlan.weeklyPlans || [];
                  const subjectName = subjects.find((s: any) => s.id === lpSubject)?.name || lpSubject;
                  const gradeName = grades.find((g: any) => g.id === lpGrade)?.name || lpGrade;
                  return (
                    <div className="space-y-4">
                      {/* Term overview banner */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BookMarked className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">CAPS Aligned — Full Term Plan</span>
                              <span className="text-xs text-slate-500">{subjectName} · {gradeName} · {lpTerm} · {overview.totalWeeks || lpTotalWeeks} Weeks</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900">{overview.focus || 'Term Overview'}</h3>
                            <p className="text-sm text-emerald-700 font-medium">Strand: {overview.strand}</p>
                            {overview.teachingApproach && <p className="text-xs text-slate-500 mt-1">{overview.teachingApproach}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Formal Assessment Tasks */}
                      {(overview.formalAssessmentTasks || []).length > 0 && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Formal Assessment Tasks</h4>
                          <div className="flex flex-wrap gap-2">
                            {(overview.formalAssessmentTasks || []).map((t: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" /> {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weekly overview table */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Week-by-Week Plan</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Week</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic / Sub-Topic</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Objectives</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Homework</th>
                              </tr>
                            </thead>
                            <tbody>
                              {weeks.map((w: any, i: number) => (
                                <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <td className="px-4 py-3 font-black text-slate-700 whitespace-nowrap">
                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full font-black text-xs">{w.week}</span>
                                  </td>
                                  <td className="px-4 py-3 max-w-[180px]">
                                    <p className="font-bold text-slate-800">{w.topic}</p>
                                    <p className="text-slate-400 mt-0.5">{w.subTopic}</p>
                                  </td>
                                  <td className="px-4 py-3 max-w-[200px]">
                                    <ul className="space-y-0.5">
                                      {(w.objectives || []).map((obj: string, j: number) => (
                                        <li key={j} className="flex gap-1 text-slate-600"><span className="text-slate-300 flex-shrink-0">›</span>{obj}</li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td className="px-4 py-3 max-w-[180px] text-slate-600">{w.keyActivities}</td>
                                  <td className="px-4 py-3 max-w-[140px]">
                                    <ul className="space-y-0.5">
                                      {(w.resources || []).map((r: string, j: number) => (
                                        <li key={j} className="text-slate-500">{r}</li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td className="px-4 py-3 max-w-[140px]">
                                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium">{w.assessment}</span>
                                  </td>
                                  <td className="px-4 py-3 max-w-[140px] text-slate-500 italic">{w.homework}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Teacher Reflection */}
                      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-5">
                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Teacher Reflection (complete at end of term)</h4>
                        <p className="text-xs text-amber-800 italic leading-relaxed">{lpTermPlan.termReflection || 'What worked well? What would I change? Was CAPS pacing maintained?'}</p>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
          {/* ── ANALYSIS OF RESULTS TAB ── */}
          {activeTab === 'analysis-of-results' && (
            <motion.div key="analysis-of-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-primary-600" />
                    Analysis of Results
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Level distribution per term for a class and subject</p>
                </div>
                {arResults.length > 0 && (
                  <button
                    onClick={handleArPrint}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary-500" /> Select Class &amp; Subject
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Grade</label>
                    <select
                      value={arGrade}
                      onChange={e => { setArGrade(e.target.value); setArResults([]); }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select grade</option>
                      {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Section</label>
                    <select
                      value={arSection}
                      onChange={e => { setArSection(e.target.value); setArResults([]); }}
                      disabled={!arGrade}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
                    >
                      <option value="">Select section</option>
                      {arSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Subject</label>
                    <select
                      value={arSubject}
                      onChange={e => { setArSubject(e.target.value); setArResults([]); }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Year</label>
                    <select
                      value={arYear}
                      onChange={e => { setArYear(e.target.value); setArResults([]); }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                {arGrade && arSection && arSubject && (
                  <div className="mt-4">
                    <button
                      onClick={fetchAnalysisResults}
                      disabled={arLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {arLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                      {arLoading ? 'Loading…' : 'Load Results'}
                    </button>
                  </div>
                )}
              </div>

              {/* Prompt if not ready */}
              {(!arGrade || !arSection || !arSubject) && (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-10 text-center text-slate-400">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Select a grade, section and subject to view the analysis</p>
                </div>
              )}

              {/* Loading */}
              {arLoading && (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mr-3" /> Loading results…
                </div>
              )}

              {/* Results grid */}
              {!arLoading && arResults.length > 0 && (() => {
                const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
                const LEVEL_COLORS = [
                  'bg-red-100 text-red-700',      // L1
                  'bg-red-50 text-red-600',        // L2
                  'bg-blue-50 text-blue-600',      // L3
                  'bg-blue-100 text-blue-700',     // L4
                  'bg-emerald-50 text-emerald-600',// L5
                  'bg-emerald-100 text-emerald-700',// L6
                  'bg-amber-100 text-amber-700',   // L7
                ];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TERMS.map(term => {
                      const td = computeTermStats(term);
                      const avgScore = td.total > 0
                        ? (arResults.filter((r: any) => r.term === term).reduce((s: number, r: any) => s + Number(r.score), 0) / td.total).toFixed(1)
                        : null;
                      return (
                        <div key={term} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-slate-800 text-white text-center py-2 text-sm font-bold tracking-wide">{term}</div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100 text-xs text-slate-600">
                                <th className="py-2 px-3 text-left font-bold">Level</th>
                                <th className="py-2 px-3 text-center font-bold">Learners</th>
                                <th className="py-2 px-3 text-center font-bold">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[1,2,3,4,5,6,7].map(lvl => {
                                const count = td.counts[lvl - 1];
                                const pct = td.total > 0 ? ((count / td.total) * 100).toFixed(1) : '0.0';
                                return (
                                  <tr key={lvl} className="border-t border-slate-100">
                                    <td className="py-1.5 px-3">
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_COLORS[lvl-1]}`}>L{lvl}</span>
                                    </td>
                                    <td className="py-1.5 px-3 text-center font-semibold text-slate-700">{count}</td>
                                    <td className="py-1.5 px-3 text-center text-slate-500">{pct}%</td>
                                  </tr>
                                );
                              })}
                              <tr className="border-t-2 border-slate-200 bg-slate-50">
                                <td className="py-2 px-3 text-xs font-bold text-slate-600" colSpan={2}>Total / Avg</td>
                                <td className="py-2 px-3 text-center text-xs font-bold text-slate-700">{avgScore ? `${avgScore}%` : '—'}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="p-3 space-y-1 border-t border-slate-100 bg-slate-50">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Level 4 and above:</span>
                              <span className="font-bold text-blue-700">{td.l4Above} <span className="text-slate-400">({td.total > 0 ? ((td.l4Above/td.total)*100).toFixed(0) : 0}%)</span></span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Level 5 and above:</span>
                              <span className="font-bold text-emerald-700">{td.l5Above} <span className="text-slate-400">({td.total > 0 ? ((td.l5Above/td.total)*100).toFixed(0) : 0}%)</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* No results */}
              {!arLoading && arGrade && arSection && arSubject && arResults.length === 0 && (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-10 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No results found for the selected combination</p>
                  <p className="text-sm mt-1">Results may not have been captured yet for this class and subject</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Lesson Preparation ── */}
          {activeTab === 'lesson-prep' && (
            <motion.div key="lesson-prep" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Lesson Preparation</h2>
                  <p className="text-sm text-slate-500 mt-1">Prepare for an upcoming lesson — checklist, resources, and notes. Saves automatically per lesson.</p>
                </div>
                <div className="flex items-center gap-3">
                  {prepSavedAt && (
                    <span className="text-xs text-emerald-600 font-medium">Saved at {prepSavedAt}</span>
                  )}
                  <button
                    onClick={savePrep}
                    disabled={!prepSubject || !prepGrade}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={handlePrepPrint}
                    disabled={!prepSubject || !prepGrade}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" /> Print Sheet
                  </button>
                </div>
              </div>

              {/* Selectors */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <NotebookPen className="w-4 h-4 text-blue-500" /> Lesson Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Subject</label>
                    <select
                      value={prepSubject}
                      onChange={e => { setPrepSubject(e.target.value); loadPrep(e.target.value, prepGrade, prepDate); }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Grade</label>
                    <select
                      value={prepGrade}
                      onChange={e => { setPrepGrade(e.target.value); loadPrep(prepSubject, e.target.value, prepDate); }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select grade</option>
                      {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
                    <input
                      type="date"
                      value={prepDate}
                      onChange={e => { setPrepDate(e.target.value); loadPrep(prepSubject, prepGrade, e.target.value); }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Period / Time</label>
                    <input
                      type="text"
                      placeholder="e.g. Period 2 / 09:00"
                      value={prepPeriod}
                      onChange={e => setPrepPeriod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Readiness progress bar */}
              {(() => {
                const done = prepChecklist.filter(i => i.checked).length;
                const total = prepChecklist.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const color = pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-400';
                const label = pct === 100 ? 'Ready to teach!' : pct >= 60 ? 'Almost ready' : pct >= 30 ? 'In progress' : 'Not started';
                return (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-blue-500" /> Readiness
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${pct === 100 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {done}/{total} · {label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}

              <div className="grid md:grid-cols-2 gap-6">

                {/* Checklist */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-500" /> Preparation Checklist
                  </h3>
                  <div className="space-y-2">
                    {prepChecklist.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setPrepChecklist(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all border ${item.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {item.checked
                          ? <CheckSquare className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          : <Square className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        }
                        <span className={`text-sm font-medium leading-snug ${item.checked ? 'text-emerald-800 line-through decoration-emerald-400' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Add custom checklist item */}
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Add a custom preparation item…"
                      value={prepNewItem}
                      onChange={e => setPrepNewItem(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && prepNewItem.trim()) {
                          setPrepChecklist(prev => [...prev, { id: `custom_${Date.now()}`, label: prepNewItem.trim(), checked: false }]);
                          setPrepNewItem('');
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!prepNewItem.trim()) return;
                        setPrepChecklist(prev => [...prev, { id: `custom_${Date.now()}`, label: prepNewItem.trim(), checked: false }]);
                        setPrepNewItem('');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right column: Notes + Resources */}
                <div className="flex flex-col gap-6">

                  {/* Teacher Notes */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-blue-500" /> Teacher Preparation Notes
                    </h3>
                    <textarea
                      rows={7}
                      placeholder="Write your personal preparation notes here — key points to remember, common misconceptions to address, timing reminders, seating notes, etc."
                      value={prepNotes}
                      onChange={e => setPrepNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Resources Needed */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" /> Resources Needed
                    </h3>
                    {prepResources.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No resources added yet. Add the specific materials you need to gather.</p>
                    )}
                    <ul className="space-y-2">
                      {prepResources.map((r, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-sm text-slate-700">{r}</span>
                          <button onClick={() => setPrepResources(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Fraction strips, Grade 4 textbook p.45…"
                        value={prepNewResource}
                        onChange={e => setPrepNewResource(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && prepNewResource.trim()) {
                            setPrepResources(prev => [...prev, prepNewResource.trim()]);
                            setPrepNewResource('');
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (!prepNewResource.trim()) return;
                          setPrepResources(prev => [...prev, prepNewResource.trim()]);
                          setPrepNewResource('');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Empty state prompt */}
              {!prepSubject && !prepGrade && (
                <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-8 text-center">
                  <NotebookPen className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                  <p className="font-bold text-blue-700">Select a subject and grade above to begin your lesson preparation.</p>
                  <p className="text-sm text-blue-500 mt-1">Your preparation notes and checklist are saved automatically per subject, grade, and date.</p>
                </div>
              )}

            </motion.div>
          )}

          {/* ── Learners at Risk (Teacher) ── */}
          {activeTab === 'at-risk' && (() => {
            const TIER_CFG = {
              high:   { label: 'High Risk',  bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
              medium: { label: 'Medium Risk', bg: 'bg-amber-100', text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500'  },
              watch:  { label: 'Watch',       bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-400' },
            } as const;
            const allGrades = [...grades].sort((a: any, b: any) => {
              const n = (g: string) => g.toLowerCase().replace(/^grade\s*/, '');
              const ai = n(a.name), bi = n(b.name);
              if (ai === 'r') return -1; if (bi === 'r') return 1;
              return parseInt(ai) - parseInt(bi);
            });
            const allSubjects = [...subjects].sort((a: any, b: any) => a.name.localeCompare(b.name));
            const filtered = riskData.filter(r =>
              (riskFilter === 'all' || r.tier === riskFilter) &&
              (!riskGrade || r.grade === riskGrade) &&
              (!riskSubject || r.subject.toLowerCase() === riskSubject.toLowerCase())
            );
            const highCount  = riskData.filter(r => r.tier === 'high').length;
            const medCount   = riskData.filter(r => r.tier === 'medium').length;
            const watchCount = riskData.filter(r => r.tier === 'watch').length;
            return (
              <motion.div key="at-risk" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-red-500" /> Learners at Risk
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      Learners from your classes flagged as being at risk of failing, based on historical results. Risk probability is calculated from current average vs pass mark and score trend across terms. Click any row to view recommended intervention strategies.
                    </p>
                  </div>
                  <button onClick={fetchAtRisk} disabled={riskLoading} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-sm whitespace-nowrap disabled:opacity-60">
                    {riskLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Refresh
                  </button>
                </div>

                {/* Summary stat cards */}
                {!riskLoading && riskData.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {(['high','medium','watch'] as const).map(tier => {
                      const count = tier === 'high' ? highCount : tier === 'medium' ? medCount : watchCount;
                      const cfg = TIER_CFG[tier];
                      return (
                        <button key={tier} onClick={() => setRiskFilter(riskFilter === tier ? 'all' : tier)}
                          className={`rounded-2xl border-2 p-4 text-left transition-all ${riskFilter === tier ? `${cfg.bg} ${cfg.border}` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                            <span className={`text-xs font-bold uppercase tracking-wide ${riskFilter === tier ? cfg.text : 'text-slate-500'}`}>{cfg.label}</span>
                          </div>
                          <p className={`text-3xl font-black ${riskFilter === tier ? cfg.text : 'text-slate-800'}`}>{count}</p>
                          <p className="text-xs text-slate-400 mt-0.5">learner–subject pairs</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Grade</label>
                      <select value={riskGrade} onChange={e => setRiskGrade(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none">
                        <option value="">All Grades</option>
                        {allGrades.map((g: any) => <option key={g.name} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Subject</label>
                      <select value={riskSubject} onChange={e => setRiskSubject(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none">
                        <option value="">All Subjects</option>
                        {allSubjects.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Risk Level</label>
                      <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none">
                        <option value="all">All Levels</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="watch">Watch</option>
                      </select>
                    </div>
                    {!riskLoading && filtered.length > 0 && (
                      <div className="ml-auto text-xs text-slate-400 self-end pb-2.5">{filtered.length} learner–subject pairs</div>
                    )}
                  </div>
                </div>

                {/* Trend legend */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span><span className="font-bold text-green-600">↑ Improving</span> — score rose &gt;5% from last term</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-bold text-red-600">↓ Declining</span> — score fell &gt;5% from last term</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-bold text-slate-600">→ Stable</span> — within ±5% of previous term</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-bold text-blue-600">• New</span> — first term on record</span>
                </div>

                {/* Content */}
                {riskLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    <span className="font-medium">Analysing learner results…</span>
                  </div>
                ) : riskData.length === 0 ? (
                  <div className="bg-green-50 rounded-2xl border border-green-200 p-10 text-center">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
                    <p className="font-bold text-green-700">No learners flagged as at risk.</p>
                    <p className="text-sm text-green-600 mt-1">All learners with recorded results are currently performing above the risk threshold.</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">No results match the selected filters.</div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map(row => {
                      const key = `${row.studentId}-${row.subject}`;
                      const isOpen = riskExpanded === key;
                      const cfg = TIER_CFG[row.tier as keyof typeof TIER_CFG];
                      const trendIcon = row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : row.trend === 'new' ? '•' : '→';
                      const trendColor = row.trend === 'up' ? 'text-green-600' : row.trend === 'down' ? 'text-red-600' : row.trend === 'new' ? 'text-blue-600' : 'text-slate-500';
                      return (
                        <div key={key} className={`rounded-2xl border-2 overflow-hidden transition-all ${isOpen ? cfg.border : 'border-slate-200 hover:border-slate-300'} bg-white shadow-sm`}>
                          <button className="w-full text-left px-5 py-4" onClick={() => setRiskExpanded(isOpen ? null : key)}>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}>
                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {cfg.label}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">{row.studentName}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{row.grade}{row.section ? ` · ${row.section}` : ''}</span>
                              <span className="text-xs font-medium text-slate-700 capitalize">{row.subject}</span>
                              <div className="ml-auto flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <div className="text-xs text-slate-400">Average</div>
                                  <div className="font-bold text-slate-800 text-sm">{row.latest.toFixed(1)}%</div>
                                </div>
                                <div className="text-right hidden sm:block">
                                  <div className="text-xs text-slate-400">Pass Mark</div>
                                  <div className="font-bold text-slate-600 text-sm">{row.passmark}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Risk Prob.</div>
                                  <div className={`font-black text-sm ${row.tier === 'high' ? 'text-red-600' : row.tier === 'medium' ? 'text-amber-600' : 'text-yellow-600'}`}>{(row.prob * 100).toFixed(0)}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Trend</div>
                                  <div className={`font-black text-base ${trendColor}`}>{trendIcon}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''} bg-slate-100`}>
                                  <ChevronDown className="w-3 h-3 text-slate-500" />
                                </div>
                              </div>
                            </div>
                          </button>
                          {isOpen && (
                            <div className={`border-t-2 ${cfg.border} px-5 py-4`}>
                              <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${cfg.text}`}>Recommended Intervention Strategies</div>
                              <ul className="space-y-2">
                                {row.interventions.map((iv: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                    <span className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${row.tier === 'high' ? 'bg-red-500' : row.tier === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'}`}>{i + 1}</span>
                                    {iv}
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                                <span>CAPS Level: <strong className="text-slate-700">L{row.capsLevel}</strong></span>
                                <span>Current Avg: <strong className="text-slate-700">{row.latest.toFixed(1)}%</strong></span>
                                {row.prev !== null && <span>Previous Term: <strong className="text-slate-700">{row.prev.toFixed(1)}%</strong></span>}
                                <span>Pass Mark: <strong className="text-slate-700">{row.passmark}%</strong></span>
                                <span>Deficit: <strong className={row.passmark > row.latest ? 'text-red-600' : 'text-green-600'}>{(row.passmark - row.latest).toFixed(1)}%</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}

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

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
  Users,
  Trophy,
  X,
  Brain,
  ClipboardList,
  CheckCircle,
  Lock,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student, Result, Subject } from '../types';
import * as XLSX from 'xlsx';
import { AnimatePresence } from 'motion/react';

const PASS_MARKS: Record<string, number> = {
  'english': 40,
  'maths': 40,
  'life skills': 40,
  'xitsonga': 50,
  'nst': 40,
  'social science': 40,
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

type Tab = 'overview' | 'results' | 'timetable' | 'tasks' | 'materials';

const PuzzlePlayer = ({ image, onComplete }: { image: string, onComplete: () => void }) => {
  const [pieces, setPieces] = useState<number[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const initializePuzzle = () => {
    // Start with solved state
    let newPieces = Array.from({ length: 9 }, (_, i) => i);
    
    // Perform random valid moves to ensure solvability
    let emptyIndex = 8;
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(emptyIndex / 3);
      const col = emptyIndex % 3;
      const neighbors = [];
      
      if (row > 0) neighbors.push(emptyIndex - 3);
      if (row < 2) neighbors.push(emptyIndex + 3);
      if (col > 0) neighbors.push(emptyIndex - 1);
      if (col < 2) neighbors.push(emptyIndex + 1);
      
      const moveIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
      [newPieces[emptyIndex], newPieces[moveIndex]] = [newPieces[moveIndex], newPieces[emptyIndex]];
      emptyIndex = moveIndex;
    }
    
    setPieces(newPieces);
    setIsSolved(false);
  };

  useEffect(() => {
    initializePuzzle();
  }, [image]);

  const handleMove = (index: number) => {
    if (isSolved) return;
    const emptyIndex = pieces.indexOf(8);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newPieces = [...pieces];
      [newPieces[index], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[index]];
      setPieces(newPieces);

      if (newPieces.every((p, i) => p === i)) {
        setIsSolved(true);
        onComplete();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <ImageIcon className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button 
          onClick={initializePuzzle}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          Reset Puzzle
        </button>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2 bg-slate-100 rounded-2xl border border-slate-200">
              <img src={image} alt="Preview" className="w-full h-auto rounded-xl max-h-48 object-contain" referrerPolicy="no-referrer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-1.5 bg-slate-200 p-2 rounded-[2rem] w-full max-w-[320px] mx-auto aspect-square overflow-hidden shadow-inner border-4 border-white">
        {pieces.map((piece, i) => (
          <motion.div
            key={i}
            layout
            onClick={() => handleMove(i)}
            className={`relative cursor-pointer transition-all duration-200 overflow-hidden rounded-2xl shadow-sm ${piece === 8 ? 'bg-slate-100/50' : 'bg-white'}`}
          >
            {piece !== 8 && (
              <div
                className="absolute w-[300%] h-[300%]"
                style={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%`,
                }}
              />
            )}
            {isSolved && piece !== 8 && (
              <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl" />
            )}
          </motion.div>
        ))}
      </div>

      {isSolved && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-emerald-50 text-emerald-700 rounded-[2rem] border border-emerald-100 text-center font-bold flex flex-col items-center justify-center gap-3 shadow-lg shadow-emerald-600/10"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg">Puzzle Solved! Success!</p>
            <p className="text-sm font-normal text-emerald-600/80">You've successfully completed the challenge.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const QuizPlayer = ({ questions, onComplete }: { questions: any[], onComplete: (score: number) => void }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) {
        score += q.points || 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setShowResults(true);
    onComplete(calculateScore());
  };

  return (
    <div className="space-y-8">
      {questions.map((q, i) => (
        <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-bold text-slate-900">{i + 1}. {q.question}</p>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">
              {q.points || 1} Points
            </span>
          </div>
          
          {q.image && (
            <div className="rounded-2xl overflow-hidden border border-slate-100">
              <img src={q.image} alt="Question" className="w-full h-auto max-h-64 object-contain bg-slate-50" referrerPolicy="no-referrer" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt: string, j: number) => {
              const isSelected = answers[i] === opt;
              const isCorrect = q.answer === opt;
              const showCorrect = showResults && isCorrect;
              const showWrong = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={j}
                  disabled={showResults}
                  onClick={() => setAnswers({ ...answers, [i]: opt })}
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-left ${
                    showCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    showWrong ? 'bg-red-50 border-red-200 text-red-700' :
                    isSelected ? 'bg-primary-50 border-primary-200 text-primary-700' :
                    'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-[10px] ${
                    showCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-600' :
                    showWrong ? 'bg-red-100 border-red-300 text-red-600' :
                    isSelected ? 'bg-primary-100 border-primary-300 text-primary-600' :
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + j)}
                  </div>
                  <span className="text-sm font-medium">{opt}</span>
                  {showCorrect && <CheckCircle className="w-4 h-4 ml-auto" />}
                  {showWrong && <X className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!showResults ? (
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">Results</p>
          <p className="text-3xl font-bold text-emerald-700">Score: {calculateScore()} / {questions.reduce((acc, q) => acc + (q.points || 1), 0)}</p>
          <p className="text-sm text-emerald-600 mt-2">Well done! Success note: You have completed the quiz.</p>
        </div>
      )}
    </div>
  );
};

export default function StudentDashboard() {
  const school_id_raw = localStorage.getItem('school_id');
  const school_id = (school_id_raw && school_id_raw !== 'undefined' && !isNaN(Number(school_id_raw))) ? Number(school_id_raw) : 1;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Evergreen Academy',
    logo: '',
    primary_color: '#059669',
    secondary_color: '#10b981'
  });
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [resultPublications, setResultPublications] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
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
        .select('*, sections(id, name, grade_id, grades(name))')
        .eq('id', studentId)
        .single();

      if (studentData) {
        setStudent(studentData);
        
        // Fetch school info
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('school_id', school_id)
          .single();
        
        if (schoolData) {
          setSchoolInfo(schoolData);
        }
        
        // Fetch results for this student
        const { data: resultsData } = await supabase
          .from('results')
          .select('*, subjects(name, code, pass_mark), tasks(name, total_marks)')
          .eq('student_id', studentData.id)
          .eq('school_id', school_id);
        
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

        // Fetch tasks for this student's section
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*, subjects(*)')
          .eq('section_id', studentData.section_id)
          .order('created_at', { ascending: false });
        
        if (tasksData) setTasks(tasksData);

        // Fetch learning materials for student's grade
        const { data: materialsData } = await supabase
          .from('learning_materials')
          .select('*, teachers(first_name, last_name)')
          .eq('grade_id', studentData.sections.grade_id)
          .eq('school_id', school_id)
          .order('created_at', { ascending: false });
        
        if (materialsData) setMaterials(materialsData);

        // Fetch result publications
        const { data: resPubsData } = await supabase
          .from('result_publications')
          .select('*')
          .eq('school_id', school_id);
        
        if (resPubsData) setResultPublications(resPubsData);
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

    const reportData = filteredResults.map(r => {
      const subjectName = r.subjects?.name || '';
      const passMark = getSubjectPassMark(subjectName, r.subjects?.pass_mark);
      
      return {
        'Subject': subjectName,
        'Task': r.tasks?.name || 'Final Mark',
        'Score (%)': r.score,
        'Pass Mark (%)': passMark,
        'Level': getLevel(Number(r.score)).level,
        'Status': Number(r.score) >= passMark ? 'Pass' : 'Fail'
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedTerm} ${selectedYear}`);
    XLSX.writeFile(wb, `${student.first_name}_${student.last_name}_${selectedTerm}_${selectedYear}_Report.xlsx`);
  };

  const getLevel = (score: number) => {
    if (score >= 80) return { level: 7, label: 'Outstanding', description: 'Exceptional mastery of subject matter' };
    if (score >= 70) return { level: 6, label: 'Meritorious', description: 'Very good understanding and application' };
    if (score >= 60) return { level: 5, label: 'Substantial', description: 'Good understanding of core concepts' };
    if (score >= 50) return { level: 4, label: 'Adequate', description: 'Satisfactory level of achievement' };
    if (score >= 40) return { level: 3, label: 'Moderate', description: 'Basic understanding, improvement needed' };
    if (score >= 30) return { level: 2, label: 'Elementary', description: 'Limited understanding, focus required' };
    return { level: 1, label: 'Not Achieved', description: 'Significant support and revision needed' };
  };

  const getRecommendations = (score: number, subject: string, passMark: number = 40) => {
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

  const downloadMaterial = (material: any) => {
    const link = document.createElement('a');
    link.href = material.file_content;
    link.download = `${material.name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');

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

  const filteredResults = results.filter(r => 
    r.term === selectedTerm && 
    r.year.toString() === selectedYear &&
    (selectedSubjectId === 'all' || r.subject_id === selectedSubjectId)
  );

  const averageScore = filteredResults.length > 0 
    ? (filteredResults.reduce((acc, curr) => acc + Number(curr.score), 0) / filteredResults.length).toFixed(1)
    : 'N/A';
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-primary-600">
            {schoolInfo.logo ? (
              <img src={schoolInfo.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" referrerPolicy="no-referrer" />
            ) : (
              <GraduationCap className="w-8 h-8" />
            )}
            <span className="font-bold text-xl tracking-tight text-slate-900">{schoolInfo.name}</span>
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
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'tasks' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Tasks & Quizzes
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resources</div>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'materials' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Download className="w-5 h-5" />
            Learning Materials
          </button>
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
                            <p className={`text-lg font-bold ${result.score >= getSubjectPassMark(result.subjects?.name, result.subjects?.pass_mark) ? 'text-emerald-600' : 'text-red-600'}`}>
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
              {!resultPublications.find(p => p.term === selectedTerm && p.year === parseInt(selectedYear))?.is_published ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Results Not Yet Published</h2>
                  <p className="text-slate-500 max-w-md mx-auto">
                    The academic results for <strong>{selectedTerm} {selectedYear}</strong> have not been published by the administration yet. Please check back later.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <select 
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                      <option value="Term 4">Term 4</option>
                    </select>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {[0, 1, 2].map(offset => {
                        const year = new Date().getFullYear() - offset;
                        return <option key={year} value={year.toString()}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Academic Results</h2>
                        <p className="text-sm text-slate-500 mt-1">Comprehensive view of your academic performance</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <select 
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="all">All Subjects</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <select 
                          value={selectedTerm}
                          onChange={(e) => setSelectedTerm(e.target.value)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Term 1">Term 1</option>
                          <option value="Term 2">Term 2</option>
                          <option value="Term 3">Term 3</option>
                          <option value="Term 4">Term 4</option>
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
                      <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 rounded-[2rem] text-white shadow-lg shadow-primary-200">
                        <div className="flex items-center gap-3 mb-4 opacity-80">
                          <TrendingUp className="w-5 h-5" />
                          <p className="text-xs font-bold uppercase tracking-wider">Average Mark</p>
                        </div>
                        <h3 className="text-4xl font-black">{averageScore}%</h3>
                        <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${averageScore}%` }}
                            className="h-full bg-white"
                          />
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="text-xs font-bold uppercase tracking-wider">
                              {selectedSubjectId === 'all' ? 'Subjects Passed' : 'Tasks Passed'}
                            </p>
                          </div>
                          <h3 className="text-4xl font-black text-slate-900">
                            {filteredResults.filter(r => {
                              const passMark = getSubjectPassMark(r.subjects?.name, r.subjects?.pass_mark);
                              return Number(r.score) >= passMark;
                            }).length} <span className="text-xl text-slate-400 font-medium">/ {selectedSubjectId === 'all' ? subjects.length : filteredResults.length}</span>
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 font-medium">Keep up the great work!</p>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <Award className="w-5 h-5" />
                            <p className="text-xs font-bold uppercase tracking-wider">Current Level</p>
                          </div>
                          <h3 className="text-4xl font-black text-slate-900">
                            Level {getLevel(Number(averageScore)).level}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 font-medium">
                          {getLevel(Number(averageScore)).description}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Task/Assessment</th>
                            <th className="px-6 py-5 text-center font-bold text-slate-500 text-xs uppercase tracking-wider">Score</th>
                            <th className="px-6 py-5 text-center font-bold text-slate-500 text-xs uppercase tracking-wider">Pass Mark</th>
                            <th className="px-6 py-5 text-center font-bold text-slate-500 text-xs uppercase tracking-wider">Level</th>
                            <th className="px-6 py-5 text-right font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {filteredResults.map((result) => {
                            const subject = result.subjects;
                            const passMark = getSubjectPassMark(subject?.name, subject?.pass_mark);
                            const isPassed = Number(result.score) >= passMark;
                            
                            return (
                              <tr key={result.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                      isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                      {subject?.name?.[0] || 'S'}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">{subject?.name || 'Unknown Subject'}</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{subject?.code || 'N/A'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <span className="text-sm font-medium text-slate-600">{result.tasks?.name || 'Final Mark'}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className={`text-lg font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {result.score}%
                                    </span>
                                    <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                      <div 
                                        className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}
                                        style={{ width: `${result.score}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span className="text-sm font-bold text-slate-400">{passMark}%</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black border-2 ${
                                    isPassed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                                  }`}>
                                    {getLevel(Number(result.score)).level}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                    isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {isPassed ? 'Pass' : 'Fail'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredResults.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-20 text-center">
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                  <ClipboardList className="w-16 h-16" />
                                  <p className="font-bold text-lg">No results found</p>
                                </div>
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
                            const passMark = getSubjectPassMark(subjectName, subjectResults[subjectResults.length - 1].subjects?.pass_mark);
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
                </>
              )}
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

          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Tasks & Quizzes</h2>
                      <p className="text-sm text-slate-500 mt-1">View and complete your assigned tasks</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <motion.div 
                      key={task.id}
                      whileHover={{ y: -5 }}
                      className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                          task.type === 'Quiz' ? 'bg-amber-100 text-amber-700' : 
                          task.type === 'Puzzle' ? 'bg-purple-100 text-purple-700' : 
                          'bg-primary-100 text-primary-700'
                        }`}>
                          {task.type || 'Task'}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">{task.name}</h3>
                          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">{task.subjects?.name}</p>
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-4 pt-4 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Trophy className="w-3.5 h-3.5" />
                            {task.total_marks} Marks
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.term}
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all flex items-center justify-center gap-2"
                        >
                          {task.type === 'Quiz' ? 'Start Quiz' : 'View Details'}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No Tasks Assigned</h3>
                      <p className="text-sm text-slate-500 mt-1">Your teacher hasn't posted any tasks for your class yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'materials' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Learning Materials</h2>
                    <p className="text-sm text-slate-500 mt-1">Download study guides, notes, and other resources from your teachers.</p>
                  </div>
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                    <Download className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map((m) => (
                    <motion.div 
                      key={m.id}
                      whileHover={{ y: -4 }}
                      className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary-200 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white rounded-2xl text-red-600 shadow-sm">
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                          PDF Document
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {m.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center text-[10px] font-bold">
                          {m.teachers?.first_name[0]}{m.teachers?.last_name[0]}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          By {m.teachers?.first_name} {m.teachers?.last_name}
                        </p>
                      </div>

                      <button 
                        onClick={() => downloadMaterial(m)}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </motion.div>
                  ))}

                  {materials.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Download className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No Materials Yet</h3>
                      <p className="text-sm text-slate-500 mt-1">Your teachers haven't uploaded any learning materials for your grade yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {selectedTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
                >
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                        {selectedTask.type === 'Quiz' ? <Brain className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedTask.name}</h2>
                        <p className="text-sm text-slate-500">{selectedTask.subjects?.name} • {selectedTask.type || 'Task'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900">Instructions</h4>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        {selectedTask.description || 'No instructions provided.'}
                      </p>
                    </div>

                    {selectedTask.type === 'Puzzle' && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary-600" />
                          Puzzle Challenge
                        </h4>
                        <PuzzlePlayer 
                          image={selectedTask.questions?.find((q: any) => q.puzzle_image)?.puzzle_image || ''} 
                          onComplete={() => {
                            // Optionally save progress
                          }} 
                        />
                      </div>
                    )}

                    {selectedTask.type === 'Quiz' && selectedTask.questions && selectedTask.questions.length > 0 && (
                      <QuizPlayer 
                        questions={selectedTask.questions}
                        onComplete={(score) => {
                          // Optionally save results
                        }}
                      />
                    )}

                    {(selectedTask.type === 'Task' || selectedTask.type === 'Puzzle') && selectedTask.questions && selectedTask.questions.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-primary-600" />
                          Questions ({selectedTask.questions.filter((q: any) => !q.puzzle_image).length})
                        </h4>
                        <div className="space-y-4">
                          {selectedTask.questions.filter((q: any) => !q.puzzle_image).map((q: any, i: number) => (
                            <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                              <p className="text-sm font-bold text-slate-900 mb-4">{i + 1}. {q.question}</p>
                              {q.image && (
                                <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4">
                                  <img src={q.image} alt="Question" className="w-full h-auto max-h-64 object-contain bg-slate-50" referrerPolicy="no-referrer" />
                                </div>
                              )}
                              {q.options && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {q.options.map((opt: string, j: number) => (
                                    <div key={j} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-400">
                                        {String.fromCharCode(65 + j)}
                                      </div>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTask.type === 'Task' && (
                      <div className="flex items-center justify-between p-6 bg-primary-50 rounded-3xl border border-primary-100">
                        <div>
                          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Total Marks</p>
                          <p className="text-2xl font-bold text-primary-700">{selectedTask.total_marks}</p>
                        </div>
                        <button className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20">
                          Submit Task
                        </button>
                      </div>
                    )}
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

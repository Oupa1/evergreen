export interface Grade {
  id: string;
  name: string;
  school_id: number;
  created_at?: string;
}

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password?: string;
  school_id: number;
  created_at?: string;
}

export interface Section {
  id: string;
  grade_id: string;
  name: string;
  class_teacher_id?: string;
  teachers?: Teacher;
  school_id: number;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  pass_mark?: number;
  school_id: number;
  created_at?: string;
}

export interface ClassSubject {
  id: string;
  section_id: string;
  subject_id: string;
  teacher_id?: string;
  periods_per_week?: number;
  school_id: number;
  created_at?: string;
}

export interface SchoolInfo {
  id?: string;
  name: string;
  logo?: string;
  mission?: string;
  vision?: string;
  contact?: string;
  type: 'private' | 'public';
  level: 'primary' | 'high' | 'both';
  primary_color?: string;
  secondary_color?: string;
  timetable_config?: {
    startTime: string;
    periodDuration: number;
    knockOffTime: string;
    breaks: Array<{ name: string; startTime: string; duration: number }>;
  };
  sms_config?: {
    username: string;
    password: string;
  };
  school_id: number;
  created_at?: string;
}

export interface Student {
  id: string;
  section_id: string;
  first_name: string;
  last_name: string;
  gender?: 'Male' | 'Female' | 'Other';
  email: string;
  phone?: string;
  student_id: string;
  password?: string;
  school_id: number;
  sections?: {
    name: string;
    grade_id: string;
    grades: {
      name: string;
    };
  };
  created_at?: string;
}

export interface Result {
  id: string;
  student_id: string;
  subject_id: string;
  task_id?: string;
  score: number;
  term: string;
  year: number;
  school_id: number;
  created_at?: string;
}

export interface Task {
  id: string;
  section_id: string;
  subject_id: string;
  name: string;
  description?: string;
  total_marks: number;
  weighting: number;
  term: string;
  year: number;
  school_id: number;
  type?: 'Task' | 'Quiz' | 'Puzzle';
  questions?: any[];
  created_at?: string;
  subjects?: Subject;
}

export interface School {
  id: number;
  name: string;
  slug?: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at?: string;
}

export interface AssessmentTemplate {
  id: number;
  name: string;
  grade_level: string;
  term: string;
  created_at?: string;
}

export interface TemplateSubject {
  id: number;
  template_id: number;
  subject_name: string;
  subject_code?: string;
}

export interface TemplateTask {
  id: number;
  subject_id: number;
  task_name: string;
  max_marks: number;
  weighting: number;
}

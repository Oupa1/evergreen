-- 1. Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sections Table (Classes)
CREATE TABLE IF NOT EXISTS sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grade_id, name)
);

-- Ensure class_teacher_id exists in sections
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sections' AND column_name='class_teacher_id') THEN
        ALTER TABLE sections ADD COLUMN class_teacher_id UUID;
    END IF;
END $$;

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT DEFAULT 'teacher123',
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure password exists in teachers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='password') THEN
        ALTER TABLE teachers ADD COLUMN password TEXT DEFAULT 'teacher123';
    END IF;
END $$;

-- Update sections to link to teachers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_teacher') THEN
        ALTER TABLE sections ADD CONSTRAINT fk_class_teacher FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    pass_mark INTEGER DEFAULT 50,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure pass_mark exists in subjects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='pass_mark') THEN
        ALTER TABLE subjects ADD COLUMN pass_mark INTEGER DEFAULT 50;
    END IF;
END $$;

-- 5. Class Subjects (Assigning subjects and teachers to sections)
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    periods_per_week INTEGER DEFAULT 0,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, subject_id)
);

-- Ensure teacher_id and periods_per_week exist in class_subjects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_subjects' AND column_name='teacher_id') THEN
        ALTER TABLE class_subjects ADD COLUMN teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_subjects' AND column_name='periods_per_week') THEN
        ALTER TABLE class_subjects ADD COLUMN periods_per_week INTEGER DEFAULT 0;
    END IF;
END $$;

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    student_id TEXT UNIQUE, -- Custom student ID like S001 (Accession Number)
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure gender and password exist in students
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='gender') THEN
        ALTER TABLE students ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='password') THEN
        ALTER TABLE students ADD COLUMN password TEXT DEFAULT '12345';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phone') THEN
        ALTER TABLE students ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 6. Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    term TEXT NOT NULL, -- e.g. Term 1, Term 2
    year INTEGER NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_marks NUMERIC NOT NULL DEFAULT 100,
    weighting NUMERIC NOT NULL DEFAULT 100,
    term TEXT NOT NULL,
    year INTEGER NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add task_id to results
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='results' AND column_name='task_id') THEN
        ALTER TABLE results ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.1 Super Admins Table
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    mission TEXT,
    vision TEXT,
    contact TEXT,
    type TEXT DEFAULT 'public',
    level TEXT DEFAULT 'both',
    primary_color TEXT DEFAULT '#059669',
    secondary_color TEXT DEFAULT '#10b981',
    timetable_config JSONB DEFAULT '{"startTime": "08:00", "periodDuration": 40, "knockOffTime": "15:00", "breakTimes": []}'::jsonb,
    sms_config JSONB DEFAULT '{"apiKey": "", "senderId": ""}'::jsonb,
    school_id INTEGER UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure primary_color, secondary_color, timetable_config and sms_config exist in school_info
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_info' AND column_name='primary_color') THEN
        ALTER TABLE school_info ADD COLUMN primary_color TEXT DEFAULT '#059669';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_info' AND column_name='secondary_color') THEN
        ALTER TABLE school_info ADD COLUMN secondary_color TEXT DEFAULT '#10b981';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_info' AND column_name='timetable_config') THEN
        ALTER TABLE school_info ADD COLUMN timetable_config JSONB DEFAULT '{"startTime": "08:00", "periodDuration": 40, "knockOffTime": "15:00", "breakTimes": []}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='school_info' AND column_name='sms_config') THEN
        ALTER TABLE school_info ADD COLUMN sms_config JSONB DEFAULT '{"apiKey": "", "senderId": ""}'::jsonb;
    END IF;
END $$;

-- NOTE: EMIS (Education Management Information System) number is currently stored inside
-- the timetable_config JSONB column as timetable_config.emis (no ALTER TABLE needed with anon key).
-- When a service-role key is available, run the following to give it a proper dedicated column:
-- ALTER TABLE schools ADD COLUMN IF NOT EXISTS emis TEXT DEFAULT '';

-- 10. Timetable Allocations Table
CREATE TABLE IF NOT EXISTS timetable_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day TEXT NOT NULL,
    period TEXT NOT NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    remarks TEXT,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 12. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Meetings/Reminders Table
CREATE TABLE IF NOT EXISTS meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'grades') THEN
        CREATE POLICY "Public Access" ON grades FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'sections') THEN
        CREATE POLICY "Public Access" ON sections FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'teachers') THEN
        CREATE POLICY "Public Access" ON teachers FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'subjects') THEN
        CREATE POLICY "Public Access" ON subjects FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'class_subjects') THEN
        CREATE POLICY "Public Access" ON class_subjects FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'students') THEN
        CREATE POLICY "Public Access" ON students FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'results') THEN
        CREATE POLICY "Public Access" ON results FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'tasks') THEN
        CREATE POLICY "Public Access" ON tasks FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'admins') THEN
        CREATE POLICY "Public Access" ON admins FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'schools') THEN
        CREATE POLICY "Public Access" ON schools FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'timetable_allocations') THEN
        CREATE POLICY "Public Access" ON timetable_allocations FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'attendance') THEN
        CREATE POLICY "Public Access" ON attendance FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'lessons') THEN
        CREATE POLICY "Public Access" ON lessons FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'meetings') THEN
        CREATE POLICY "Public Access" ON meetings FOR ALL USING (true);
    END IF;
END $$;

-- Insert default schools if not exists
INSERT INTO schools (name, school_id)
SELECT 'Evergreen Academy', 1
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE school_id = 1);

-- Insert default admin if not exists
INSERT INTO admins (email, password, school_id) 
SELECT 'admin@evergreen.edu', 'admin123', 1
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'admin@evergreen.edu');

-- Insert default super admin if not exists
INSERT INTO super_admins (email, password)
SELECT 'superadmin@system.edu', 'superadmin123'
WHERE NOT EXISTS (SELECT 1 FROM super_admins WHERE email = 'superadmin@system.edu');

-- Insert default teacher if not exists
INSERT INTO teachers (first_name, last_name, email, password, school_id)
SELECT 'John', 'Doe', 'teacher@evergreen.edu', 'teacher123', 1
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE email = 'teacher@evergreen.edu');

-- Insert default meeting if not exists
INSERT INTO meetings (title, description, date, location)
SELECT 'Staff Meeting', 'Monthly staff meeting to discuss academic progress.', NOW() + INTERVAL '1 day', 'Main Hall'
WHERE NOT EXISTS (SELECT 1 FROM meetings WHERE title = 'Staff Meeting');

-- 14. Learning Materials Table
CREATE TABLE IF NOT EXISTS learning_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    file_content TEXT NOT NULL, -- Base64 encoded PDF
    file_type TEXT DEFAULT 'application/pdf',
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    school_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for learning_materials
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

-- 15. Result Publications Table
CREATE TABLE IF NOT EXISTS result_publications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id INTEGER NOT NULL,
    term TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, term, year)
);

-- Enable RLS for result_publications
ALTER TABLE result_publications ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for demo purposes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'learning_materials') THEN
        CREATE POLICY "Public Access" ON learning_materials FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'result_publications') THEN
        CREATE POLICY "Public Access" ON result_publications FOR ALL USING (true);
    END IF;
END $$;

-- ============================================================
-- Education Domain Schema — learning platform model
-- ============================================================
-- Swap this in for education/edtech hackathons.
-- Covers: instructors, students, courses, assignments, AI tutoring.
-- ============================================================

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  grade_level TEXT,
  learning_style TEXT,       -- visual, auditory, reading, kinesthetic
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL REFERENCES instructors(id),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',  -- beginner, intermediate, advanced
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Enrollments (student <-> course)
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active',  -- active, completed, dropped
  current_grade REAL        -- 0.0 - 100.0
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TEXT NOT NULL,
  max_points REAL NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  content TEXT NOT NULL,
  score REAL,
  ai_feedback TEXT,          -- AI-generated feedback
  feedback_level TEXT,       -- simple, standard, detailed
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Tutoring Sessions
CREATE TABLE IF NOT EXISTS tutoring_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT REFERENCES courses(id),
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  confidence INTEGER,        -- 0-100
  helpful INTEGER,           -- student rating: 1-5
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_student ON tutoring_sessions(student_id);

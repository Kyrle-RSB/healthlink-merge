-- ============================================================
-- Education Seed Data — MOCK ONLY
-- ============================================================

INSERT OR IGNORE INTO instructors (id, name, department, email) VALUES
  ('inst_001', 'Prof. Ada Lovelace (SYNTHETIC)', 'Computer Science', 'alovelace@example.com'),
  ('inst_002', 'Prof. Carl Sagan (SYNTHETIC)', 'Astronomy', 'csagan@example.com');

INSERT OR IGNORE INTO students (id, name, email, grade_level, learning_style) VALUES
  ('stu_001', 'Alex Chen (SYNTHETIC)', 'achen@example.com', '10th', 'visual'),
  ('stu_002', 'Jordan Lee (SYNTHETIC)', 'jlee@example.com', '11th', 'reading'),
  ('stu_003', 'Sam Patel (SYNTHETIC)', 'spatel@example.com', '10th', 'kinesthetic');

INSERT OR IGNORE INTO courses (id, instructor_id, title, subject, description, difficulty) VALUES
  ('course_001', 'inst_001', 'Intro to Python', 'Computer Science',
   'MOCK: Learn programming fundamentals with Python. Covers variables, loops, functions, and basic data structures.', 'beginner'),
  ('course_002', 'inst_002', 'The Solar System', 'Astronomy',
   'MOCK: Explore our cosmic neighborhood. Planets, moons, asteroids, and the search for life.', 'intermediate');

INSERT OR IGNORE INTO enrollments (id, student_id, course_id, status, current_grade) VALUES
  ('enr_001', 'stu_001', 'course_001', 'active', 88.5),
  ('enr_002', 'stu_002', 'course_001', 'active', 92.0),
  ('enr_003', 'stu_001', 'course_002', 'active', 78.0),
  ('enr_004', 'stu_003', 'course_002', 'active', 85.0);

INSERT OR IGNORE INTO assignments (id, course_id, title, description, due_date, max_points) VALUES
  ('asn_001', 'course_001', 'Variables & Types', 'MOCK: Write a program that demonstrates different variable types in Python.', '2026-04-01', 100),
  ('asn_002', 'course_001', 'Loop Challenges', 'MOCK: Solve 5 loop-based programming puzzles.', '2026-04-08', 100),
  ('asn_003', 'course_002', 'Planet Comparison', 'MOCK: Compare two planets and present findings.', '2026-04-05', 100);

INSERT OR IGNORE INTO submissions (id, assignment_id, student_id, content, score, ai_feedback, feedback_level) VALUES
  ('sub_001', 'asn_001', 'stu_001',
   'MOCK: Student submitted Python script demonstrating int, float, string, bool, and list types with examples.',
   92, 'MOCK: Excellent work! Your examples clearly show each type. Consider adding a dictionary example for extra credit. Your variable naming follows PEP 8 conventions nicely.', 'standard'),
  ('sub_002', 'asn_001', 'stu_002',
   'MOCK: Student submitted a comprehensive notebook with type annotations and type conversion examples.',
   98, 'MOCK: Outstanding! You went beyond the requirements by including type hints and conversion. This shows real depth of understanding.', 'standard');

INSERT OR IGNORE INTO tutoring_sessions (id, student_id, course_id, question, response, confidence, helpful) VALUES
  ('tut_001', 'stu_003', 'course_002',
   'MOCK: Why is Pluto not a planet anymore?',
   'MOCK: Great question! In 2006, the International Astronomical Union created a new definition for planets. A planet must: 1) orbit the Sun, 2) be massive enough for gravity to make it round, and 3) have cleared its orbital neighborhood of other debris. Pluto meets the first two but not the third — it shares its orbital zone with other Kuiper Belt objects. So it was reclassified as a "dwarf planet."',
   95, 5);

const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'data.sqlite');
const db = new Database(dbPath);

// Create a sample upload record
const uploadId = 'demo_upload_' + Date.now();
const courseId = 'demo_course';
const level = 'Easy';
const fileName = 'sample-quiz.txt';
const filePath = '_demo/Easy/sample-quiz.txt';

// Insert upload record
const insertUpload = db.prepare(`
  INSERT INTO quiz_uploads (id, course_id, level, file_name, file_path, file_size, file_type, uploaded_by, status, processed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

insertUpload.run(
  uploadId,
  courseId,
  level,
  fileName,
  filePath,
  1024, // file size
  'text/plain',
  'admin',
  'processed'
);

console.log('Inserted upload record');

// Insert sample questions
const insertQuestion = db.prepare(`
  INSERT INTO quiz_questions (
    id, quiz_upload_id, course_id, level, question_number, 
    question_text, options_json, correct_answer, explanation, question_type
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Question 1
insertQuestion.run(
  'demo_q1_' + Date.now(),
  uploadId,
  courseId,
  level,
  1,
  'What is the value of x in the equation 2x + 5 = 15?',
  JSON.stringify(['5', '10', '7.5', '20']),
  0, // A is correct (index 0)
  'Subtract 5 from both sides: 2x = 10. Then divide by 2: x = 5.',
  'mcq'
);

// Question 2
insertQuestion.run(
  'demo_q2_' + Date.now(),
  uploadId,
  courseId,
  level,
  2,
  'Which of the following is a prime number?',
  JSON.stringify(['15', '23', '27', '33']),
  1, // B is correct (index 1)
  '23 is only divisible by 1 and itself, making it a prime number.',
  'mcq'
);

// Question 3
insertQuestion.run(
  'demo_q3_' + Date.now(),
  uploadId,
  courseId,
  level,
  3,
  'What is the area of a rectangle with length 8 cm and width 5 cm?',
  JSON.stringify(['13 cm²', '26 cm²', '40 cm²', '3 cm²']),
  2, // C is correct (index 2)
  'Area of rectangle = length × width = 8 × 5 = 40 cm².',
  'mcq'
);

console.log('Inserted sample questions');
console.log('Sample quiz data inserted successfully!');
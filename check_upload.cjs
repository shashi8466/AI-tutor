const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'data.sqlite');
const db = new Database(dbPath);

// Check the upload record
const courseId = 'course_1762414017406';
const level = 'Easy';

console.log(`Checking uploads for course: ${courseId}, level: ${level}`);

// Get the upload record
const uploadStmt = db.prepare('SELECT * FROM quiz_uploads WHERE course_id = ? AND level = ?');
const uploads = uploadStmt.all(courseId, level);

console.log(`Uploads found: ${uploads.length}`);
uploads.forEach((upload, index) => {
  console.log(`${index + 1}. ID: ${upload.id}, File: ${upload.file_name}, Status: ${upload.status}`);
  
  // Count questions for this upload
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_upload_id = ?');
  const countResult = countStmt.get(upload.id);
  console.log(`   Questions for this upload: ${countResult.count}`);
});
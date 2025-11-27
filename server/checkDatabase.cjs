const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'data.sqlite');
console.log('Checking database at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check quiz_uploads table
  console.log('\n=== UPLOADS TABLE ===');
  const uploads = db.prepare('SELECT * FROM quiz_uploads ORDER BY uploaded_at DESC').all();
  console.log('Found', uploads.length, 'uploads:');
  uploads.forEach(upload => {
    console.log('  - ID:', upload.id);
    console.log('    Course ID:', upload.course_id);
    console.log('    Level:', upload.level);
    console.log('    File:', upload.file_name);
    console.log('    Status:', upload.status);
    console.log('    Uploaded:', upload.uploaded_at);
    console.log('    ---');
  });
  
  // Check quiz_questions table
  console.log('\n=== QUESTIONS TABLE ===');
  const questions = db.prepare('SELECT * FROM quiz_questions').all();
  console.log('Found', questions.length, 'questions:');
  
  // Group by course_id and level
  const courseLevels = {};
  questions.forEach(q => {
    const key = `${q.course_id}-${q.level}`;
    if (!courseLevels[key]) {
      courseLevels[key] = [];
    }
    courseLevels[key].push(q);
  });
  
  Object.keys(courseLevels).forEach(key => {
    const [courseId, level] = key.split('-');
    console.log(`  Course: ${courseId}, Level: ${level} - ${courseLevels[key].length} questions`);
  });
  
  // Check distinct course_id/level combinations
  console.log('\n=== COURSE/LEVEL COMBINATIONS ===');
  const distinctCombinations = db.prepare(`
    SELECT DISTINCT course_id, level FROM quiz_questions
  `).all();
  distinctCombinations.forEach(combo => {
    console.log('  -', combo.course_id, ':', combo.level);
  });
  
  db.close();
} catch (e) {
  console.error('Error:', e.message);
}
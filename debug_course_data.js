// Debug script to check course data consistency
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Check localStorage data
console.log('=== LOCAL STORAGE COURSES ===');
try {
  const coursesData = localStorage.getItem('aiTutorCourses');
  if (coursesData) {
    const courses = JSON.parse(coursesData);
    console.log('Found', courses.length, 'courses in localStorage:');
    courses.forEach(course => {
      console.log('  -', course.id, ':', course.title);
    });
  } else {
    console.log('No courses found in localStorage');
  }
} catch (e) {
  console.log('Error reading localStorage:', e.message);
}

// Check database data
console.log('\n=== DATABASE DATA ===');
try {
  const dbPath = path.join(__dirname, 'server', 'data.sqlite');
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    
    // Check quiz_uploads table
    const uploads = db.prepare('SELECT * FROM quiz_uploads').all();
    console.log('Found', uploads.length, 'uploads in database:');
    uploads.forEach(upload => {
      console.log('  -', upload.id, ':', upload.course_id, '-', upload.level, '-', upload.file_name);
    });
    
    // Check quiz_questions table
    const questions = db.prepare('SELECT * FROM quiz_questions').all();
    console.log('\nFound', questions.length, 'questions in database:');
    const courseIds = [...new Set(questions.map(q => q.course_id))];
    console.log('Course IDs in questions table:', courseIds);
    
    // Check distinct course_id/level combinations
    const courseLevels = db.prepare(`
      SELECT DISTINCT course_id, level FROM quiz_questions
    `).all();
    console.log('\nCourse/Level combinations in questions table:');
    courseLevels.forEach(cl => {
      console.log('  -', cl.course_id, ':', cl.level);
    });
    
    db.close();
  } else {
    console.log('Database file not found at:', dbPath);
  }
} catch (e) {
  console.log('Error reading database:', e.message);
}
const Database = require('better-sqlite3');
const QuizParser = require('./server/quizParser.js').default;
const path = require('path');
const fs = require('fs');

async function reprocessUpload() {
  try {
    // Connect to database
    const dbPath = path.join(__dirname, 'server', 'data.sqlite');
    const db = new Database(dbPath);
    
    // Get the existing upload record
    const courseId = 'course_1762414017406';
    const level = 'Easy';
    
    const uploadStmt = db.prepare('SELECT * FROM quiz_uploads WHERE course_id = ? AND level = ?');
    const uploads = uploadStmt.all(courseId, level);
    
    if (uploads.length === 0) {
      console.log('No upload found for this course and level');
      return;
    }
    
    const upload = uploads[0];
    console.log(`Found upload: ${upload.id}, File: ${upload.file_name}, Status: ${upload.status}`);
    
    // File path - check both possible paths
    let filePath = path.join(__dirname, 'server', 'storage', 'quiz-docs', courseId, level, upload.file_name);
    
    // If the exact file name doesn't exist, check for files in the directory
    if (!fs.existsSync(filePath)) {
      const dirPath = path.join(__dirname, 'server', 'storage', 'quiz-docs', courseId, level);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        if (files.length > 0) {
          filePath = path.join(dirPath, files[0]);
          console.log(`Using file: ${filePath}`);
        }
      }
    }
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    console.log(`Parsing file: ${filePath}`);
    
    // Initialize parser
    const quizParser = new QuizParser();
    
    // Parse the document
    const questions = await quizParser.parseDocument(filePath, courseId, level);
    
    console.log(`Parsed ${questions.length} questions`);
    
    // Clear existing questions for this upload
    console.log('Clearing existing questions...');
    db.prepare('DELETE FROM quiz_questions WHERE quiz_upload_id = ?').run(upload.id);
    
    // Insert questions
    console.log('Inserting questions...');
    const insertQuestion = db.prepare(`INSERT INTO quiz_questions (id, quiz_upload_id, course_id, level, question_number, question_text, options_json, correct_answer, explanation, question_type, image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    
    let insertedCount = 0;
    for (const q of questions) {
      try {
        insertQuestion.run(
          Math.random().toString(36).slice(2) + Date.now().toString(36),
          upload.id, // Use the existing upload ID
          courseId,
          level,
          q.question_number,
          q.question_text,
          JSON.stringify(q.options || []),
          q.correct_answer !== undefined ? q.correct_answer : -1,
          q.explanation || '',
          q.question_type || 'mcq',
          q.image_url || null
        );
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting question ${q.question_number}:`, error);
      }
    }
    
    console.log(`Inserted ${insertedCount} questions into database`);
    
    // Verify count
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_upload_id = ?');
    const countResult = countStmt.get(upload.id);
    console.log(`Total questions in DB for this upload: ${countResult.count}`);
    
    // Update upload status to processed
    db.prepare('UPDATE quiz_uploads SET status = ?, processed_at = datetime("now") WHERE id = ?').run('processed', upload.id);
    console.log('Updated upload status to processed');
    
  } catch (error) {
    console.error('Error during reprocessing:', error);
  }
}

reprocessUpload();
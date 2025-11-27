const Database = require('better-sqlite3');
const QuizParser = require('./server/quizParser.js').default;
const path = require('path');

async function testFullProcess() {
  try {
    // Initialize parser
    const quizParser = new QuizParser();
    
    // File path
    const filePath = path.join(__dirname, 'server', 'storage', 'quiz-docs', 'course_1762414017406', 'Easy', '1762414035144-EOS-Test 18 Math Easy.txt');
    const courseId = 'course_1762414017406';
    const level = 'Easy';
    
    console.log(`Parsing file: ${filePath}`);
    
    // Parse the document
    const questions = await quizParser.parseDocument(filePath, courseId, level);
    
    console.log(`Parsed ${questions.length} questions`);
    
    // Connect to database
    const dbPath = path.join(__dirname, 'server', 'data.sqlite');
    const db = new Database(dbPath);
    
    // Clear existing questions for this course and level
    console.log('Clearing existing questions...');
    db.prepare('DELETE FROM quiz_questions WHERE course_id = ? AND level = ?').run(courseId, level);
    
    // Insert questions
    console.log('Inserting questions...');
    const insertQuestion = db.prepare(`INSERT INTO quiz_questions (id, quiz_upload_id, course_id, level, question_number, question_text, options_json, correct_answer, explanation, question_type, image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    
    let insertedCount = 0;
    for (const q of questions) {
      try {
        insertQuestion.run(
          Math.random().toString(36).slice(2) + Date.now().toString(36),
          'test_upload_id',
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
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM quiz_questions WHERE course_id = ? AND level = ?');
    const countResult = countStmt.get(courseId, level);
    console.log(`Total questions in DB for this course/level: ${countResult.count}`);
    
    // Get all questions to see what's there
    const questionsStmt = db.prepare('SELECT id, question_number, question_text FROM quiz_questions WHERE course_id = ? AND level = ? ORDER BY question_number');
    const dbQuestions = questionsStmt.all(courseId, level);
    
    console.log(`\nQuestions in DB (${dbQuestions.length} total):`);
    dbQuestions.forEach((q, index) => {
      console.log(`${index + 1}. Q${q.question_number}: ${q.question_text.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testFullProcess();
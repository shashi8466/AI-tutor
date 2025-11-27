import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = path.join(__dirname, 'data.sqlite');

// Connect to database
try {
  const db = new Database(dbPath);
  console.log('✅ Connected to database successfully');
  
  // Get the latest upload for demo_course
  const latestUpload = db.prepare(`
    SELECT * FROM quiz_uploads 
    WHERE course_id = 'demo_course' 
    ORDER BY uploaded_at DESC
    LIMIT 1
  `).get();
  
  if (!latestUpload) {
    console.log('No uploads found for demo_course');
    process.exit(0);
  }
  
  console.log(`\n📊 Latest upload: ${latestUpload.file_name} (${latestUpload.level})`);
  
  // Check questions for this upload - get all of them
  const questions = db.prepare(`
    SELECT * FROM quiz_questions 
    WHERE quiz_upload_id = ? 
    ORDER BY question_number ASC
  `).all(latestUpload.id);
  
  console.log(`\n❓ Found ${questions.length} questions:`);
  
  // Show all questions with their actual question numbers
  questions.forEach((q, index) => {
    console.log(`  Q${q.question_number}: ${q.question_text?.substring(0, 60) || 'No text'}...`);
    console.log(`    ID: ${q.id.substring(0, 8)}... | Type: ${q.question_type} | Options: ${JSON.parse(q.options_json || '[]').length}`);
  });
  
  // Close database
  db.close();
  console.log('\n🔒 Database connection closed');
} catch (dbError) {
  console.error('❌ Database error:', dbError.message);
  process.exit(1);
}

console.log('\n✅ Specific questions check completed successfully');
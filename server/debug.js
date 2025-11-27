import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = path.join(__dirname, 'data.sqlite');
console.log('Database path:', dbPath);

// Connect to database
try {
  const db = new Database(dbPath);
  console.log('✅ Connected to database successfully');
  
  // Check if tables exist
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Database tables:', tables.map(t => t.name));
    
    // Check quiz_uploads table
    if (tables.some(t => t.name === 'quiz_uploads')) {
      const uploadCount = db.prepare('SELECT COUNT(*) as count FROM quiz_uploads').get();
      console.log('📁 Quiz uploads count:', uploadCount.count);
      
      if (uploadCount.count > 0) {
        const uploads = db.prepare('SELECT * FROM quiz_uploads ORDER BY uploaded_at DESC LIMIT 5').all();
        console.log('📄 Recent uploads:');
        uploads.forEach(upload => {
          console.log(`  - ${upload.file_name} (${upload.status}) - ${upload.course_id}/${upload.level}`);
        });
      }
    }
    
    // Check quiz_questions table
    if (tables.some(t => t.name === 'quiz_questions')) {
      const questionCount = db.prepare('SELECT COUNT(*) as count FROM quiz_questions').get();
      console.log('❓ Quiz questions count:', questionCount.count);
      
      if (questionCount.count > 0) {
        const questions = db.prepare('SELECT * FROM quiz_questions ORDER BY created_at DESC LIMIT 3').all();
        console.log('📝 Recent questions:');
        questions.forEach(q => {
          console.log(`  - Q${q.question_number}: ${q.question_text?.substring(0, 50) || 'No text'}... (${q.question_type})`);
        });
      }
    }
  } catch (tableError) {
    console.error('❌ Error checking tables:', tableError.message);
  }
  
  // Close database
  db.close();
  console.log('🔒 Database connection closed');
} catch (dbError) {
  console.error('❌ Database connection failed:', dbError.message);
  process.exit(1);
}

console.log('\n✅ Debug script completed successfully');
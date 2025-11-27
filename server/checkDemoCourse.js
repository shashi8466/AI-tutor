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
  
  // Check for demo_course specifically
  console.log('\n🔍 Checking demo_course data...');
  
  const demoUploads = db.prepare(`
    SELECT * FROM quiz_uploads 
    WHERE course_id = 'demo_course' 
    ORDER BY uploaded_at DESC
  `).all();
  
  console.log(`📁 Found ${demoUploads.length} uploads for demo_course:`);
  demoUploads.forEach((upload, index) => {
    console.log(`  ${index + 1}. ${upload.file_name} (${upload.level}) - ${upload.status} - ${upload.uploaded_at}`);
  });
  
  if (demoUploads.length > 0) {
    const latestUpload = demoUploads[0];
    console.log(`\n📊 Latest upload: ${latestUpload.file_name} (${latestUpload.level})`);
    
    // Check questions for this upload
    const questions = db.prepare(`
      SELECT * FROM quiz_questions 
      WHERE quiz_upload_id = ? 
      ORDER BY question_number ASC
    `).all(latestUpload.id);
    
    console.log(`❓ Found ${questions.length} questions in latest upload:`);
    
    // Show first 5 questions
    questions.slice(0, 5).forEach((q, index) => {
      console.log(`  Q${q.question_number}: ${q.question_text?.substring(0, 60) || 'No text'}...`);
      console.log(`    Type: ${q.question_type} | Options: ${JSON.parse(q.options_json || '[]').length} | Image: ${q.image_url ? 'Yes' : 'No'}`);
    });
    
    // Check if there are any questions with tables or math expressions
    const questionsWithTables = questions.filter(q => q.tables_json && q.tables_json !== 'null');
    const questionsWithMath = questions.filter(q => q.math_expressions_json && q.math_expressions_json !== 'null');
    
    console.log(`\n📈 Special content:`);
    console.log(`  Questions with tables: ${questionsWithTables.length}`);
    console.log(`  Questions with math expressions: ${questionsWithMath.length}`);
  }
  
  // Close database
  db.close();
  console.log('\n🔒 Database connection closed');
} catch (dbError) {
  console.error('❌ Database error:', dbError.message);
  process.exit(1);
}

console.log('\n✅ Demo course check completed successfully');
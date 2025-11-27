import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Database from 'better-sqlite3'
import QuizParser from './quizParser.js'
import QuizParserImproved from './quizParserImproved.js'
import QuizParserFixed from './quizParserFixed.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure storage directory exists
const STORAGE_ROOT = path.join(__dirname, 'storage', 'quiz-docs')
fs.mkdirSync(STORAGE_ROOT, { recursive: true })

// Init DB
const dbPath = path.join(__dirname, 'data.sqlite')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS quiz_uploads (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('Easy','Medium','Hard')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded','processing','processed','error'))
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_upload_id TEXT REFERENCES quiz_uploads(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  level TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  question_type TEXT DEFAULT 'mcq' CHECK(question_type IN ('mcq', 'short_answer', 'image_based')),
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_uploads_course_level ON quiz_uploads(course_id, level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_course_level ON quiz_questions(course_id, level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_upload_id ON quiz_questions(quiz_upload_id);
`)

// Migration: Add missing columns if they don't exist
try {
  const tableInfo = db.prepare(`PRAGMA table_info(quiz_questions)`).all()
  const columnNames = tableInfo.map(col => col.name)
  
  if (!columnNames.includes('question_type')) {
    console.log('Adding missing column: question_type')
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN question_type TEXT DEFAULT 'mcq'`)
  }
  
  if (!columnNames.includes('image_url')) {
    console.log('Adding missing column: image_url')
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN image_url TEXT`)
  }
  
  if (!columnNames.includes('tables_json')) {
    console.log('Adding missing column: tables_json')
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN tables_json TEXT`)
  }
  
  if (!columnNames.includes('math_expressions_json')) {
    console.log('Adding missing column: math_expressions_json')
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN math_expressions_json TEXT`)
  }
} catch (migrationError) {
  console.warn('Migration error (may be expected):', migrationError.message)
}

const app = express()
app.use(cors())
app.use(express.json())

// Multer storage: write to temp root; move into course/level after upload
const TEMP_ROOT = path.join(STORAGE_ROOT, '_incoming')
fs.mkdirSync(TEMP_ROOT, { recursive: true })

// Enhanced file filter for multer
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/pdf',
    'text/plain',
    'application/zip'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error('File upload rejected - invalid type:', file.mimetype, file.originalname);
    cb(new Error('Only .docx, .pdf, .txt, and .zip files are allowed'), false);
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_ROOT)
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`
    cb(null, unique)
  }
})

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
})

// Helpers
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// Create upload + persist file, then auto-generate questions
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', { 
      course_id: req.body.course_id, 
      level: req.body.level, 
      file: req.file ? req.file.originalname : 'no file' 
    });
    
    const { course_id, level } = req.body
    if (!course_id || !level || !req.file) {
      console.error('Missing required fields:', { course_id, level, hasFile: !!req.file });
      return res.status(400).json({ error: 'Missing course_id, level, or file' })
    }
    
    // Log all existing course_ids to see what we have
    const existingCourseIds = db.prepare(`SELECT DISTINCT course_id FROM quiz_uploads`).all();
    console.log('Existing course_ids in database:', existingCourseIds);
    
    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/pdf',
      'text/plain',
      'application/zip'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      console.error('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ 
        error: 'Invalid file type. Only .docx, .pdf, .txt, and .zip files are allowed.',
        receivedType: req.file.mimetype
      });
    }
    
    const id = genId()

    // Move file into course/level folder now that fields are available
    const courseLevelDir = path.join(STORAGE_ROOT, course_id, level)
    fs.mkdirSync(courseLevelDir, { recursive: true })
    const finalAbsPath = path.join(courseLevelDir, path.basename(req.file.path))
    fs.renameSync(req.file.path, finalAbsPath)
    const fileRelPath = path.relative(STORAGE_ROOT, finalAbsPath).replace(/\\/g, '/')
    
    // If ZIP file, extract images to course/level directory
    if (req.file.mimetype === 'application/zip' || path.extname(req.file.originalname).toLowerCase() === '.zip') {
      try {
        const AdmZip = (await import('adm-zip')).default
        const zip = new AdmZip(finalAbsPath)
        const zipEntries = zip.getEntries()
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp']
        
        for (const entry of zipEntries) {
          if (!entry.isDirectory) {
            const entryExt = path.extname(entry.entryName).toLowerCase()
            if (imageExtensions.includes(entryExt)) {
              // Extract image to course/level directory, preserving directory structure if in subfolder
              const entryPath = entry.entryName.replace(/^[^/]+/, '') // Remove any top-level folder
              const imagePath = path.join(courseLevelDir, path.basename(entryPath) || path.basename(entry.entryName))
              fs.writeFileSync(imagePath, entry.getData())
              console.log(`Extracted image: ${path.basename(imagePath)}`)
            }
          }
        }
      } catch (zipError) {
        console.warn('Failed to extract images from ZIP:', zipError.message)
      }
    }

    const insertUpload = db.prepare(`INSERT INTO quiz_uploads (id, course_id, level, file_name, file_path, file_size, file_type, uploaded_by, status) VALUES (?,?,?,?,?,?,?,?,?)`)
    insertUpload.run(
      id,
      course_id,
      level,
      req.file.originalname,
      fileRelPath,
      req.file.size,
      req.file.mimetype,
      'admin',
      'processing'
    )

    // Parse the uploaded document to extract questions
    const insertQuestion = db.prepare(`INSERT INTO quiz_questions (id, quiz_upload_id, course_id, level, question_number, question_text, options_json, correct_answer, explanation, created_at, question_type, image_url, tables_json, math_expressions_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    
    try {
      // Use the fixed parser instead of the improved one
      const quizParser = new QuizParserFixed()
      console.log(`Starting document parsing: ${finalAbsPath}`);
      const questions = await quizParser.parseDocument(finalAbsPath, course_id, level)
      
      console.log(`Extracted ${questions.length} questions from ${req.file.originalname}`)
      
      // Validate that we have questions
      if (!questions || questions.length === 0) {
        throw new Error('No questions were extracted from the document');
      }
      
      // Get the upload directory for image path resolution
      const uploadDir = path.dirname(finalAbsPath)
      
      // Save each parsed question to database
      for (const q of questions) {
        // Process image URL - extract from question text first, then resolve path
        let imageUrl = q.image_url || null
        
        // Extract image marker from question text
        const imageMarkerMatch = q.question_text?.match(/\[IMAGE:(.+?)(?::(.+?))?\]/i)
        if (imageMarkerMatch) {
          const imageRef = imageMarkerMatch[1]
          // Remove image marker from question text
          q.question_text = q.question_text.replace(/\[IMAGE:[^\]]+\]/gi, '').trim()
          
          // Resolve image path
          if (!imageRef.startsWith('http') && !path.isAbsolute(imageRef)) {
            // It's a relative path - extract just the filename
            const imageFileName = path.basename(imageRef).split(/[?#]/)[0] // Remove query strings
            
            // Check in course/level directory (where we extracted images from ZIP)
            const courseLevelImagePath = path.join(courseLevelDir, imageFileName)
            if (fs.existsSync(courseLevelImagePath)) {
              imageUrl = path.relative(STORAGE_ROOT, courseLevelImagePath).replace(/\\/g, '/')
            } else {
              // Try with original path
              const originalImagePath = path.join(courseLevelDir, imageRef)
              if (fs.existsSync(originalImagePath)) {
                imageUrl = path.relative(STORAGE_ROOT, originalImagePath).replace(/\\/g, '/')
              }
            }
          } else {
            imageUrl = imageRef
          }
        }
        
        // If still no image URL, try from q.image_url
        // Check if it's a base64 data URL (from DOCX embedded images)
        if (!imageUrl && q.image_url) {
          if (q.image_url.startsWith('data:')) {
            // Base64 data URL - store as-is
            imageUrl = q.image_url
          } else {
            imageUrl = q.image_url
          }
        }
        
        // Extract tables and math expressions
        const tablesJson = q.tables ? JSON.stringify(q.tables) : null
        const mathExpressionsJson = q.math_expressions ? JSON.stringify(q.math_expressions) : null
        
        // Validate correct_answer - if it's -1, we have a parsing issue
        let correctAnswer = q.correct_answer
        if (q.question_type === 'mcq' && correctAnswer === -1) {
          console.warn(`Warning: Could not parse correct answer for question. Setting to 0 as fallback.`);
          correctAnswer = 0 // Fallback to first option for MCQ
        }
        
        insertQuestion.run(
          genId(),
          id,
          course_id,
          level,
          q.question_number,
          q.question_text || '',
          JSON.stringify(q.options || []),
          correctAnswer, // Use validated correct answer
          q.explanation || '',
          null, // created_at - use default
          q.question_type || 'mcq',
          imageUrl,
          tablesJson,
          mathExpressionsJson
        )
      }
      
      console.log(`Successfully saved ${questions.length} questions to database`)
    } catch (parseError) {
      console.error('Error parsing document:', parseError)
      console.error('Parse error stack:', parseError.stack)
      // Update status to error
      db.prepare(`UPDATE quiz_uploads SET status='error' WHERE id=?`).run(id)
      return res.status(500).json({ error: `Document parsing failed: ${parseError.message}` })
    }

    db.prepare(`UPDATE quiz_uploads SET status='processed', processed_at=datetime('now') WHERE id=?`).run(id)

    const created = db.prepare(`SELECT * FROM quiz_uploads WHERE id=?`).get(id)
    console.log('Upload completed successfully:', created);
    return res.json(created)
  } catch (e) {
    console.error('Upload error:', e);
    console.error('Upload error stack:', e.stack);
    return res.status(500).json({ error: 'Upload failed: ' + e.message })
  }
})

// List uploads for a course
app.get('/api/upload', (req, res) => {
  const { course_id } = req.query
  console.log(`API: Received request for uploads with course_id="${course_id}"`);
  
  if (!course_id) {
    console.error('Missing required query parameter: course_id');
    return res.status(400).json({ error: 'course_id required' })
  }
  
  // Log all uploads to see what's in the database
  const allUploads = db.prepare(`SELECT * FROM quiz_uploads`).all();
  console.log('API: All uploads in database:', allUploads);
  
  const rows = db.prepare(`SELECT * FROM quiz_uploads WHERE course_id=? ORDER BY uploaded_at DESC`).all(course_id)
  console.log(`API: Found ${rows.length} uploads for course_id="${course_id}"`);
  res.json(rows)
})

// Delete a single upload (also removes file and cascades questions by app logic)
app.delete('/api/upload/:id', (req, res) => {
  const { id } = req.params
  const upload = db.prepare(`SELECT * FROM quiz_uploads WHERE id=?`).get(id)
  if (!upload) return res.status(404).json({ error: 'Not found' })
  try {
    // Delete file
    const absPath = path.join(STORAGE_ROOT, upload.file_path)
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath)
  } catch {}
  db.prepare(`DELETE FROM quiz_uploads WHERE id=?`).run(id)
  db.prepare(`DELETE FROM quiz_questions WHERE quiz_upload_id=?`).run(id)
  res.json({ success: true })
})

// Reparse endpoint - reprocess an uploaded document without re-uploading
app.post('/api/upload/:id/reparse', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get the upload record
    const upload = db.prepare(`SELECT * FROM quiz_uploads WHERE id=?`).get(id)
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' })
    }
    
    // Update status to processing
    db.prepare(`UPDATE quiz_uploads SET status='processing', processed_at=NULL WHERE id=?`).run(id)
    
    // Get the file path
    const filePath = path.join(STORAGE_ROOT, upload.file_path)
    if (!fs.existsSync(filePath)) {
      db.prepare(`UPDATE quiz_uploads SET status='error' WHERE id=?`).run(id)
      return res.status(404).json({ error: 'File not found' })
    }
    
    // Delete existing questions for this upload
    db.prepare(`DELETE FROM quiz_questions WHERE quiz_upload_id=?`).run(id)
    
    // Parse the document again
    const insertQuestion = db.prepare(`INSERT INTO quiz_questions (id, quiz_upload_id, course_id, level, question_number, question_text, options_json, correct_answer, explanation, created_at, question_type, image_url, tables_json, math_expressions_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    
    try {
      // Use the fixed parser
      const quizParser = new QuizParserFixed()
      console.log(`Re-parsing document: ${filePath}`);
      const questions = await quizParser.parseDocument(filePath, upload.course_id, upload.level)
      
      console.log(`Extracted ${questions.length} questions from ${upload.file_name}`)
      
      // Save each parsed question to database
      for (const q of questions) {
        // Process image URL - extract from question text first, then resolve path
        let imageUrl = q.image_url || null
        
        // Extract image marker from question text
        const imageMarkerMatch = q.question_text?.match(/\[IMAGE:(.+?)(?::(.+?))?\]/i)
        if (imageMarkerMatch) {
          const imageRef = imageMarkerMatch[1]
          // Remove image marker from question text
          q.question_text = q.question_text.replace(/\[IMAGE:[^\]]+\]/gi, '').trim()
          
          // Resolve image path
          if (!imageRef.startsWith('http') && !path.isAbsolute(imageRef)) {
            // It's a relative path - extract just the filename
            const imageFileName = path.basename(imageRef).split(/[?#]/)[0] // Remove query strings
            
            // Check in course/level directory (where we extracted images from ZIP)
            const courseLevelDir = path.join(STORAGE_ROOT, upload.course_id, upload.level)
            const courseLevelImagePath = path.join(courseLevelDir, imageFileName)
            if (fs.existsSync(courseLevelImagePath)) {
              imageUrl = path.relative(STORAGE_ROOT, courseLevelImagePath).replace(/\\/g, '/')
            } else {
              // Try with original path
              const originalImagePath = path.join(courseLevelDir, imageRef)
              if (fs.existsSync(originalImagePath)) {
                imageUrl = path.relative(STORAGE_ROOT, originalImagePath).replace(/\\/g, '/')
              }
            }
          } else {
            imageUrl = imageRef
          }
        }
        
        // If still no image URL, try from q.image_url
        // Check if it's a base64 data URL (from DOCX embedded images)
        if (!imageUrl && q.image_url) {
          if (q.image_url.startsWith('data:')) {
            // Base64 data URL - store as-is
            imageUrl = q.image_url
          } else {
            imageUrl = q.image_url
          }
        }
        
        // Extract tables and math expressions
        const tablesJson = q.tables ? JSON.stringify(q.tables) : null
        const mathExpressionsJson = q.math_expressions ? JSON.stringify(q.math_expressions) : null
        
        insertQuestion.run(
          genId(),
          id,
          upload.course_id,
          upload.level,
          q.question_number,
          q.question_text || '',
          JSON.stringify(q.options || []),
          q.correct_answer !== undefined ? q.correct_answer : -1,
          q.explanation || '',
          null, // created_at - use default
          q.question_type || 'mcq',
          imageUrl,
          tablesJson,
          mathExpressionsJson
        )
      }
      
      console.log(`Successfully re-saved ${questions.length} questions to database`)
    } catch (parseError) {
      console.error('Error re-parsing document:', parseError)
      console.error('Parse error stack:', parseError.stack)
      // Update status to error
      db.prepare(`UPDATE quiz_uploads SET status='error' WHERE id=?`).run(id)
      return res.status(500).json({ error: `Document re-parsing failed: ${parseError.message}` })
    }

    db.prepare(`UPDATE quiz_uploads SET status='processed', processed_at=datetime('now') WHERE id=?`).run(id)

    const updated = db.prepare(`SELECT * FROM quiz_uploads WHERE id=?`).get(id)
    console.log('Re-parse completed successfully:', updated);
    return res.json(updated)
  } catch (e) {
    console.error('Re-parse error:', e);
    console.error('Re-parse error stack:', e.stack);
    return res.status(500).json({ error: 'Re-parse failed: ' + e.message })
  }
})

// Get questions for course+level
app.get('/api/questions', (req, res) => {
  try {
    const { course_id, level } = req.query
    console.log(`API: Received request for questions with course_id="${course_id}", level="${level}"`);
    
    if (!course_id || !level) {
      console.error('Missing required query parameters:', { course_id, level });
      return res.status(400).json({ error: 'course_id and level required' })
    }
    
    // Validate parameter values
    if (typeof course_id !== 'string' || course_id.trim() === '') {
      console.error('Invalid course_id parameter:', course_id);
      return res.status(400).json({ error: 'Invalid course_id parameter' })
    }
    
    const validLevels = ['Easy', 'Medium', 'Hard'];
    if (!validLevels.includes(level)) {
      console.error('Invalid level parameter:', level);
      return res.status(400).json({ error: 'Invalid level parameter. Must be one of: Easy, Medium, Hard' })
    }
    
    console.log(`API: Searching for questions with course_id="${course_id}", level="${level}"`)
    
    // Log all questions and uploads to see what's in the database
    const allQuestions = db.prepare(`SELECT * FROM quiz_questions`).all();
    const allUploads = db.prepare(`SELECT * FROM quiz_uploads`).all();
    console.log('API: All questions in database:', allQuestions.length);
    console.log('API: All uploads in database:', allUploads.length);
    
    // First try to get the most recent upload for this course and level
    const recentUploadStmt = db.prepare(`
      SELECT id FROM quiz_uploads 
      WHERE course_id=? AND level=? AND status='processed' 
      ORDER BY uploaded_at DESC 
      LIMIT 1
    `);
    
    // Validate statement
    if (!recentUploadStmt) {
      console.error('Failed to prepare recent upload statement');
      return res.status(500).json({ error: 'Database error' });
    }
    
    const recentUpload = recentUploadStmt.get(course_id, level);
    console.log(`API: Recent upload query result for course_id="${course_id}", level="${level}":`, recentUpload);
    
    let rows = []
    
    if (recentUpload) {
      // Get questions only from the most recent upload
      console.log(`API: Fetching questions from most recent upload: ${recentUpload.id}`)
      const questionsStmt = db.prepare(`
        SELECT q.id, q.question_number, q.question_text, q.options_json, q.correct_answer, 
               q.explanation, q.question_type, q.image_url, q.tables_json, q.math_expressions_json, 
               u.file_name as documentName, u.file_size as documentSize 
        FROM quiz_questions q 
        LEFT JOIN quiz_uploads u ON q.quiz_upload_id = u.id 
        WHERE q.quiz_upload_id=? 
        ORDER BY q.question_number ASC
      `);
      
      // Validate statement
      if (!questionsStmt) {
        console.error('Failed to prepare questions statement');
        return res.status(500).json({ error: 'Database error' });
      }
      
      rows = questionsStmt.all(recentUpload.id);
      console.log(`API: Found ${rows.length} questions from recent upload ${recentUpload.id}`);
    } else {
      // Fallback to getting all questions if no recent upload found
      console.log(`API: No recent upload found, fetching all questions for course_id="${course_id}", level="${level}"`)
      const allQuestionsStmt = db.prepare(`
        SELECT q.id, q.question_number, q.question_text, q.options_json, q.correct_answer, 
               q.explanation, q.question_type, q.image_url, q.tables_json, q.math_expressions_json, 
               u.file_name as documentName, u.file_size as documentSize 
        FROM quiz_questions q 
        LEFT JOIN quiz_uploads u ON q.quiz_upload_id = u.id 
        WHERE q.course_id=? AND q.level=? 
        ORDER BY q.question_number ASC
      `);
      
      // Validate statement
      if (!allQuestionsStmt) {
        console.error('Failed to prepare all questions statement');
        return res.status(500).json({ error: 'Database error' });
      }
      
      rows = allQuestionsStmt.all(course_id, level);
      console.log(`API: Found ${rows.length} questions from all uploads for course_id="${course_id}", level="${level}"`);
    }
    
    console.log(`API: Found ${rows.length} questions`)
    
    // Validate that we have data
    if (!rows) {
      console.warn(`API: Database query returned null for course_id="${course_id}", level="${level}"`)
      return res.json([])
    }
    
    if (rows.length === 0) {
      console.warn(`API: No questions found for course_id="${course_id}", level="${level}"`)
      // Log what course_ids and levels we do have
      const courseLevels = db.prepare(`
        SELECT DISTINCT course_id, level FROM quiz_questions
      `).all();
      console.log('API: Available course_id/level combinations:', courseLevels);
      return res.json([])
    }
    
    const mapped = rows.map(r => {
      try {
        // Validate row data
        if (!r) {
          console.warn('Encountered null row in results');
          return null;
        }
        
        // Build image URL if exists
        let imageUrl = r.image_url || null
        // If it's not a data URL and not an http URL, construct the API endpoint
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          // For relative paths, construct the proper API endpoint
          // Extract the filename from the path
          const fileName = path.basename(imageUrl);
          imageUrl = `/api/images/${encodeURIComponent(course_id)}/${encodeURIComponent(level)}/${encodeURIComponent(fileName)}`
        }
        
        // Parse JSON fields safely
        let options = [];
        try {
          options = JSON.parse(r.options_json || '[]');
        } catch (parseError) {
          console.warn('Failed to parse options_json for question:', r.id, parseError.message);
          options = [];
        }
        
        let tables = null;
        try {
          tables = r.tables_json ? JSON.parse(r.tables_json) : null;
        } catch (parseError) {
          console.warn('Failed to parse tables_json for question:', r.id, parseError.message);
          tables = null;
        }
        
        let mathExpressions = null;
        try {
          mathExpressions = r.math_expressions_json ? JSON.parse(r.math_expressions_json) : null;
        } catch (parseError) {
          console.warn('Failed to parse math_expressions_json for question:', r.id, parseError.message);
          mathExpressions = null;
        }
        
        return {
          id: r.id,
          question_number: r.question_number,
          question_text: r.question_text || '',
          options: options,
          correct_answer: r.correct_answer,
          explanation: r.explanation || '',
          question_type: r.question_type || 'mcq',
          image_url: imageUrl,
          tables: tables,
          math_expressions: mathExpressions,
          documentName: r.documentName || '',  // Added document name
          documentSize: r.documentSize || 0   // Added document size
        }
      } catch (mapError) {
        console.error('Error mapping question data:', mapError)
        // Return a safe fallback
        return {
          id: r?.id || 'unknown',
          question_number: r?.question_number || 0,
          question_text: r?.question_text || '',
          options: [],
          correct_answer: -1,
          explanation: r?.explanation || '',
          question_type: 'mcq',
          image_url: null,
          tables: null,
          math_expressions: null,
          documentName: r?.documentName || '',
          documentSize: r?.documentSize || 0
        }
      }
    }).filter(q => q !== null); // Remove any null entries

    console.log(`API: Returning ${mapped.length} questions`)
    res.json(mapped)
  } catch (e) {
    console.error('Fetch questions error:', e)
    console.error('Fetch questions error stack:', e.stack)
    res.status(500).json({ error: 'Failed to fetch questions: ' + e.message })
  }
})

// Update a single question
app.put('/api/questions/:id', (req, res) => {
  const { id } = req.params
  const { question_text, options, correct_answer, explanation, question_type, image_url } = req.body
  
  try {
    const update = db.prepare(`
      UPDATE quiz_questions 
      SET question_text=?, options_json=?, correct_answer=?, explanation=?, question_type=?, image_url=?
      WHERE id=?
    `)
    
    update.run(
      question_text,
      JSON.stringify(options || []),
      correct_answer !== undefined ? correct_answer : -1,
      explanation || '',
      question_type || 'mcq',
      image_url || null,
      id
    )
    
    const updated = db.prepare(`SELECT * FROM quiz_questions WHERE id=?`).get(id)
    res.json({ success: true, question: updated })
  } catch (error) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Upload image for a question
app.post('/api/upload-question-image', upload.single('image'), async (req, res) => {
  try {
    const { course_id, level } = req.body
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }
    
    // Move image to course/level directory
    const courseLevelDir = path.join(STORAGE_ROOT, course_id, level)
    fs.mkdirSync(courseLevelDir, { recursive: true })
    
    const imageFileName = `question_${Date.now()}${path.extname(req.file.originalname)}`
    const imagePath = path.join(courseLevelDir, imageFileName)
    
    // Move from temp to final location
    fs.renameSync(req.file.path, imagePath)
    
    // Return relative path for database storage
    const relativeImagePath = path.relative(STORAGE_ROOT, imagePath).replace(/\\/g, '/')
    const imageUrl = `/api/images/${encodeURIComponent(course_id)}/${encodeURIComponent(level)}/${imageFileName}`
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      imagePath: relativeImagePath
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Delete a single question
app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params
  
  try {
    db.prepare(`DELETE FROM quiz_questions WHERE id=?`).run(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// Serve images for questions
app.get('/api/images/:courseId/:level/:imageName', (req, res) => {
  const { courseId, level, imageName } = req.params
  try {
    // Decode the image name in case it was encoded
    const decodedImageName = decodeURIComponent(imageName);
    const imagePath = path.join(STORAGE_ROOT, courseId, level, decodedImageName)
    if (fs.existsSync(imagePath)) {
      // Determine content type based on extension
      const ext = path.extname(decodedImageName).toLowerCase()
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
      }
      const contentType = contentTypes[ext] || 'application/octet-stream'
      res.setHeader('Content-Type', contentType)
      res.sendFile(path.resolve(imagePath))
    } else {
      // Try without the course/level structure for legacy images
      const legacyImagePath = path.join(STORAGE_ROOT, decodedImageName)
      if (fs.existsSync(legacyImagePath)) {
        const ext = path.extname(decodedImageName).toLowerCase()
        const contentTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp'
        }
        const contentType = contentTypes[ext] || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        res.sendFile(path.resolve(legacyImagePath))
      } else {
        console.warn(`Image not found: ${imagePath} or ${legacyImagePath}`)
        res.status(404).json({ error: 'Image not found' })
      }
    }
  } catch (error) {
    console.error('Error serving image:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
})

// Delete all uploads/questions for a course
app.delete('/api/courses/:courseId/uploads', (req, res) => {
  const { courseId } = req.params
  const uploads = db.prepare(`SELECT * FROM quiz_uploads WHERE course_id=?`).all(courseId)
  for (const u of uploads) {
    const abs = path.join(STORAGE_ROOT, u.file_path)
    try { if (fs.existsSync(abs)) fs.unlinkSync(abs) } catch {}
  }
  db.prepare(`DELETE FROM quiz_uploads WHERE course_id=?`).run(courseId)
  db.prepare(`DELETE FROM quiz_questions WHERE course_id=?`).run(courseId)
  res.json({ success: true })
})

// Debug endpoint to check all course data
app.get('/api/debug/courses', (req, res) => {
  try {
    // Get all courses from localStorage (simulated)
    const localStorageCourses = [];
    
    // Get all uploads
    const uploads = db.prepare(`SELECT * FROM quiz_uploads ORDER BY uploaded_at DESC`).all();
    
    // Get all questions
    const questions = db.prepare(`SELECT * FROM quiz_questions`).all();
    
    // Get distinct course_id/level combinations
    const courseLevels = db.prepare(`
      SELECT DISTINCT course_id, level FROM quiz_questions
    `).all();
    
    res.json({
      uploads: uploads,
      questions: questions.length,
      courseLevels: courseLevels,
      localStorageCourses: localStorageCourses
    });
  } catch (e) {
    console.error('Debug error:', e);
    res.status(500).json({ error: 'Debug failed: ' + e.message });
  }
});

// Debug endpoint to check specific course
app.get('/api/debug/course/:courseId', (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Get uploads for this course
    const uploads = db.prepare(`SELECT * FROM quiz_uploads WHERE course_id=? ORDER BY uploaded_at DESC`).all(courseId);
    
    // Get questions for this course
    const questions = db.prepare(`SELECT * FROM quiz_questions WHERE course_id=?`).all(courseId);
    
    res.json({
      courseId: courseId,
      uploads: uploads,
      questions: questions,
      questionCount: questions.length
    });
  } catch (e) {
    console.error('Debug error:', e);
    res.status(500).json({ error: 'Debug failed: ' + e.message });
  }
});

const PORT = process.env.PORT || 5179
app.listen(PORT, () => {
  console.log(`SQL API listening on http://localhost:${PORT}`)
})



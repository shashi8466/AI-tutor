# Complete Quiz System Flow

This document explains the complete flow of the quiz system from admin document upload to student quiz viewing.

## 🧩 System Architecture Overview

```
Admin Uploads .docx → Backend Parses to HTML → Converts to JSON → Stores in Database → Student Views Quiz
```

## 🧑‍💼 STEP 1: Admin Uploads Document

### Component: SimpleDocxUploader.jsx

The admin uploads a document file (.docx, .pdf, .txt, or .zip) through a React component:

```jsx
// SimpleDocxUploader.jsx (simplified)
const handleUpload = async () => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('course_id', 'demo_course');
  formData.append('level', 'Easy');

  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
  });
};
```

### Backend Processing

When the file is uploaded:
1. Server receives the file via `/api/uploads` endpoint
2. File is stored in the `server/storage/quiz-docs` directory
3. Document is immediately parsed by the QuizParser
4. Questions are extracted and stored in SQLite database

## 🌐 STEP 2: Backend Parsing Engine

### Technologies Used
- **Node.js + Express** for the backend server
- **Mammoth.js** for .docx to HTML conversion
- **pdf-parse** for PDF text extraction
- **cheerio** for HTML parsing
- **adm-zip** for handling ZIP archives

### Parsing Process

```js
// server/quizParser.js (simplified)
async parseDocument(filePath, courseId, level) {
  if (fileExt === '.docx') {
    // Convert DOCX to HTML with embedded images
    const result = await mammoth.convertToHtml({ path: filePath });
    const html = result.value;
    text = this.extractHtmlVisibleText(html);
  }
  
  // Parse text into structured questions
  let questions = this.parseTextToQuestions(text);
  
  // Enrich with tables and math expressions
  questions = this.enrichQuestionsWithTablesAndMath(questions, html);
  
  return questions;
}
```

### Database Storage

Parsed questions are stored in SQLite:
- **quiz_uploads** table stores file metadata
- **quiz_questions** table stores individual questions

## 🎓 STEP 3: Student Views Quiz

### Component: SimpleQuizViewer.jsx

Students view quizzes through a React component that fetches from the API:

```jsx
// SimpleQuizViewer.jsx (simplified)
useEffect(() => {
  fetchQuiz();
}, []);

const fetchQuiz = async () => {
  const response = await fetch('/api/questions?course_id=demo_course&level=Easy');
  const data = await response.json();
  setQuiz({ title: 'Demo Quiz', questions: data });
};
```

### Features Supported

1. **Multiple Choice Questions** with options
2. **Mathematical Expressions** rendered with MathJax
3. **Tables** from documents
4. **Images** embedded in questions
5. **Instant Feedback** on answers

## ✅ Complete Feature Checklist

| Feature | Status | Description |
|---------|--------|-------------|
| Admin uploads .docx | ✅ | File upload component |
| File stored in storage | ✅ | Server-side file storage |
| Backend parses to HTML | ✅ | Mammoth.js for DOCX conversion |
| Converts to structured JSON | ✅ | Text parsing to questions |
| Stores quiz in database | ✅ | SQLite storage |
| Student views quiz | ✅ | React quiz viewer |
| Supports images | ✅ | Base64 embedded images |
| Supports tables | ✅ | HTML table extraction |
| Supports math expressions | ✅ | MathJax rendering |

## 🧪 Testing the System

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000/demo
3. Use the admin panel to upload documents
4. Use the student panel to view quizzes

## 📁 File Structure

```
src/
├── components/
│   ├── admin/
│   │   └── SimpleDocxUploader.jsx
│   ├── student/
│   │   └── SimpleQuizViewer.jsx
│   └── DemoSystem.jsx
├── App.jsx (with /demo route)
server/
├── index.js (Express server)
├── quizParser.js (Document parser)
├── storage/quiz-docs/ (File storage)
└── data.sqlite (SQLite database)
```

## 🚀 How to Run

1. Install dependencies: `npm install`
2. Install parsing libraries: `npm install mammoth pdf-parse adm-zip cheerio --legacy-peer-deps`
3. Start the server: `npm run dev`
4. Visit http://localhost:3000/demo

## 🔧 API Endpoints

- `POST /api/uploads` - Upload and parse documents
- `GET /api/questions?course_id=:id&level=:level` - Get quiz questions
- `GET /api/uploads?course_id=:id` - List uploaded documents

This complete system demonstrates the full flow from document upload to quiz presentation, handling various file formats and complex content types.
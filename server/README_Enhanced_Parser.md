# Enhanced DOCX Quiz Parser

## Overview

The `QuizParserEnhanced` class is a robust DOCX quiz extraction system that follows exact extraction rules for converting DOCX files into structured JSON format.

## Features

### ✅ Extraction Capabilities

1. **Topic Extraction**
   - Identifies the first heading before each question
   - Defaults to "General" if no topic is found
   - Supports multi-word topics with ampersands (e.g., "Geometry & Trigonometry")

2. **Question Extraction**
   - Preserves all formatting (text, inline math, block equations)
   - Handles bold, italic, tables, and images
   - Maintains original structure and content

3. **Image Processing**
   - Extracts images from DOCX files
   - Saves as PNG/JPG files in organized directory structure
   - Replaces image references with URLs in JSON output

4. **Options Classification**
   - **MCQ**: 2-4 options (A, B, C, D)
   - **SHORT_ANSWER**: Direct answer with no options displayed
   - Never shows more than 4 options

5. **Answer Extraction**
   - Supports multiple patterns:
     - "Correct Answer: C"
     - "Answer: B" 
     - "Ans: x = 25"
     - "Solution: ..."

6. **Explanation Extraction**
   - Captures everything after "Explanation:" or "Solution:"
   - Preserves text, images, equations, and tables

## JSON Output Structure

### MCQ Questions
```json
{
  "topic": "Geometry & Trigonometry",
  "question": "The area of a rectangle is 2400 cm². The width is 80 cm. What is the length?",
  "image": "https://your-storage/image1.png",
  "options": [
    "25 cm",
    "30 cm", 
    "40 cm",
    "50 cm"
  ],
  "correct_answer": "30 cm",
  "explanation": "Length = Area / Width = 2400 / 80 = 30 cm.",
  "type": "MCQ"
}
```

### SHORT_ANSWER Questions
```json
{
  "topic": "Algebra",
  "question": "Solve: 5x – 2 = 18",
  "image": null,
  "options": [],
  "correct_answer": "4",
  "explanation": "5x = 20 → x = 4",
  "type": "SHORT_ANSWER"
}
```

## Usage

### Basic Usage
```javascript
import QuizParserEnhanced from './quizParserEnhanced.js';

const parser = new QuizParserEnhanced();
const questions = await parser.parseDocument(
  'path/to/quiz.docx',
  'course123',
  'intermediate'
);

console.log('Extracted questions:', questions);
```

### Integration with Express.js
```javascript
import express from 'express';
import QuizParserEnhanced from './quizParserEnhanced.js';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });
const parser = new QuizParserEnhanced();

app.post('/api/upload-quiz', upload.single('docx'), async (req, res) => {
  try {
    const { courseId, level } = req.body;
    const questions = await parser.parseDocument(
      req.file.path,
      courseId,
      level
    );
    
    res.json({
      success: true,
      questions: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Student Display Flow

The extracted JSON supports the following student display flow:

### Step 1: Show Topic
```
Topic: Geometry & Trigonometry
```

### Step 2: Show Question
- Full text with formatting
- Images (if any)
- Equations and tables

### Step 3: Show Options (MCQ only)
```
A) 25 cm
B) 30 cm
C) 40 cm
D) 50 cm
```

### Step 4: Student Submission
Student selects answer and submits

### Step 5: Show Correct Answer & Explanation
```
Correct Answer: B) 30 cm

Explanation:
Length = Area / Width
2400 / 80 = 30 cm
```

## File Structure

After parsing, images are organized as:
```
public/
  images/
    quiz/
      {courseId}/
        quiz_{courseId}_{timestamp}_{index}.png
        quiz_{courseId}_{timestamp}_{index}.jpg
```

## Error Handling

The parser includes comprehensive error handling:
- File format validation (only .docx supported)
- Image processing errors
- Malformed question detection
- Missing required field validation

## Testing

Run the test suite:
```bash
node server/testEnhancedParser.js
```

The test validates:
- Correct JSON structure
- Topic detection
- Question type classification
- Answer extraction
- Explanation parsing

## Dependencies

- `mammoth` - DOCX to HTML conversion
- `cheerio` - HTML parsing and manipulation
- `adm-zip` - ZIP archive handling
- `fs` - File system operations
- `path` - Path utilities
- `crypto` - For generating unique filenames

## Configuration

The parser works out of the box with default settings. Customization options include:

- Image storage directory
- Topic detection patterns
- Answer extraction patterns
- Question number formats

## Performance

- Handles large DOCX files efficiently
- Processes images in parallel when possible
- Memory-optimized for batch processing
- Supports concurrent parsing operations

## Security

- Validates file types before processing
- Sanitizes image filenames
- Prevents directory traversal attacks
- Handles malformed files gracefully

# Quiz Parser Usage Guide

## Overview

This project includes an improved quiz parser (`QuizParserImproved`) that addresses all the issues identified in the original parser. The improved parser provides better handling of:

- Question text extraction
- Option parsing
- Image handling
- Mathematical expressions
- Question type classification
- Table-based options

## Installation

The improved parser is already integrated into the system. No additional installation is required.

## Usage

### Server-side Usage

The server automatically uses the improved parser for all document uploads. When a document is uploaded through the `/api/uploads` endpoint, the server will:

1. Parse the document using `QuizParserImproved`
2. Extract questions, options, images, and mathematical expressions
3. Store the parsed data in the database

### Direct Usage

To use the parser directly in your code:

```javascript
import QuizParserImproved from './server/quizParserImproved.js';

const parser = new QuizParserImproved();
const questions = await parser.parseDocument(filePath, courseId, level);
```

### Supported Document Formats

The parser supports the following document formats:
- `.docx` (Word documents)
- `.pdf` (PDF documents)
- `.txt` (Plain text)
- `.zip` (Archives containing any of the above)

## Features

### Question Text Extraction

The parser correctly extracts question text, even when it contains:
- Mathematical expressions
- Complex formatting
- References to images or tables

### Option Parsing

Options are parsed from multiple sources:
- Standard lettered options (A), B), C), D))
- Bullet lists
- Table cells
- Malformed options are automatically corrected

### Image Handling

Images are handled in several ways:
- Embedded images in DOCX files are extracted as base64
- Image references like `{image1.png}` are parsed
- Images are linked to the correct questions
- Image URLs are properly resolved

### Mathematical Expressions

Mathematical content is preserved and properly formatted:
- Fractions, roots, exponents
- Greek letters and special symbols
- Complex equations
- Function definitions

### Question Type Classification

Questions are automatically classified:
- **Multiple Choice (mcq)**: 2 or more options
- **Short Answer (short_answer)**: 0-1 options or numeric answers
- **Image Based**: Questions with associated images

### Table Support

Table-based questions are properly handled:
- Table content is extracted and structured
- Tables are linked to the correct questions
- Table data is stored for frontend rendering

## Testing

To test the parser, run:

```bash
node server/testParser.js
```

This will run a comprehensive test with various question formats and output the parsed results.

## Integration with Existing System

The improved parser is a drop-in replacement for the original parser. The server has been updated to use the new parser automatically, so no changes are needed to the frontend or database schema.

## Troubleshooting

### Common Issues

1. **Questions missing text**: This is normal for image-based questions where the image provides the context
2. **Options not detected**: Ensure options follow standard formats (A), B), etc.)
3. **Math not rendering**: Check that MathJax is properly configured in the frontend

### Debugging

To enable debug output, set the environment variable:

```bash
DEBUG=quiz-parser node server.js
```

This will provide detailed information about the parsing process.

## Customization

The parser can be customized by modifying the patterns in the constructor:

```javascript
const parser = new QuizParserImproved();
// Modify patterns as needed
parser.patterns.questionNumber = // your custom pattern
```

## Support

For issues with the parser, check the console output for detailed error messages. The parser includes comprehensive logging to help diagnose parsing issues.
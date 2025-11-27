import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { load as loadHtml } from 'cheerio';
import crypto from 'crypto';

/**
 * Enhanced Quiz Parser for extracting structured questions from .docx files
 * Follows exact extraction rules as specified:
 * 1. Extract Topic (first heading before question)
 * 2. Extract Question (text, math, formatting, tables, images)
 * 3. Extract Images (save and replace with URLs)
 * 4. Extract Options (MCQ vs SHORT_ANSWER classification)
 * 5. Extract Correct Answer
 * 6. Extract Explanation
 */
class QuizParserEnhanced {
  constructor() {
    this.patterns = {
      // Topic detection - first heading before question
      topic: /^[A-Z][a-zA-Z\s&]+(?:\s+[A-Z][a-zA-Z\s&]+)*$/,
      
      // Question number patterns
      questionNumber: /^(?:Q\.?\s*)?(\d+)[\.\):]\s*(.*)$/i,
      
      // Multiple choice options patterns
      option: /^\s*([A-D])[\.\)\:\-\s]+(.+)$/i,
      
      // Answer patterns - comprehensive
      answer: /^(?:Correct\s+Answer|Answer|Ans|Solution|Key)\s*[:\-]?\s*([A-D0-9][\.\)\:]?\s*.*)$/i,
      
      // Explanation patterns
      explanation: /^(?:Explanation|Reason|Solution\s+Explanation|Exp|Solution)\s*[:\-]?\s*(.+)$/i,
    };
    
    // Storage for extracted images
    this.extractedImages = new Map();
    this.imageCounter = 0;
    
    // Topic tracking
    this.currentTopic = "General";
  }

  /**
   * Parse a DOCX document and extract quiz questions
   * @param {string} filePath - Path to the DOCX file
   * @param {string} courseId - Course identifier
   * @param {string} level - Difficulty level
   * @returns {Promise<Array>} Array of parsed questions in exact JSON format
   */
  async parseDocument(filePath, courseId, level) {
    try {
      console.log(`Parsing DOCX document: ${filePath}`);
      
      // Reset state for new document
      this.extractedImages.clear();
      this.imageCounter = 0;
      this.currentTopic = "General";
      
      const fileExt = path.extname(filePath).toLowerCase();
      if (fileExt !== '.docx') {
        throw new Error(`Only DOCX files are supported. Got: ${fileExt}`);
      }

      // Extract HTML with images embedded as base64 data URLs
      const result = await mammoth.convertToHtml(
        { path: filePath },
        {
          convertImage: mammoth.images.inline((element) => {
            return element.read("base64").then((imageBuffer) => {
              return {
                src: `data:${element.contentType};base64,${imageBuffer}`,
              };
            });
          }),
        }
      );
      
      const html = result.value || '';
      console.log(`Extracted HTML length: ${html.length} characters`);
      
      // Extract and save images, replace with URLs
      const processedHtml = await this.processImages(html, courseId);
      
      // Extract structured content from HTML
      const questions = this.extractQuestionsFromHtml(processedHtml);
      
      console.log(`Extracted ${questions.length} questions`);
      
      return questions;
      
    } catch (error) {
      console.error(`Error parsing DOCX document ${filePath}:`, error);
      throw new Error(`Failed to parse DOCX document: ${error.message}`);
    }
  }

  /**
   * Process images in HTML - save them and replace with URLs
   * @param {string} html - HTML content with embedded base64 images
   * @param {string} courseId - Course ID for organizing images
   * @returns {Promise<string>} HTML with image URLs
   */
  async processImages(html, courseId) {
    const $ = loadHtml(html);
    const processedHtml = html;
    
    // Create images directory if it doesn't exist
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'quiz', courseId);
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // Process each image
    $('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      if (src.startsWith('data:image/')) {
        try {
          // Extract image data
          const matches = src.match(/^data:(image\/\w+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const imageType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Generate filename
            const extension = imageType.split('/')[1] || 'png';
            const filename = `quiz_${courseId}_${Date.now()}_${this.imageCounter++}.${extension}`;
            const filePath = path.join(imagesDir, filename);
            
            // Save image file
            fs.writeFileSync(filePath, buffer);
            
            // Create URL (adjust based on your server setup)
            const imageUrl = `/images/quiz/${courseId}/${filename}`;
            
            // Store image info
            this.extractedImages.set(filename, {
              url: imageUrl,
              path: filePath,
              type: imageType,
              size: buffer.length
            });
            
            // Replace src in HTML
            $(img).attr('src', imageUrl);
            $(img).attr('data-processed', 'true');
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    });
    
    return $.html();
  }

  /**
   * Extract questions from processed HTML
   * @param {string} html - Processed HTML content
   * @returns {Array} Array of question objects
   */
  extractQuestionsFromHtml(html) {
    const $ = loadHtml(html);
    const questions = [];
    
    // Get all text content while preserving structure
    const textContent = this.extractStructuredText($);
    const lines = textContent.split('\n').filter(line => line.trim() !== '');
    
    let currentQuestion = null;
    let questionTextLines = [];
    let options = [];
    let explanationLines = [];
    let inExplanation = false;
    let currentTopic = "General";
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (!line) continue;
      
      // Check for topic (heading before first question or before new question)
      if (this.isTopicLine(line)) {
        // If we have a current question, topic change means we should finish it
        if (currentQuestion) {
          this.finalizeQuestion(currentQuestion, questionTextLines, options, explanationLines, currentTopic);
          questions.push(currentQuestion);
          currentQuestion = null;
        }
        currentTopic = line;
        continue;
      }
      
      // Check for question number
      const questionMatch = line.match(this.patterns.questionNumber);
      if (questionMatch) {
        // Finalize previous question
        if (currentQuestion) {
          this.finalizeQuestion(currentQuestion, questionTextLines, options, explanationLines, currentTopic);
          questions.push(currentQuestion);
        }
        
        // Start new question
        const qNum = parseInt(questionMatch[1]);
        const textAfterNumber = questionMatch[2] || '';
        
        currentQuestion = {
          topic: currentTopic,
          question: '',
          image: null,
          options: [],
          correct_answer: '',
          explanation: '',
          type: 'MCQ'
        };
        
        questionTextLines = textAfterNumber ? [textAfterNumber] : [];
        options = [];
        explanationLines = [];
        inExplanation = false;
        
        continue;
      }
      
      // If no current question, skip
      if (!currentQuestion) continue;
      
      // Check for explanation (only if we haven't started explanation yet)
      if (!inExplanation) {
        const explanationMatch = line.match(this.patterns.explanation);
        if (explanationMatch) {
          inExplanation = true;
          explanationLines = [explanationMatch[1]];
          continue;
        }
      }
      
      // Check for answer (only if not in explanation)
      if (!inExplanation) {
        const answerMatch = line.match(this.patterns.answer);
        if (answerMatch) {
          const answerText = answerMatch[1].trim();
          // Extract just the answer part (remove extra text)
          const cleanAnswer = this.extractCleanAnswer(answerText);
          currentQuestion.correct_answer = cleanAnswer;
          continue;
        }
      }
      
      // Check for option (only if not in explanation)
      if (!inExplanation) {
        const optionMatch = line.match(this.patterns.option);
        if (optionMatch) {
          const optionLetter = optionMatch[1];
          const optionText = optionMatch[2].trim();
          options.push(optionText);
          continue;
        }
      }
      
      // Handle continuation lines
      if (inExplanation) {
        // Only add to explanation if it doesn't look like a new topic or question
        if (!this.isTopicLine(line) && !line.match(this.patterns.questionNumber)) {
          explanationLines.push(line);
        }
      } else if (options.length > 0) {
        // Continuation of last option
        if (options.length > 0) {
          options[options.length - 1] += ' ' + line;
        }
      } else {
        // Question text
        questionTextLines.push(line);
      }
    }
    
    // Finalize last question
    if (currentQuestion) {
      this.finalizeQuestion(currentQuestion, questionTextLines, options, explanationLines, currentTopic);
      questions.push(currentQuestion);
    }
    
    return questions;
  }

  /**
   * Check if a line is a topic heading
   * @param {string} line - Line to check
   * @returns {boolean} True if it's a topic line
   */
  isTopicLine(line) {
    // Topic lines are typically:
    // 1. Short (under 80 chars)
    // 2. Start with capital letter
    // 3. Don't end with question mark
    // 4. Don't look like a question (no question words)
    // 5. Contain topic keywords
    
    const topicKeywords = [
      'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability',
      'Math', 'Mathematics', 'Problem Solving', 'Data Analysis', 'Functions',
      'Equations', 'Graphs', 'Numbers', 'Operations', 'Measurement'
    ];
    
    const questionWords = ['what', 'which', 'how', 'when', 'where', 'why', 'find', 'calculate', 'solve'];
    const answerIndicators = ['answer', 'ans', 'solution', 'correct', 'key'];
    
    // Must be short and start with capital
    if (line.length > 80 || !/^[A-Z]/.test(line) || line.endsWith('?')) {
      return false;
    }
    
    // Must not contain question words or answer indicators
    if (questionWords.some(word => line.toLowerCase().includes(word)) ||
        answerIndicators.some(word => line.toLowerCase().includes(word))) {
      return false;
    }
    
    // Must contain at least one topic keyword
    if (!topicKeywords.some(keyword => line.includes(keyword))) {
      return false;
    }
    
    // Additional checks for common topic patterns
    const topicPatterns = [
      /^[A-Z][a-zA-Z\s&]+(?:\s+[A-Z][a-zA-Z\s&]+)*$/,  // Multiple words with capitals
      /^[A-Z][a-zA-Z\s]+(?:&\s+[A-Z][a-zA-Z\s]+)*$/,    // With ampersand
      /^[A-Z][a-zA-Z\s,]+(?:and\s+[A-Z][a-zA-Z\s]+)*$/ // With "and"
    ];
    
    return topicPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract clean answer from answer text
   * @param {string} answerText - Raw answer text
   * @returns {string} Clean answer
   */
  extractCleanAnswer(answerText) {
    // Remove answer prefixes and extract just the answer
    const cleanText = answerText
      .replace(/^(Correct\s+Answer|Answer|Ans|Solution|Key)\s*[:\-]?\s*/i, '')
      .trim();
    
    // If it's a letter answer (A, B, C, D), return just the letter
    if (/^[A-D]$/i.test(cleanText)) {
      return cleanText.toUpperCase();
    }
    
    // If it's letter with punctuation, clean it
    const letterMatch = cleanText.match(/^([A-D])[\.\)\:]?/i);
    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }
    
    // Return the cleaned text
    return cleanText;
  }

  /**
   * Finalize a question object
   * @param {Object} question - Question object to finalize
   * @param {Array} questionTextLines - Question text lines
   * @param {Array} options - Options array
   * @param {Array} explanationLines - Explanation lines
   * @param {string} topic - Topic
   */
  finalizeQuestion(question, questionTextLines, options, explanationLines, topic) {
    // Set topic
    question.topic = topic;
    
    // Set question text
    question.question = questionTextLines.join(' ').trim();
    
    // Extract images from question text
    const imageMatch = question.question.match(/\[IMAGE:\s*([^\]]+)\]/i);
    if (imageMatch) {
      question.image = imageMatch[1];
      // Remove image marker from question text
      question.question = question.question.replace(/\[IMAGE:[^\]]+\]/i, '').trim();
    } else {
      question.image = null;
    }
    
    // Set options and determine question type
    if (options.length >= 2) {
      question.options = options.slice(0, 4); // Never show more than 4 options
      question.type = 'MCQ';
    } else {
      question.options = [];
      question.type = 'SHORT_ANSWER';
    }
    
    // Set explanation
    question.explanation = explanationLines.join(' ').trim();
    
    // Validate question
    if (!question.question) {
      console.warn('Question missing text:', question);
    }
  }

  /**
   * Extract structured text from HTML while preserving formatting
   * @param {Object} $ - Cheerio object
   * @returns {string} Structured text
   */
  extractStructuredText($) {
    let text = '';
    
    $('body *').each((_, element) => {
      const $el = $(element);
      const tagName = element.tagName.toLowerCase();
      
      // Handle headings (potential topics)
      if (/^h[1-6]$/.test(tagName)) {
        const headingText = $el.text().trim();
        if (headingText) {
          text += '\n' + headingText + '\n';
        }
      }
      // Handle paragraphs
      else if (tagName === 'p') {
        const pText = $el.text().trim();
        if (pText) {
          text += pText + '\n';
        }
      }
      // Handle lists (potential options)
      else if (tagName === 'li') {
        const liText = $el.text().trim();
        if (liText) {
          text += liText + '\n';
        }
      }
      // Handle images
      else if (tagName === 'img') {
        const src = $el.attr('src') || '';
        const alt = $el.attr('alt') || '';
        if (src && !src.startsWith('data:image/')) {
          text += `[IMAGE: ${src}${alt ? ': ' + alt : ''}]\n`;
        }
      }
      // Handle tables
      else if (tagName === 'table') {
        const tableText = this.extractTableText($el);
        if (tableText) {
          text += tableText + '\n';
        }
      }
    });
    
    return text;
  }

  /**
   * Extract text from table
   * @param {Object} $table - Cheerio table object
   * @returns {string} Table text representation
   */
  extractTableText($table) {
    let tableText = '';
    
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = [];
      
      $row.find('td, th').each((_, cell) => {
        cells.push($(cell).text().trim());
      });
      
      if (cells.length > 0) {
        tableText += '| ' + cells.join(' | ') + ' |\n';
      }
    });
    
    return tableText;
  }

  /**
   * Validate a question object
   * @param {Object} question - Question to validate
   * @returns {boolean} True if valid
   */
  validateQuestion(question) {
    return question &&
           typeof question.topic === 'string' &&
           typeof question.question === 'string' &&
           question.question.trim().length > 0 &&
           Array.isArray(question.options) &&
           typeof question.type === 'string' &&
           ['MCQ', 'SHORT_ANSWER'].includes(question.type);
  }
}

export default QuizParserEnhanced;

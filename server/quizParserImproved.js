import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { load as loadHtml } from 'cheerio';

/**
 * Enhanced Quiz Parser for extracting structured questions from .docx, .pdf, and .zip files
 * Implements all fixes from the issue list:
 * 1. Better question text extraction
 * 2. Improved option parsing
 * 3. Proper image handling
 * 4. Math expression support
 * 5. Correct question type classification
 * 6. Table-based option support
 */
class QuizParserImproved {
  constructor() {
    // Enhanced patterns for better question detection
    this.patterns = {
      // Match question numbers like "Q.1)", "Q.2)", "Q1)", "1)", "2)", "Question 1:", etc.
      questionNumber: /^Q\.?(\d+)[\.\:)](?:\s+(.*))?$/i,
      
      // Match multiple choice options A), B), C), D) with flexible formats
      option: /^\s*([A-D0-9])[\.\)\:\-\s]+(.+)$/i,
      
      // Match answer indicators like "Answer:", "Correct Answer:", "Key:", etc.
      answer: /^(?:Ans(?:wer)?|Correct\s+Answer|Key|Solution)\s*[:\-]?\s*([A-D0-9])/i,
      
      // Match explanation indicators like "Explanation:", "Reason:", etc.
      explanation: /^(?:Explanation|Reason|Solution\s+Explanation|Exp)\s*[:\-]?\s*(.+)/i,
    };
    
    console.log('Question pattern:', this.patterns.questionNumber);
    
    // Enhanced patterns for robust parsing
    this.enhancedPatterns = {
      // Robust question detection patterns
      questionStart: /^(?:Q\.?\s*)?(\d+)[\.\:)]/i,
      
      // Enhanced option patterns for various formats
      optionFormats: [
        // Standard formats
        /^\s*([A-D0-9])[\.\)\:\-\s]+\s*(.+)$/i,  // A) option, 1. option
        /^\s*\(\s*([A-D0-9])\s*\)\s+(.+)$/i,     // (A) option
        /^\s*([A-D0-9])\.\s+(.+)$/i,              // A. option
        /^\s*([A-D0-9]):\s+(.+)$/i,               // A: option
        
        // Malformed options (like "0 B) C)")
        /^\s*(\d+)\s+([A-D])\)\s*([^A-D]*)$/i,   // 0 B) option
        
        // Bullet points
        /^[•*+-]\s*([A-D0-9][\.\)]?\s*)?(.+)$/i,  // • A) option
        
        // Table cells (for tabular options)
        /^\|?\s*([A-D0-9])\.?\s*\|\s*(.+?)\s*\|?$/i,  // | A | Option text |
        
        // Numbered options without punctuation
        /^\s*([A-D0-9])\s+(?![A-Za-z]+\.)(.+)$/i  // A  Option text
      ],
      
      // Patterns to clean up malformed options
      optionCleaners: [
        // Remove leading numbers (like in "0 B) option")
        { pattern: /^\d+\s+([A-D])\)?\s*(.*)/i, replace: '$1) $2' },
        
        // Fix missing closing parentheses
        { pattern: /^([A-D])\s+(?=\S)/i, replace: '$1) ' },
        
        // Remove extra spaces and normalize formatting
        { pattern: /\s+/g, replace: ' ' },
        { pattern: /^\s*[\-•*+]\s*/, replace: '' },
        { pattern: /^\s*\|\s*|\s*\|\s*$/g, replace: '' },
        { pattern: /^\s+|\s+$/g, replace: '' }
      ],
      
      // Math expression patterns - expanded to handle more complex cases
      mathPatterns: [
        // Fractions
        /\\(?:frac|dfrac)\s*\{([^}]+)\}\s*\{([^}]+)\}/g,  // \frac{a}{b} or \dfrac{a}{b}
        /(\d+)\s*\/\s*(\d+)/g,                             // Simple fractions like 3/5
        
        // Roots and powers
        /\\sqrt\s*(?:\[([^\]]+)\])?\s*\{?([^}\s]+)\}?/g,  // \sqrt[x]{y} or \sqrt{y}
        /([a-zA-Z0-9)\]}])\s*\^\s*([a-zA-Z0-9{]+)/g,         // x^2 or x^{n}
        
        // Common functions
        /\\(sin|cos|tan|log|ln|exp|sqrt|frac|lim|sum|prod|int)\b(?:\s*\[([^\]]+)\])?/g,
        
        // Equations and expressions
        /[a-zA-Z]\s*[=≠<>≈≤≥]\s*[a-zA-Z0-9+\-*/^√()\[\]{}.,;:!?]+/g,
        
        // Variables with coefficients and exponents
        /[0-9]*[a-zA-Z](?:\^[0-9]+)?/g,
        
        // Special math symbols and constants
        /[α-ωΑ-Ωπθ∞≈≠≤≥±×÷°]/g,
        
        // Function definitions like f(x) = ...
        /[a-zA-Z]\s*\([a-z]\)\s*=[^\n]+/g
      ],
      
      // Image reference patterns
      imageKeywords: [
        /figure|diagram|graph|image|picture|chart|table/i,
        /shown|depicted|illustrated|presented/i
      ]
    };
  }

  /**
   * Parse a document (.docx, .pdf, or .zip) and extract quiz questions
   * @param {string} filePath - Path to the document file
   * @param {string} courseId - Course identifier
   * @param {string} level - Difficulty level (Easy, Medium, Hard)
   * @returns {Promise<Array>} Array of parsed questions
   */
  async parseDocument(filePath, courseId, level) {
    try {
      console.log(`Parsing document: ${filePath}`);
      
      // Reset state for new document
      this.htmlTables = [];
      this.zipHtmlEntries = [];
      this.lastParsedHtml = null;
      this.images = [];
      
      const fileExt = path.extname(filePath).toLowerCase();
      let text = '';
      
      // Extract text based on file type
      if (fileExt === '.docx') {
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
        
        // Extract text from HTML for parsing, but preserve structure
        const html = result.value || '';
        text = this.extractHtmlVisibleText(html);
        
        // Also store HTML for later table/math extraction
        this.lastParsedHtml = html;
      } else if (fileExt === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfParseModule = await import('pdf-parse');
        const pdfData = await pdfParseModule.default(dataBuffer);
        text = this.normalizeWhitespace(pdfData.text || '');
      } else if (fileExt === '.zip') {
        // Extract and parse ZIP archive
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        
        console.log(`ZIP archive contains ${zipEntries.length} entries`);
        
        let foundSupportedFiles = false;
        
        for (const entry of zipEntries) {
          if (!entry.isDirectory) {
            const entryExt = path.extname(entry.entryName).toLowerCase();
            console.log(`Processing ZIP entry: ${entry.entryName} (${entryExt})`);
            
            let entryContent = '';
            
            if (entryExt === '.docx') {
              foundSupportedFiles = true;
              // Write temp file for mammoth
              const tempDir = path.join(path.dirname(filePath), '_temp');
              fs.mkdirSync(tempDir, { recursive: true });
              const tempPath = path.join(tempDir, entry.entryName);
              fs.writeFileSync(tempPath, entry.getData());
              
              // Extract HTML with images embedded as base64
              const result = await mammoth.convertToHtml(
                { path: tempPath },
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
              entryContent = this.extractHtmlVisibleText(html);
              
              // Store HTML for this entry if we need to extract tables/math later
              if (!this.zipHtmlEntries) this.zipHtmlEntries = [];
              this.zipHtmlEntries.push({ name: entry.entryName, html });
              
              // Cleanup temp file
              fs.unlinkSync(tempPath);
            } else if (entryExt === '.pdf') {
              foundSupportedFiles = true;
              const pdfParseModule = await import('pdf-parse');
              const pdfData = await pdfParseModule.default(entry.getData());
              entryContent = pdfData.text;
            } else if (entryExt === '.txt') {
              foundSupportedFiles = true;
              entryContent = this.normalizeWhitespace(entry.getData().toString('utf8'));
            } else if (entryExt === '.html' || entryExt === '.htm') {
              // Support HTML pages exported with an assets folder
              // Extract visible text content for parsing
              foundSupportedFiles = true;
              const html = entry.getData().toString('utf8');
              try {
                entryContent = this.extractHtmlVisibleText(html);
              } catch (e) {
                // If cheerio fails, fall back to a simple tag-stripper
                entryContent = this.normalizeWhitespace(html
                  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;/g, ' ') // common entity
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>'));
              }
            } else {
              console.log(`Skipping unsupported file type: ${entryExt}`);
            }
            
            if (entryContent) {
              text += '\n\n' + entryContent;
            }
          }
        }
        
        if (!foundSupportedFiles) {
          throw new Error('ZIP archive does not contain any supported files (.docx, .pdf, .txt)');
        }
      } else if (fileExt === '.txt') {
        text = fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error(`Unsupported file format: ${fileExt}`);
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Document appears to be empty or corrupted');
      }

      console.log(`Extracted text length: ${text.length} characters`);
      
      // Parse the text into structured questions
      let questions = this.parseTextToQuestions(text);
      
      console.log(`Parsed ${questions.length} questions from document`);
      
      // Enrich questions with tables and math expressions if HTML was parsed
      if (this.lastParsedHtml) {
        questions = this.enrichQuestionsWithTablesAndMath(questions, this.lastParsedHtml);
      } else if (this.zipHtmlEntries && this.zipHtmlEntries.length > 0) {
        // For ZIP files, enrich from all HTML entries
        this.zipHtmlEntries.forEach(({ html }) => {
          questions = this.enrichQuestionsWithTablesAndMath(questions, html);
        });
      }
      
      // Validate and clean questions
      const validQuestions = questions.filter(q => this.validateQuestion(q));
      
      console.log(`${validQuestions.length} valid questions after validation`);
      
      return validQuestions;
      
    } catch (error) {
      console.error(`Error parsing document ${filePath}:`, error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Enhanced question parsing with better text extraction
   */
  parseTextToQuestions(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const questions = [];
    let currentQuestion = null;
    let currentOptions = [];
    let explanationLines = [];
    let questionTextLines = [];
    let inOptions = false;
    let inExplanation = false;
    let imageUrl = null;
    let inOptionsBlock = false;
    let tableData = null;
    let pendingImageLine = null; // Store image line to add to next question text

    // Helper to detect category headers
    const isCategoryHeader = (line) => {
      const categoryKeywords = [
        'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability',
        'Area and volume', 'Linear equations', 'Nonlinear functions',
        'Equivalent expressions', 'Systems of', 'Ratios rates proportions'
      ];
      
      // Check if line matches category patterns
      const hasComma = line.includes(',');
      const endsWithCategory = /(and volume|and trigonometry|in one variable|in two variables|functions|expressions|proportions|circles|triangles)$/i.test(line);
      const startsWithCategory = /^(Geometry|Algebra|Advanced Math|Problem Solving|Data Analysis)/i.test(line);
      
      // If it's short and looks like a category header
      if (line.length < 120) {
        // If it starts with a category keyword and has a comma, it's likely a header
        if (startsWithCategory && hasComma) {
          return true;
        }
        // If it matches category pattern and ends with category phrase
        if (hasComma || endsWithCategory) {
          return true;
        }
        // If it's very short (less than 60 chars) and contains category keywords
        if (line.length < 60 && categoryKeywords.some(keyword => line.includes(keyword))) {
          return true;
        }
      }
      
      // Check if line is ONLY a category (no question-like content)
      if (line.length < 80 && !/[?]/.test(line) && !/[A-Z][a-z]+ [a-z]+ [a-z]+/.test(line)) {
        if (startsWithCategory) {
          return true;
        }
      }
      
      return false;
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for options block markers
      if (line.includes('[OPTIONS_START]')) {
        inOptionsBlock = true;
        inOptions = true;
        continue;
      }
      
      if (line.includes('[OPTIONS_END]')) {
        inOptionsBlock = false;
        inOptions = false;
        continue;
      }
      
      // Extract image markers first
      const imageMatch = line.match(/\[IMAGE[\s\:]+([^\]]+?)\]/i) || 
                        line.match(/\{([^\}]+?\.(?:png|jpg|jpeg|gif|svg|webp|bmp))\}/i) ||
                        line.match(/\[IMAGE:(.+?)(?::(.+?))?\]/i);
      if (imageMatch) {
        if (currentQuestion) {
          // If we have a current question, store the image for this question
          imageUrl = imageMatch[1];
        } else {
          // If no current question, store the image line to add to the next question
          pendingImageLine = line;
        }
        continue;
      }
      
      // Check for question number - this starts a NEW question
      // Use a more flexible pattern matching approach
      const questionMatch = line.match(/^(?:Q\.?\s*)?(\d+)[\.\:)](?:\s+(.*))?$/i) || 
                           line.match(/^Q\.?(\d+)[\.\:)]/i) ||
                           line.match(/^(\d+)[\.\:)]/);
      
      if (questionMatch) {
        // Finalize previous question if exists
        if (currentQuestion) {
          currentQuestion.question_text = questionTextLines.join(' ').trim();
          this.finalizeQuestion(currentQuestion, currentOptions, explanationLines, questions, imageUrl, tableData);
        }
        
        // Start new question
        const qNum = parseInt(questionMatch[1]);
        // For the flexible patterns, we might not have group 2, so extract text differently
        let textAfterNumber = '';
        if (questionMatch[2]) {
          textAfterNumber = questionMatch[2].trim();
        } else {
          // Extract text after the question marker
          const markerEnd = line.indexOf(questionMatch[0]) + questionMatch[0].length;
          textAfterNumber = line.substring(markerEnd).trim();
        }
        
        currentQuestion = {
          question_number: qNum,
          question_text: '',
          options: [],
          correct_answer: -1,
          explanation: '',
          question_type: 'mcq', // Will be updated based on options
          image_url: null
        };
        currentOptions = [];
        questionTextLines = [];
        inOptions = false;
        inExplanation = false;
        explanationLines = [];
        imageUrl = null;
        inOptionsBlock = false;
        tableData = null;
        
        // If we had a pending image line, add it to the question text
        if (pendingImageLine) {
          questionTextLines.push(pendingImageLine);
          pendingImageLine = null;
        }
        
        // If there's text after the question number, check if it's a category header
        if (textAfterNumber) {
          if (isCategoryHeader(textAfterNumber)) {
            // Skip category header - don't add to question text
          } else {
            // It's actual question text, add it
            questionTextLines.push(textAfterNumber);
          }
        }
        continue;
      }
      
      // If no current question, skip until we find one
      if (!currentQuestion) {
        continue;
      }
      
      // Check for explanation start (marks END of question content, start of explanation)
      const explanationMatch = line.match(this.patterns.explanation);
      if (explanationMatch) {
        // Start collecting explanation
        inExplanation = true;
        inOptions = false; // Explanation ends options
        explanationLines = [explanationMatch[1] || ''];
        continue;
      }
      
      // If we're collecting explanation, continue until next question
      if (inExplanation) {
        // Check if this line starts a new question (explanation ended)
        const nextQuestionMatch = line.match(/^(?:Q\.?\s*)?(\d+)[\.\:)](?:\s+(.*))?$/i) || 
                                 line.match(/^Q\.?(\d+)[\.\:)]/i) ||
                                 line.match(/^(\d+)[\.\:)]/);
        if (nextQuestionMatch) {
          // Finalize current question with all collected explanation lines
          currentQuestion.question_text = questionTextLines.join(' ').trim();
          this.finalizeQuestion(currentQuestion, currentOptions, explanationLines, questions, imageUrl, tableData);
          
          // Reset for new question
          currentOptions = [];
          questionTextLines = [];
          inOptions = false;
          inExplanation = false;
          explanationLines = [];
          imageUrl = null;
          inOptionsBlock = false;
          tableData = null;
          pendingImageLine = null;
          
          // Process this line as the start of a new question
          const qNum = parseInt(nextQuestionMatch[1]);
          let textAfterNumber = '';
          if (nextQuestionMatch[2]) {
            textAfterNumber = nextQuestionMatch[2].trim();
          } else {
            // Extract text after the question marker
            const markerEnd = line.indexOf(nextQuestionMatch[0]) + nextQuestionMatch[0].length;
            textAfterNumber = line.substring(markerEnd).trim();
          }
          
          currentQuestion = {
            question_number: qNum,
            question_text: '',
            options: [],
            correct_answer: -1,
            explanation: '',
            question_type: 'mcq',
            image_url: null
          };
          
          // Check if text after number is category header
          if (textAfterNumber) {
            if (!isCategoryHeader(textAfterNumber)) {
              questionTextLines.push(textAfterNumber);
            }
          }
          continue;
        } else {
          // Continue collecting explanation text
          explanationLines.push(line);
          continue;
        }
      }
      
      // Check for answer key
      const answerMatch = line.match(this.patterns.answer);
      if (answerMatch) {
        const answerLetter = answerMatch[1].toUpperCase();
        const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (answerIndex >= 0 && answerIndex < 4) {
          currentQuestion.correct_answer = answerIndex;
        }
        inOptions = false; // Answer ends option collection
        continue;
      }
      
      // Check for [OPTION] marker from HTML list extraction
      if (line.startsWith('[OPTION]')) {
        inOptions = true;
        const optionText = line.replace('[OPTION]', '').trim();
        if (optionText) {
          currentOptions.push({
            letter: String.fromCharCode(65 + currentOptions.length), // A, B, C, D
            text: optionText
          });
        }
        continue;
      }
      
      // Check for multiple choice option
      const optionMatch = line.match(this.patterns.option);
      if (optionMatch) {
        inOptions = true;
        
        // Extract option letter
        const optionLetter = optionMatch[1] ? optionMatch[1].toUpperCase() : String.fromCharCode(65 + currentOptions.length);
        const optionText = optionMatch[2] || '';
        
        currentOptions.push({
          letter: optionLetter,
          text: optionText
        });
        continue;
      }
      
      // Handle continuation lines based on current state
      if (inOptions && currentOptions.length > 0) {
        // Append to last option
        const lastOption = currentOptions[currentOptions.length - 1];
        lastOption.text += ' ' + line;
      } else {
        // We're not in options yet, so this is question text
        // Skip if it looks like a category header (can appear on its own line after question number)
        if (isCategoryHeader(line)) {
          // Skip this line - it's a category header
          continue;
        }
        
        // Also check if this might be an option that didn't match the pattern
        // This happens when options come after question text
        const looksLikeOptionStart = /^[A-D0-9][\.\)\-\:\s]/.test(line);
        if (looksLikeOptionStart) {
          // Try more flexible matching
          const flexOptionMatch = line.match(/^([A-D0-9])[\.\)\-\:\s]+(.+)$/i);
          if (flexOptionMatch) {
            inOptions = true;
            currentOptions.push({
              letter: flexOptionMatch[1].toUpperCase(),
              text: flexOptionMatch[2] || ''
            });
            continue;
          }
        }
        
        // If we have question text already, check if this line might be an option
        // This helps detect options that come after question text
        if (questionTextLines.length > 0 && !inOptionsBlock) {
          const trimmedLine = line.trim();
          
          // Check if this looks like it could be the start of options
          // Options often: start with capital, are statements (not questions), reasonable length
          const couldBeOption = trimmedLine.length >= 5 && 
                                trimmedLine.length <= 250 &&
                                /^[A-Z0-9]/.test(trimmedLine) &&
                                !trimmedLine.includes('?') &&
                                !trimmedLine.toLowerCase().match(/\b(what|which|how|explanation|answer|correct)\b/);
          
          if (couldBeOption && currentOptions.length === 0) {
            // This might be the first option - peek ahead to see if there are more
            let peekAheadOptions = 0;
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const peekLine = lines[j].trim();
              if (peekLine.length >= 5 && 
                  peekLine.length <= 250 &&
                  /^[A-Z0-9]/.test(peekLine) &&
                  !peekLine.includes('?') &&
                  !peekLine.toLowerCase().match(/\b(what|which|how|explanation|answer|correct)\b/)) {
                peekAheadOptions++;
              } else {
                break;
              }
            }
            
            // If we see 1-3 more potential options ahead, this is likely the start of options
            if (peekAheadOptions >= 1 && peekAheadOptions <= 3) {
              // Start treating subsequent lines as options
              inOptions = true;
              currentOptions.push({
                letter: String.fromCharCode(65 + currentOptions.length),
                text: trimmedLine
              });
              continue;
            }
          }
        }
        
        // Otherwise, it's question text
        questionTextLines.push(line);
      }
    }
    
    // Finalize the last question if exists
    if (currentQuestion) {
      currentQuestion.question_text = questionTextLines.join(' ').trim();
      this.finalizeQuestion(currentQuestion, currentOptions, explanationLines, questions, imageUrl, tableData);
    }
    
    return questions;
  }

  /**
   * Finalize a question object with options and explanation
   * @param {Object} question - Question object
   * @param {Array} options - Array of option objects
   * @param {Array} explanationLines - Array of explanation text lines
   * @param {Array} questions - Array to add the finalized question to
   * @param {string} imageUrl - Optional image URL
   * @param {Object} tableData - Optional table data
   */
  finalizeQuestion(question, options, explanationLines, questions, imageUrl, tableData) {
    // Process options
    if (options.length > 0) {
      // Clean and normalize options
      const cleanedOptions = options.map(opt => {
        // Remove any embedded question text that might have been included
        let cleanedText = opt.text ? opt.text.trim() : opt.trim();
        
        // Remove any leading option markers that might have been included
        cleanedText = cleanedText.replace(/^[A-D0-9][\.\)\:\-\s]+/, '').trim();
        
        return cleanedText;
      }).filter(opt => opt.length > 0);
      
      question.options = cleanedOptions;
      
      // Determine question type based on options
      if (cleanedOptions.length >= 2) {
        question.question_type = 'mcq';
      } else if (cleanedOptions.length === 1) {
        // Single option - could be short answer with a hint or a malformed MCQ
        // Check if the option looks like an answer (short, numeric, etc.)
        const optionText = cleanedOptions[0];
        if (/^[\d\-\+\.\s\/]+$/.test(optionText) || optionText.length < 20) {
          question.question_type = 'short_answer';
        } else {
          question.question_type = 'mcq';
        }
      } else {
        question.question_type = 'short_answer';
      }
    } else {
      // No options detected - treat as short answer
      question.question_type = 'short_answer';
    }
    
    // Set explanation
    question.explanation = explanationLines.join(' ').trim();
    
    // Set image URL
    if (imageUrl) {
      question.image_url = imageUrl;
    }
    
    // Set table data if available
    if (tableData) {
      question.tables = [tableData];
    }
    
    // Validate correct answer index for MCQ questions
    if (question.question_type === 'mcq' && question.options.length > 0) {
      if (question.correct_answer < 0 || question.correct_answer >= question.options.length) {
        // Default to first option if invalid
        question.correct_answer = 0;
      }
    } else if (question.question_type === 'short_answer') {
      // For short answer, correct_answer should be the expected answer text
      if (question.options.length > 0) {
        question.correct_answer = question.options[0];
      } else {
        question.correct_answer = '';
      }
    }
    
    // Add the question to our collection
    questions.push(question);
  }

  /**
   * Extract visible text, images, and tables from HTML using cheerio
   * Preserves question structure and extracts images/tables for later use
   */
  extractHtmlVisibleText(html) {
    const $ = loadHtml(html);
    
    // Remove unwanted elements
    $('script, style, noscript, header, footer, nav').remove();
    
    // Store tables and images for later extraction
    if (!this.htmlTables) this.htmlTables = [];
    if (!this.images) this.images = [];
    
    let extractedText = '';
    let tableIndex = 0;
    let imageIndex = 0;
    
    // Process each top-level element in body
    $('body').children().each((_, el) => {
      const $el = $(el);
      const tag = el.tagName?.toLowerCase?.() || '';
      
      // Skip empty elements and navigation
      if ($el.text().trim() === '' && $el.find('img, table').length === 0) {
        return;
      }
      
      // Handle tables - extract structure and add marker
      if (tag === 'table') {
        const tableId = `table-${tableIndex}`;
        const rows = [];
        let isOptionTable = false;
        
        // Check if this table contains options (common patterns)
        const tableText = $el.text().toLowerCase();
        isOptionTable = /(option|choice|select|a[\s\)\.]|b[\s\)\.]|c[\s\)\.]|d[\s\)\.])/i.test(tableText);
        
        $el.find('tr').each((ri, row) => {
          const cells = [];
          const $row = $(row);
          
          // Skip header rows that don't contain actual options
          if (ri === 0 && $row.find('th').length > 1) {
            return; // Skip header row
          }
          
          $row.find('td, th').each((ci, cell) => {
            const $cell = $(cell);
            let cellContent = '';
            
            // Handle images in table cells
            $cell.find('img').each((imgIdx, img) => {
              const $img = $(img);
              const src = $img.attr('src') || $img.attr('data-src') || '';
              if (src) {
                const alt = $img.attr('alt') || '';
                const imgId = `img-${imageIndex++}`;
                this.images.push({
                  id: imgId,
                  src: src,
                  alt: alt,
                  context: 'table-cell',
                  tableId: tableId,
                  row: ri,
                  col: ci
                });
                $img.replaceWith(`[IMAGE:${imgId}]`);
              }
            });
            
            // Process cell content
            cellContent = $cell.html() || '';
            
            // Handle math expressions
            cellContent = cellContent.replace(/(\${1,2}[^$]+\${1,2})/g, (match) => {
              return `[MATH:${match.replace(/\$/g, '')}]`;
            });
            
            cells.push({
              content: cellContent.trim(),
              rowspan: parseInt($cell.attr('rowspan') || '1'),
              colspan: parseInt($cell.attr('colspan') || '1')
            });
          });
          
          if (cells.length > 0) {
            rows.push({
              isHeader: ri === 0,
              cells: cells
            });
          }
        });
        
        if (rows.length > 0) {
          const tableData = {
            id: tableId,
            index: tableIndex,
            isOptionTable: isOptionTable,
            rows: rows
          };
          
          this.htmlTables.push(tableData);
          
          if (isOptionTable) {
            extractedText += '\n[OPTIONS_START]\n';
            // Format options from table
            rows.forEach((row, rowIdx) => {
              if (row.cells.length >= 2) {
                // First cell is option letter, second is text
                const optionLetter = row.cells[0].content.match(/^\s*([A-D0-9])/i)?.[1] || 
                                   String.fromCharCode(65 + rowIdx);
                const optionText = row.cells[1].content;
                extractedText += `${optionLetter}) ${optionText}\n`;
              }
            });
            extractedText += '[OPTIONS_END]\n';
          } else {
            extractedText += `\n[TABLE:${tableIndex}]\n`;
          }
          
          tableIndex++;
        }
        return; // Skip further processing for table
      }
      
      // Handle lists - these are often options in quiz questions
      if (tag === 'ul' || tag === 'ol') {
        const listItems = [];
        $el.find('li').each((liIdx, li) => {
          const $li = $(li);
          // Handle images in list items
          $li.find('img').each((imgIdx, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src') || '';
            if (src) {
              const alt = $(img).attr('alt') || '';
              $(img).replaceWith(`[IMAGE:${src}${alt ? ':' + alt : ''}]`);
            }
          });
          // Handle math expressions in list items
          const liHtml = $li.html() || '';
          const processedLiHtml = liHtml.replace(/(\${1,2}[^$]+\${1,2})/g, (match) => {
            return `[MATH:${match.replace(/\$/g, '')}]`;
          });
          const liText = processedLiHtml.trim();
          if (liText) {
            listItems.push(liText);
          }
        });
        
        // If we have 2-4 list items, they're likely options
        if (listItems.length >= 2 && listItems.length <= 4) {
          extractedText += '\n[OPTIONS_START]\n';
          listItems.forEach((liText, idx) => {
            // Check if it already has a letter/number prefix
            const optionMatch = liText.match(/^([A-D0-9])[\.\)\:\-\s]+(.+)$/i);
            if (optionMatch) {
              extractedText += `\n${optionMatch[1]}) ${optionMatch[2]}\n`;
            } else {
              // Assign letter/number based on position
              const letter = idx < 9 ? (idx + 1).toString() : String.fromCharCode(65 + idx - 9); // 1,2,3,4... or A,B,C,D...
              extractedText += `\n${letter}) ${liText}\n`;
            }
          });
          extractedText += '\n[OPTIONS_END]\n';
        } else {
          // Might still be options even if not 2-4, mark them
          listItems.forEach((liText) => {
            const optionMatch = liText.match(/^([A-D0-9])[\.\)\:\-\s]+(.+)$/i);
            if (optionMatch) {
              extractedText += `\n${optionMatch[1]}) ${optionMatch[2]}\n`;
            } else {
              extractedText += `\n[OPTION]${liText}\n`;
            }
          });
        }
        return; // Skip further processing for lists
      }
      
      // Handle images - add marker at the point where they appear
      $el.find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || '';
        if (src) {
          const alt = $(img).attr('alt') || '';
          $(img).replaceWith(`[IMAGE:${src}${alt ? ':' + alt : ''}]`);
        }
      });
      
      // Handle math expressions in general content
      const elHtml = $el.html() || '';
      const processedHtml = elHtml.replace(/(\${1,2}[^$]+\${1,2})/g, (match) => {
        return `[MATH:${match.replace(/\$/g, '')}]`;
      });
      $el.html(processedHtml);
      
      // Get text content while preserving structure
      // For paragraphs, preserve them as separate lines to help with option detection
      if (tag === 'p') {
        const pText = $el.text().trim();
        if (pText) {
          // Check if paragraph looks like an option (starts with A-D/1-9) or is a short statement
          const optionMatch = pText.match(/^([A-D0-9])[\.\)\:\-\s]+(.+)$/i);
          if (optionMatch) {
            extractedText += `\n${optionMatch[1]}) ${optionMatch[2]}\n`;
          } else {
            // Regular paragraph - add with line break
            extractedText += pText + '\n';
          }
        }
      } else {
        // For other elements, get text normally
        const text = $el.text();
        if (text && text.trim()) {
          // Don't process text if it's inside a list (already handled above)
          if (!$(el).closest('ul, ol').length) {
            // Check for common math patterns: E = mc^2, \frac{1}{2}, etc.
            const mathPatterns = [
              /\\frac\{[^}]+\}\{[^}]+\}/g,  // \frac{a}{b}
              /\\sqrt\{[^}]+\}/g,           // \sqrt{x}
              /\^[0-9]+/g,                   // x^2
              /[A-Z]\s*=\s*[A-Z][a-z]*\^[0-9]+/g, // E = mc^2
            ];
            
            let processedText = text;
            mathPatterns.forEach((pattern, idx) => {
              processedText = processedText.replace(pattern, (match) => {
                return `[MATH:${match}]`;
              });
            });
            
            extractedText += processedText;
            
            // Add line break for block elements
            const isBlock = /^(div|li|h[1-6]|section|article|header|footer|blockquote)$/i.test(tag);
            if (isBlock) {
              extractedText += '\n';
            }
          }
        }
      }
    });
    
    return this.normalizeWhitespace(extractedText);
  }

  /**
   * Extract tables and math expressions from parsed questions
   * Associates tables and math with questions based on position in text
   */
  enrichQuestionsWithTablesAndMath(questions, html) {
    if (!html || !this.htmlTables) return questions;
    
    const $ = loadHtml(html);
    
    // For each question, check if it has table/math markers
    questions.forEach((q, qIdx) => {
      const questionText = q.question_text || '';
      
      let processedText = questionText;
      
      // Extract table markers
      const tableMatches = processedText.match(/\[TABLE:(\d+)\]/g);
      if (tableMatches) {
        q.tables = [];
        tableMatches.forEach(match => {
          const tableIdx = parseInt(match.match(/\[TABLE:(\d+)\]/)[1]);
          const table = this.htmlTables.find(t => t.index === tableIdx);
          if (table) {
            q.tables.push(table.rows);
          }
        });
        // Remove table markers from question text
        processedText = processedText.replace(/\[TABLE:\d+\]/g, '').trim();
      }
      
      // Extract math expressions and replace markers with LaTeX notation
      const mathMatches = processedText.match(/\[MATH:([^\]]+)\]/g);
      if (mathMatches) {
        q.math_expressions = [];
        mathMatches.forEach(match => {
          const mathExpr = match.match(/\[MATH:([^\]]+)\]/)[1];
          q.math_expressions.push(mathExpr);
          // Replace marker with LaTeX-formatted expression for frontend rendering
          // Frontend can use MathJax to render expressions wrapped in $...$
          processedText = processedText.replace(match, `$${mathExpr}$`);
        });
      }
      
      // Update question text with processed version
      if (tableMatches || mathMatches) {
        q.question_text = processedText;
      }
      
      // Also process options for tables, images, and math expressions
      if (q.options && Array.isArray(q.options)) {
        q.options = q.options.map(option => {
          let optionText = option.text || option;
          
          // Extract table markers from options
          const optionTableMatches = optionText.match(/\[TABLE:(\d+)\]/g);
          if (optionTableMatches && q.tables) {
            optionTableMatches.forEach(match => {
              const tableIdx = parseInt(match.match(/\[TABLE:(\d+)\]/)[1]);
              const table = this.htmlTables.find(t => t.index === tableIdx);
              if (table && !q.tables.some(t => t === table.rows)) {
                q.tables.push(table.rows);
              }
            });
            optionText = optionText.replace(/\[TABLE:\d+\]/g, '').trim();
          }
          
          // Extract math expressions from options
          const optionMathMatches = optionText.match(/\[MATH:([^\]]+)\]/g);
          if (optionMathMatches && q.math_expressions) {
            optionMathMatches.forEach(match => {
              const mathExpr = match.match(/\[MATH:([^\]]+)\]/)[1];
              if (!q.math_expressions.includes(mathExpr)) {
                q.math_expressions.push(mathExpr);
              }
              optionText = optionText.replace(match, `$${mathExpr}$`);
            });
          }
          
          // Extract image markers from options
          const optionImageMatches = optionText.match(/\[IMAGE:([^\]]+)\]/g);
          if (optionImageMatches) {
            // Just remove markers for now, images will be handled by frontend
            optionText = optionText.replace(/\[IMAGE:[^\]]+\]/g, '[Image]').trim();
          }
          
          return optionText;
        });
      }
    });
    
    return questions;
  }

  /**
   * Validate a question object
   * @param {Object} question - Question to validate
   * @returns {boolean} True if valid
   */
  validateQuestion(question) {
    // Check required fields
    if (!question.question_text || question.question_text.trim().length === 0) {
      // For questions with images, it's okay to have minimal text
      if (!question.image_url && !question.tables) {
        console.warn('Question missing text:', question);
        return false;
      }
      // If it has an image but no text, that's okay - the image provides context
      question.question_text = question.question_text || '';
    }

    // Validate based on question type
    const questionType = question.question_type || 'mcq';
    
    if (questionType === 'short_answer') {
      // Short answer questions just need question text
      return true;
    } else {
      // MCQ questions need at least 2 options
      if (!question.options || question.options.length < 2) {
        console.warn('Question missing sufficient options:', question);
        return false;
      }

      // Validate correct answer index
      if (question.correct_answer < 0 || question.correct_answer >= question.options.length) {
        console.warn('Question has invalid correct answer:', question);
        return false;
      }

      // Check that options aren't empty
      const validOptions = question.options.filter(opt => opt && opt.trim().length > 0);
      if (validOptions.length !== question.options.length) {
        console.warn('Question has empty options:', question);
        return false;
      }

      return true;
    }
  }

  /**
   * Normalize whitespace in extracted text
   */
  normalizeWhitespace(str) {
    return (str || '')
      .replace(/\r\n/g, '\n')
      .replace(/[\t\f\v]+/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .trim();
  }

  /**
   * Extract course name and level from filename
   * Expected format: "EOS-Test 18 Math Easy.docx"
   * @param {string} filename - Original filename
   * @returns {Object} Object with course and level
   */
  extractCourseInfo(filename) {
    const nameWithoutExt = path.basename(filename, '.docx');
    
    // Try to extract level from filename
    const levelMatch = nameWithoutExt.match(/\b(Easy|Medium|Hard)\b/i);
    const level = levelMatch ? levelMatch[1] : 'Easy';
    
    // Extract course name (everything before the level)
    let courseName = nameWithoutExt;
    if (levelMatch) {
      courseName = nameWithoutExt.substring(0, levelMatch.index).trim();
    }
    
    // Clean up course name
    courseName = courseName.replace(/^EOS-Test\s*\d*\s*/i, '').trim();
    
    return {
      course: courseName || 'General',
      level: level
    };
  }
}

export default QuizParserImproved;
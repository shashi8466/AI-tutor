import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { load as loadHtml } from 'cheerio';

/**
 * Fixed Quiz Parser for extracting structured questions from .docx, .pdf, and .zip files
 * Implements all fixes for recurring issues:
 * 1. Robust question text extraction with fallbacks
 * 2. Proper grouping of fragmented MCQs
 * 3. Consistent option parsing
 * 4. Math expression handling
 * 5. Image extraction and linking
 * 6. Accurate question type classification
 * 7. Correct answer index mapping
 */
class QuizParserFixed {
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
      
      // Match fill-in-the-blank patterns
      fillBlank: /_{5,}|\\_______/g,
      
      // Match math expressions
      mathExpression: /(?:f\(|g\(|h\()[\w\s\(\)\+\-\*\/\^=]+|[\w]+[\s]*=[\s]*[\w\d\s\(\)\+\-\*\/\^]+/g
    };
    
    console.log('Question pattern:', this.patterns.questionNumber);
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
      
      // Validate inputs
      if (!filePath || !courseId || !level) {
        throw new Error('Missing required parameters: filePath, courseId, or level');
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Reset state for new document
      this.htmlTables = [];
      this.zipHtmlEntries = [];
      this.lastParsedHtml = null;
      this.images = [];
      
      const fileExt = path.extname(filePath).toLowerCase();
      let text = '';
      
      // Extract text based on file type
      if (fileExt === '.docx') {
        try {
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
          
          // Validate result
          if (!result || !result.value) {
            throw new Error('Failed to convert .docx to HTML - empty result');
          }
          
          // Extract text from HTML for parsing, but preserve structure
          const html = result.value || '';
          if (!html || html.trim() === '') {
            throw new Error('Empty or invalid .docx content');
          }
          
          text = this.extractHtmlVisibleText(html);
          
          // Also store HTML for later table/math extraction
          this.lastParsedHtml = html;
        } catch (docxError) {
          console.error('Error parsing .docx file:', docxError);
          throw new Error(`Failed to parse .docx file: ${docxError.message}`);
        }
      } else if (fileExt === '.pdf') {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          if (!dataBuffer || dataBuffer.length === 0) {
            throw new Error('Empty PDF file');
          }
          
          const pdfParseModule = await import('pdf-parse');
          const pdfData = await pdfParseModule.default(dataBuffer);
          text = this.normalizeWhitespace(pdfData.text || '');
          
          if (!text || text.trim() === '') {
            throw new Error('Empty or invalid PDF content');
          }
        } catch (pdfError) {
          console.error('Error parsing PDF file:', pdfError);
          throw new Error(`Failed to parse PDF file: ${pdfError.message}`);
        }
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
              
              try {
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
                if (html && html.trim() !== '') {
                  entryContent = this.extractHtmlVisibleText(html);
                  
                  // Store HTML for this entry if we need to extract tables/math later
                  if (!this.zipHtmlEntries) this.zipHtmlEntries = [];
                  this.zipHtmlEntries.push({
                    name: entry.entryName,
                    html: html,
                    text: entryContent
                  });
                }
              } catch (docxError) {
                console.warn(`Failed to parse .docx in ZIP: ${entry.entryName}`, docxError.message);
              }
              
              // Clean up temp file
              try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
            } else if (entryExt === '.pdf') {
              foundSupportedFiles = true;
              // Write temp file for pdf-parse
              const tempDir = path.join(path.dirname(filePath), '_temp');
              fs.mkdirSync(tempDir, { recursive: true });
              const tempPath = path.join(tempDir, entry.entryName);
              fs.writeFileSync(tempPath, entry.getData());
              
              try {
                // Parse PDF
                const dataBuffer = fs.readFileSync(tempPath);
                if (dataBuffer && dataBuffer.length > 0) {
                  const pdfParseModule = await import('pdf-parse');
                  const pdfData = await pdfParseModule.default(dataBuffer);
                  entryContent = this.normalizeWhitespace(pdfData.text || '');
                }
              } catch (pdfError) {
                console.warn(`Failed to parse .pdf in ZIP: ${entry.entryName}`, pdfError.message);
              }
              
              // Clean up temp file
              try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
            } else if (entryExt === '.txt') {
              foundSupportedFiles = true;
              const entryData = entry.getData();
              if (entryData && entryData.length > 0) {
                entryContent = this.normalizeWhitespace(entryData.toString());
              }
            }
            
            // Append entry content to main text
            if (entryContent) {
              text += `

[DOCUMENT:${entry.entryName}]
${entryContent}
[/DOCUMENT:${entry.entryName}]
`;
            }
          }
        }
        
        // Clean up temp directory
        try { 
          const tempDir = path.join(path.dirname(filePath), '_temp');
          fs.rmSync(tempDir, { recursive: true, force: true }); 
        } catch (e) { /* ignore */ }
        
        if (!foundSupportedFiles) {
          throw new Error('No supported files found in ZIP archive');
        }
      } else if (fileExt === '.txt') {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        if (!fileContent || fileContent.trim() === '') {
          throw new Error('Empty .txt file');
        }
        text = this.normalizeWhitespace(fileContent);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }
      
      // Validate that we have text to parse
      if (!text || text.trim() === '') {
        throw new Error('No text content extracted from document');
      }
      
      // Parse questions from extracted text
      let questions = this.parseQuestionsFromText(text, courseId, level);
      
      // If we have HTML content, enrich questions with tables and math expressions
      if (this.lastParsedHtml) {
        questions = this.enrichQuestionsWithTablesAndMath(questions, this.lastParsedHtml);
      } else if (this.zipHtmlEntries && this.zipHtmlEntries.length > 0) {
        // For ZIP files, enrich with content from each HTML entry
        for (const entry of this.zipHtmlEntries) {
          questions = this.enrichQuestionsWithTablesAndMath(questions, entry.html);
        }
      }
      
      // Validate and clean up questions
      questions = questions.filter(q => this.validateQuestion(q));
      
      console.log(`Parsed ${questions.length} questions from document`);
      
      // Log warning if no questions were parsed
      if (questions.length === 0) {
        console.warn('No questions were parsed from document - this may indicate a parsing issue');
      }
      
      return questions;
    } catch (error) {
      console.error('Error parsing document:', error);
      throw error;
    }
  }

  /**
   * Parse questions from extracted text
   * @param {string} text - Extracted text content
   * @param {string} courseId - Course identifier
   * @param {string} level - Difficulty level
   * @returns {Array} Array of parsed questions
   */
  parseQuestionsFromText(text, courseId, level) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const questions = [];
    
    // Group lines by question header using regex /^Q\.\d+\)/
    const questionBlocks = [];
    let currentBlock = null;
    
    // First pass: group lines by question header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for question header pattern /^Q\.\d+\)/
      const questionHeaderMatch = line.match(/^Q\.\s*(\d+)\)/i);
      
      if (questionHeaderMatch) {
        // Start of a new question block
        if (currentBlock) {
          questionBlocks.push(currentBlock);
        }
        
        const questionNumber = parseInt(questionHeaderMatch[1]);
        currentBlock = {
          number: questionNumber,
          lines: [line]
        };
      } else if (currentBlock) {
        // Accumulate line in current block
        currentBlock.lines.push(line);
      } else if (!currentBlock && line.trim()) {
        // Handle lines before first question header (should be rare)
        currentBlock = {
          number: 0, // Will be updated
          lines: [line]
        };
      }
    }
    
    // Don't forget the last block
    if (currentBlock) {
      questionBlocks.push(currentBlock);
    }
    
    // Second pass: process each question block
    for (const block of questionBlocks) {
      // Initialize question structure
      const question = {
        question_number: block.number,
        question_text: '',
        options: [],
        correct_answer: -1,
        explanation: '',
        question_type: 'mcq', // Will be updated based on options
        image_url: null
      };
      
      let questionTextLines = [];
      let options = [];
      let answerText = '';
      let explanationLines = [];
      let inExplanation = false;
      
      // Process lines in the block
      for (let i = 0; i < block.lines.length; i++) {
        const line = block.lines[i];
        
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Extract text after question header if this is the first line
        let lineText = line;
        if (i === 0) {
          const headerMatch = line.match(/^Q\.\s*\d+\)\s*(.*)/i);
          if (headerMatch && headerMatch[1]) {
            lineText = headerMatch[1].trim();
          } else {
            // Remove the header entirely
            const headerOnly = line.match(/^Q\.\s*\d+\)/i);
            if (headerOnly) {
              lineText = line.replace(headerOnly[0], '').trim();
            }
          }
        }
        
        // Check for explanation start - MORE ROBUST PATTERN
        const explanationMatch = line.match(/(?:Explanation:|Exp:)\s*(.+)/i);
        if (explanationMatch) {
          inExplanation = true;
          if (explanationMatch[1]) {
            explanationLines.push(explanationMatch[1].trim());
          }
          continue;
        }
        
        // If we're in explanation mode, collect explanation lines
        if (inExplanation) {
          explanationLines.push(line.trim());
          continue;
        }
        
        // Check for answer line - IMPROVED REGEX PATTERN
        const answerMatch = line.match(/(?:Answer:|Correct Answer:|Key:)\s*(.+)/i);
        if (answerMatch) {
          answerText = answerMatch[1].trim();
          continue;
        }
        
        // Check if this line looks like an option - ENHANCED PATTERN
        const optionMatch = line.match(/^([A-D])[\.\)\-]?\s*(.+)$/i);
        if (optionMatch) {
          const optionContent = optionMatch[2].trim();
          options.push({
            text: optionContent
          });
          continue;
        }
        
        // Check for alternative option formats (like "A) Option text")
        const altOptionMatch = line.match(/^([A-D])\)\s*(.+)$/);
        if (altOptionMatch) {
          const optionContent = altOptionMatch[2].trim();
          options.push({
            text: optionContent
          });
          continue;
        }
        
        // Otherwise, treat as question text
        if (lineText.trim()) {
          questionTextLines.push(lineText.trim());
        }
      }
      
      // Set question text before calling finalizeQuestion
      question.question_text = questionTextLines.join(' ').trim();
      
      // Use finalizeQuestion to properly process options and set question properties
      this.finalizeQuestion(question, options, explanationLines, questions, null, null);
      
      // If finalizeQuestion didn't set the answer correctly for MCQ, try to map it
      if (question.question_type === 'mcq' && question.correct_answer === -1) {
        if (answerText && answerText.length === 1 && /[A-D]/i.test(answerText)) {
          const answerIndex = answerText.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          if (answerIndex >= 0 && answerIndex < question.options.length) {
            question.correct_answer = answerIndex;
          } else {
            // Don't default to 0, keep as -1 to indicate parsing issue
            question.correct_answer = -1;
          }
        } else if (answerText) {
          // Try to find the answer text in options
          const answerIndex = question.options.findIndex(opt => 
            opt && opt.toString().trim().toLowerCase() === answerText.toString().trim().toLowerCase());
          if (answerIndex >= 0) {
            question.correct_answer = answerIndex;
          } else {
            // Don't default to 0, keep as -1 to indicate parsing issue
            question.correct_answer = -1;
          }
        } else {
          // No answer found, keep as -1 to indicate parsing issue
          question.correct_answer = -1;
        }
      } else if (question.question_type === 'short_answer' && question.correct_answer === -1) {
        // For short answer, correct_answer should be the actual answer text
        question.correct_answer = answerText || '';
      }
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
        // Handle both string and object formats
        let optionText = typeof opt === 'string' ? opt : (opt.text || opt.toString());
        
        // Remove any embedded question text that might have been included
        let cleanedText = optionText.trim();
        
        // Remove any leading option markers that might have been included
        // Only remove actual option markers like "A) ", "B. ", etc., not content that starts with numbers
        // More precise pattern: match letter followed by punctuation and spaces
        const optionMarkerMatch = cleanedText.match(/^([A-D])[\.\)\:\-\s]+/);
        if (optionMarkerMatch) {
          cleanedText = cleanedText.substring(optionMarkerMatch[0].length).trim();
        }
        
        return cleanedText;
      }).filter(opt => opt.length > 0);
      
      // Limit to exactly 4 options as per requirements
      question.options = cleanedOptions.slice(0, 4);

      // Determine question type based on options
      // According to specification: MCQ if exactly 4 options, SHORT_ANSWER otherwise
      if (question.options.length === 4) {
        question.question_type = 'mcq';
      } else {
        question.question_type = 'short_answer';
      }
    } else {
      // No options detected - treat as short answer
      question.question_type = 'short_answer';
      question.options = [];
    }
    
    // Set explanation - JOIN ALL EXPLANATION LINES
    question.explanation = explanationLines.join(' ').trim();
    
    // If explanation is empty but question text contains "Explanation:", extract it
    if (!question.explanation && question.question_text.includes('Explanation:')) {
      const explanationMatch = question.question_text.match(/Explanation:\s*(.+)$/i);
      if (explanationMatch && explanationMatch[1]) {
        question.explanation = explanationMatch[1].trim();
        // Remove explanation from question text
        question.question_text = question.question_text.replace(/Explanation:\s*.+$/i, '').trim();
      }
    }
    
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
        // Don't default to first option, mark as invalid
        question.correct_answer = -1;
      }
    } else if (question.question_type === 'short_answer') {
      // For short answer, correct_answer should be the expected answer text
      // But we should NOT include the answer in the options array for display
      if (question.options.length > 0) {
        question.correct_answer = question.options[0];
        // Clear options array for short answer questions as per specification
        question.options = [];
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
          const imgId = `img-${imageIndex++}`;
          // Store image data for later use
          this.images.push({
            id: imgId,
            src: src,
            alt: alt,
            context: 'document'
          });
          $(img).replaceWith(`[IMAGE:${imgId}]`);
        }
      });
      
      // Handle math expressions in general content
      // Enhanced math pattern matching
      const elHtml = $el.html() || '';
      let processedHtml = elHtml;
      
      // Handle LaTeX expressions in $$...$$ and $...$ format
      processedHtml = processedHtml.replace(/(\${1,2}[^$]+\${1,2})/g, (match) => {
        return `[MATH:${match.replace(/\$/g, '')}]`;
      });
      
      // Handle inline math expressions in \( ... \) format
      processedHtml = processedHtml.replace(/\\\(([^\\)]+)\\\)/g, (match, expr) => {
        return `[MATH:${expr}]`;
      });
      
      // Handle display math expressions in \[ ... \] format
      processedHtml = processedHtml.replace(/\\\[([^\\]]+)\\\]/g, (match, expr) => {
        return `[MATH:${expr}]`;
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
            // Preserve original text for question content while marking math expressions
            let processedText = text;
            
            // First, handle any existing math markers
            processedText = processedText.replace(/\[MATH:([^\]]+)\]/g, (match, expr) => {
              return `[MATH:${expr}]`;
            });
            
            // Then detect and mark new math expressions
            const mathPatterns = [
              /\\frac\{[^}]+\}\{[^}]+\}/g,  // \frac{a}{b}
              /\\sqrt\{[^}]+\}/g,           // \sqrt{x}
              /\\int\s*_[^\s]+\s*\^[^\s]+/g, // \int_a^b
              /\\sum\s*_[^\s]+\s*\^[^\s]+/g, // \sum_{i=1}^n
              /\\lim\s*_\{[^}]+\}/g,          // \lim_{x\to0}
              /\\infty/g,                      // \infty
              /\\pm/g,                         // \pm
              /\\times/g,                      // \times
              /\\div/g,                        // \div
              /\\left\([^)]+\\right\)/g,     // \left( ... \right)
              /\\left\[[^]]+\\right\]/g,      // \left[ ... \right]
              /\^[0-9]+/g,                      // x^2
              /\$\$[^$]+\$\$/g,                // $$...$$
              /\$[^$]+\$/g,                     // $...$
              /[A-Z]\s*=\s*[A-Z][a-z]*\^[0-9]+/g, // E = mc^2
              /\b[A-Za-z](?:_[A-Za-z0-9]+)?\b/g,  // Single letters with subscripts like x_1, a_i
            ];
            
            mathPatterns.forEach((pattern) => {
              processedText = processedText.replace(pattern, (match) => {
                // Don't double-mark expressions that are already marked
                if (!match.startsWith('[MATH:')) {
                  return `[MATH:${match}]`;
                }
                return match;
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
   * Extract tables, images, and math expressions from parsed questions
   * Associates tables, images, and math with questions based on position in text
   */
  enrichQuestionsWithTablesAndMath(questions, html) {
    if (!html) return questions;
    
    const $ = loadHtml(html);
    
    // For each question, check if it has table/math/image markers
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
      
      // Extract image markers and associate with question
      const imageMatches = processedText.match(/\[IMAGE:([^\]]+)\]/g);
      if (imageMatches && this.images && this.images.length > 0) {
        imageMatches.forEach(match => {
          const imageId = match.match(/\[IMAGE:([^\]]+)\]/)[1];
          const imageData = this.images.find(img => img.id === imageId);
          if (imageData) {
            // Set image URL for the question
            q.image_url = imageData.src;
          }
        });
        // Remove image markers from question text
        processedText = processedText.replace(/\[IMAGE:[^\]]+\]/g, '').trim();
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
          // Preserve the original math expression formatting
          processedText = processedText.replace(match, `$${mathExpr}$`);
        });
      }
      
      // Update question text with processed version
      q.question_text = processedText;
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

export default QuizParserFixed;
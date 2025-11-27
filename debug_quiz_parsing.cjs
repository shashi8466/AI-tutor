const QuizParser = require('./server/quizParser.js').default;
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function debugParsing() {
  try {
    // Initialize parser
    const quizParser = new QuizParser();
    
    // File path
    const filePath = path.join(__dirname, 'server', 'storage', 'quiz-docs', 'course_1762414017406', 'Easy', '1762414035144-EOS-Test 18 Math Easy.txt');
    
    console.log(`Parsing file: ${filePath}`);
    
    // Parse the document
    const questions = await quizParser.parseDocument(filePath, 'course_1762414017406', 'Easy');
    
    console.log(`\nParsed ${questions.length} questions:`);
    questions.forEach((q, index) => {
      console.log(`${index + 1}. Q${q.question_number}: ${q.question_text.substring(0, 50)}...`);
      console.log(`   Options: ${q.options.length}, Correct: ${q.correct_answer}, Type: ${q.question_type}`);
      if (q.explanation) {
        console.log(`   Explanation: ${q.explanation.substring(0, 50)}...`);
      }
      console.log('');
    });
    
    // Check validation
    console.log('Validating questions:');
    let validCount = 0;
    questions.forEach((q, index) => {
      const isValid = quizParser.validateQuestion(q);
      if (isValid) {
        validCount++;
      } else {
        console.log(`Invalid question ${index + 1} (Q${q.question_number}):`, q);
      }
    });
    
    console.log(`Valid questions: ${validCount}/${questions.length}`);
    
  } catch (error) {
    console.error('Error during parsing:', error);
  }
}

debugParsing();
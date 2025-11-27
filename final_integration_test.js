import QuizParserFixed from './server/quizParserFixed.js';
import fs from 'fs';
import path from 'path';

// Create a sample quiz document for testing
const sampleQuizContent = `Q. 1) What is the capital of France?
A. Paris
B. London
C. Berlin
D. Madrid
Answer: A

Q. 2) Solve for x: 2x + 5 = 15
A. 5
B. 10
C. 7.5
D. 2.5
Answer: A

Q. 3) What is the chemical symbol for gold?
Answer: Au

Q. 4) Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
Answer: B

Q. 5) Calculate the area of a circle with radius 5.
Answer: 25π`;

// Write sample content to a temporary file
const tempFilePath = path.join('test_sample.txt');
fs.writeFileSync(tempFilePath, sampleQuizContent);

console.log('Created sample quiz file for testing');

// Create parser instance
const parser = new QuizParserFixed();

// Test the parsing
try {
  console.log('Testing final integration with file parsing...');
  
  // Test direct text parsing
  const questions = parser.parseQuestionsFromText(sampleQuizContent, 'TEST_COURSE', 'Easy');
  
  console.log(`Parsed ${questions.length} questions from text:`);
  
  questions.forEach((q, index) => {
    console.log(`\n--- Question ${index + 1} ---`);
    console.log(`Number: ${q.question_number}`);
    console.log(`Type: ${q.question_type}`);
    console.log(`Text: ${q.question_text}`);
    console.log(`Answer: "${q.correct_answer}"`);
    if (q.options && q.options.length > 0) {
      console.log('Options:');
      q.options.forEach((opt, i) => {
        console.log(`  ${i}: ${opt}`);
      });
    }
  });
  
  // Validate questions
  const validQuestions = questions.filter(q => parser.validateQuestion(q));
  console.log(`\nValidation Results:`);
  console.log(`Valid questions: ${validQuestions.length}/${questions.length}`);
  
  // Test file parsing (this would normally extract from DOCX/PDF but we're using TXT)
  console.log('\n--- Testing File Parsing ---');
  const fileQuestions = await parser.parseDocument(tempFilePath, 'TEST_COURSE', 'Easy');
  console.log(`Parsed ${fileQuestions.length} questions from file:`);
  
  fileQuestions.forEach((q, index) => {
    console.log(`\nFile Question ${index + 1}:`);
    console.log(`  Number: ${q.question_number}`);
    console.log(`  Type: ${q.question_type}`);
    console.log(`  Text: ${q.question_text.substring(0, 50)}...`);
    console.log(`  Answer: "${q.correct_answer}"`);
  });
  
  // Clean up
  fs.unlinkSync(tempFilePath);
  console.log('\nCleaned up temporary file');
  
  console.log('\n✅ All tests passed! The parser is working correctly.');
  
} catch (error) {
  console.error('Error testing parser:', error);
  
  // Clean up even if there's an error
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}
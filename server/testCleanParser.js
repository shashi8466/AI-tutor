import QuizParserFixed from './quizParserFixed.js';
import fs from 'fs';
import path from 'path';

// Test the parser with clean content
async function testCleanParser() {
  try {
    const parser = new QuizParserFixed();
    const testFilePath = path.join(process.cwd(), 'server', 'testCleanQuiz.txt');
    
    console.log('Testing parser with clean quiz content...');
    console.log('File path:', testFilePath);
    
    // Check if file exists
    if (!fs.existsSync(testFilePath)) {
      console.error('Test file not found:', testFilePath);
      return;
    }
    
    // Parse the clean content
    const questions = await parser.parseDocument(testFilePath, 'test-course', 'Easy');
    
    console.log(`Parsed ${questions.length} questions:`);
    
    // Show each question
    questions.forEach((q, index) => {
      console.log(`\nQ${q.question_number} (${q.question_type}):`);
      console.log(`  Text: "${q.question_text}"`);
      console.log(`  Options: ${q.options.length}`);
      console.log(`  Correct Answer: ${q.correct_answer}`);
      console.log(`  Explanation: "${q.explanation}"`);
      
      if (q.options.length > 0) {
        q.options.forEach((opt, i) => {
          console.log(`    ${i}: "${opt}"`);
        });
      }
    });
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('Error testing parser:', error);
    throw error;
  }
}

// Run the test
testCleanParser().catch(console.error);
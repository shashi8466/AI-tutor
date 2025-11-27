import QuizParserFixed from './quizParserFixed.js';
import fs from 'fs';
import path from 'path';

// Test the parser with fragmented content
async function testFragmentedParser() {
  try {
    const parser = new QuizParserFixed();
    const testFilePath = path.join(process.cwd(), 'server', 'testFragmentedQuiz.txt');
    
    console.log('Testing parser with fragmented quiz content...');
    console.log('File path:', testFilePath);
    
    // Check if file exists
    if (!fs.existsSync(testFilePath)) {
      console.error('Test file not found:', testFilePath);
      return;
    }
    
    // Parse the fragmented content
    const questions = await parser.parseDocument(testFilePath, 'test-course', 'Easy');
    
    console.log(`Parsed ${questions.length} questions:`);
    
    // Group questions by their question number to see the fragmentation
    const groupedQuestions = {};
    questions.forEach(q => {
      if (!groupedQuestions[q.question_number]) {
        groupedQuestions[q.question_number] = [];
      }
      groupedQuestions[q.question_number].push(q);
    });
    
    // Show how questions are fragmented
    Object.keys(groupedQuestions).sort((a, b) => parseInt(a) - parseInt(b)).forEach(qNum => {
      const fragments = groupedQuestions[qNum];
      console.log(`\nQ${qNum} (${fragments.length} fragments):`);
      fragments.forEach((fragment, index) => {
        console.log(`  Fragment ${index + 1}:`);
        console.log(`    Text: "${fragment.question_text}"`);
        console.log(`    Type: ${fragment.question_type}`);
        console.log(`    Options: ${fragment.options ? fragment.options.length : 0}`);
        console.log(`    Answer: ${fragment.correct_answer}`);
        if (fragment.options && fragment.options.length > 0) {
          fragment.options.forEach((opt, i) => {
            console.log(`      ${i}: "${opt}"`);
          });
        }
      });
    });
    
  } catch (error) {
    console.error('Error testing parser:', error);
    throw error;
  }
}

// Run the test
testFragmentedParser().catch(console.error);
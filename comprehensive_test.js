import QuizParserFixed from './server/quizParserFixed.js';

// Comprehensive test content with various edge cases
const testContent = `
Q. 1) What is the capital of France?
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
Explanation: Mars is called the Red Planet due to iron oxide on its surface.

Q. 5) Calculate the area of a circle with radius 5.
Answer: 25π

Q. 6) What is the largest mammal in the world?
A. Elephant
B. Blue Whale
C. Giraffe
D. Hippopotamus
Answer: B

Q. 7) Who wrote "Romeo and Juliet"?
A. Charles Dickens
B. William Shakespeare
C. Jane Austen
D. Mark Twain
Answer: B

Q. 8) What is the square root of 144?
Answer: 12

Q. 9) Which element has the chemical symbol 'O'?
A. Gold
B. Oxygen
C. Osmium
D. Oganesson
Answer: B

Q. 10) What is the boiling point of water in Celsius?
Answer: 100

Q. 11) What is the value of π (pi) approximately?
A. 3.14
B. 3.16
C. 3.12
D. 3.18
Answer: A

Q. 12) Name the process by which plants make their food.
Answer: Photosynthesis

Q. 13) How many sides does a hexagon have?
A. 5
B. 6
C. 7
D. 8
Answer: B

Q. 14) What is the chemical formula for water?
Answer: H2O

Q. 15) Which gas is most abundant in Earth's atmosphere?
A. Oxygen
B. Carbon Dioxide
C. Nitrogen
D. Hydrogen
Answer: C
`;

// Create parser instance
const parser = new QuizParserFixed();

// Test the parsing
try {
  console.log('Testing comprehensive parser functionality...');
  
  const questions = parser.parseQuestionsFromText(testContent, 'TEST', 'Easy');
  
  console.log(`Parsed ${questions.length} questions:`);
  
  // Verify question types
  const mcqCount = questions.filter(q => q.question_type === 'mcq').length;
  const shortAnswerCount = questions.filter(q => q.question_type === 'short_answer').length;
  
  console.log(`\nQuestion Types:`);
  console.log(`MCQ: ${mcqCount}`);
  console.log(`Short Answer: ${shortAnswerCount}`);
  
  // Check specific questions
  console.log(`\nSample Questions:`);
  
  // Check MCQ with explanation
  const q4 = questions.find(q => q.question_number === 4);
  console.log(`\nQ4 (MCQ with explanation):`);
  console.log(`  Text: ${q4.question_text}`);
  console.log(`  Type: ${q4.question_type}`);
  console.log(`  Answer Index: ${q4.correct_answer}`);
  console.log(`  Correct Option: ${q4.options[q4.correct_answer]}`);
  console.log(`  Explanation: ${q4.explanation}`);
  
  // Check short answer
  const q5 = questions.find(q => q.question_number === 5);
  console.log(`\nQ5 (Short Answer):`);
  console.log(`  Text: ${q5.question_text}`);
  console.log(`  Type: ${q5.question_type}`);
  console.log(`  Answer: "${q5.correct_answer}"`);
  
  // Validate questions
  const validQuestions = questions.filter(q => parser.validateQuestion(q));
  console.log(`\nValidation Results:`);
  console.log(`Valid questions: ${validQuestions.length}/${questions.length}`);
  
  // Test grouping by question header
  console.log(`\nQuestion Numbers:`);
  const questionNumbers = questions.map(q => q.question_number).sort((a, b) => a - b);
  console.log(`  ${questionNumbers.join(', ')}`);
  
  // Verify all questions have unique numbers
  const uniqueNumbers = new Set(questionNumbers);
  console.log(`\nGrouping Verification:`);
  console.log(`  Total questions: ${questions.length}`);
  console.log(`  Unique question numbers: ${uniqueNumbers.size}`);
  console.log(`  Grouping correct: ${questions.length === uniqueNumbers.size ? 'YES' : 'NO'}`);
  
} catch (error) {
  console.error('Error testing parser:', error);
}
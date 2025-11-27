import QuizParserFixed from './server/quizParserFixed.js';

// Test content with edge cases
const testContent = `
Q. 1) What is the value of x in the equation 2x + 5 = 15?
A. 5
B. 10
C. 7.5
D. 2.5
Answer: A

Q. 2) Explain the process of photosynthesis.
Answer: Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.

Q. 3) Which of the following are primary colors? (Select all that apply)
A. Red
B. Green
C. Blue
D. Yellow
Answer: A, C

Q. 4) What is the capital city of Japan?
A. Seoul
B. Tokyo
C. Beijing
D. Bangkok
Answer: B

Q. 5) Calculate the derivative of f(x) = x^2.
Answer: 2x

Q. 6) Who painted the Mona Lisa?
A. Vincent van Gogh
B. Pablo Picasso
C. Leonardo da Vinci
D. Michelangelo
Answer: C
`;

// Create parser instance
const parser = new QuizParserFixed();

// Test the parsing
try {
  console.log('Testing edge cases...');
  
  const questions = parser.parseQuestionsFromText(testContent, 'TEST', 'Easy');
  
  console.log(`Parsed ${questions.length} questions:`);
  
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
  console.log(`\nValid questions: ${validQuestions.length}/${questions.length}`);
  
} catch (error) {
  console.error('Error testing parser:', error);
}
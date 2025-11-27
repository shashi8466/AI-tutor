import QuizParserFixed from './server/quizParserFixed.js';

// Test content with various question formats
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

Q. 5) Calculate the area of a circle with radius 5.
Answer: 25π

Q. 6) What is the largest mammal in the world?
A. Elephant
B. Blue Whale
C. Giraffe
D. Hippopotamus
Answer: B
Explanation: Blue whales can reach lengths of up to 100 feet and weigh as much as 200 tons.

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
`;

// Create parser instance
const parser = new QuizParserFixed();

// Test the parsing
try {
  console.log('Testing improved parser with sample content...');
  
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
    if (q.explanation) {
      console.log(`Explanation: ${q.explanation}`);
    }
  });
  
  // Validate questions
  const validQuestions = questions.filter(q => parser.validateQuestion(q));
  console.log(`\nValid questions: ${validQuestions.length}/${questions.length}`);
  
} catch (error) {
  console.error('Error testing parser:', error);
}
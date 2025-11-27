import QuizParserFixed from './quizParserFixed.js';
import fs from 'fs';
import path from 'path';

// Create a more complex test document with math expressions and tables
const testContent = `Q1: Solve for x: 3x + 7 = 22

Answer: x = 5
Explanation: 3x + 7 = 22 => 3x = 15 => x = 5

Q2: What is the area of the triangle shown in the table below?

[TABLE:0]

Answer: B
Explanation: Area = 1/2 * base * height = 1/2 * 8 * 6 = 24

Q3: Which function represents exponential decay?

A) f(x) = 2^x
B) f(x) = (1/2)^x
C) f(x) = x^2
D) f(x) = log(x)

Answer: B
Explanation: Exponential decay functions have the form f(x) = a^x where 0 < a < 1.

Q4: [IMAGE:diagram1.png]
What is the solution to 5p = 8 - q?

Answer: p = (8 - q)/5
Explanation: Divide both sides by 5 to isolate p.

Q5: Find the measure of angle ABC in the diagram shown.

[IMAGE:geometry-diagram.png]

Answer: 45°
Explanation: In an isosceles right triangle, the two base angles are equal and sum to 90°, so each is 45°.

Q6: Simplify: (x^2 - 9)/(x - 3)

A) x - 3
B) x + 3
C) x^2 + 9
D) x^2 - 3

Answer: B
Explanation: Factor the numerator: (x^2 - 9) = (x + 3)(x - 3), so (x^2 - 9)/(x - 3) = (x + 3)(x - 3)/(x - 3) = x + 3.

Q7: What is the probability of rolling a sum of 7 with two standard dice?

A) 1/6
B) 1/9
C) 5/36
D) 7/36

Answer: A
Explanation: There are 6 ways to roll a 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). With 36 total outcomes, P(7) = 6/36 = 1/6.`;

// Write test content to a file
const testFilePath = path.join(process.cwd(), 'test-complex-quiz.txt');
fs.writeFileSync(testFilePath, testContent);

console.log('Complex test content written to file. Content length:', testContent.length);

// Test the fixed parser
async function testParser() {
  try {
    const parser = new QuizParserFixed();
    const questions = await parser.parseDocument(testFilePath, 'test-course', 'Hard');
    
    console.log(`Parsed ${questions.length} questions from document`);
    
    // Log questions with missing text
    questions.forEach((q, index) => {
      if (!q.question_text || q.question_text.trim().length === 0) {
        console.log('Question missing text:', q);
      }
    });
    
    // Count valid questions
    const validQuestions = questions.filter(q => parser.validateQuestion(q));
    console.log(`${validQuestions.length} valid questions after validation`);
    
    // Log parsed questions
    console.log('Parsed Questions:');
    validQuestions.forEach((q, index) => {
      console.log(`
Question ${index + 1} (Q${q.question_number}):
  Type: ${q.question_type}
  Text: ${q.question_text ? q.question_text.substring(0, 50) + (q.question_text.length > 50 ? '...' : '') : 'None'}
  Options: ${q.options ? q.options.length : 0}
  Correct Answer: ${q.correct_answer}`);
      
      if (q.image_url) {
        console.log(`  Image: ${q.image_url}`);
      }
      
      if (q.math_expressions && q.math_expressions.length > 0) {
        console.log(`  Math Expressions: ${q.math_expressions.length}`);
      }
      
      if (q.tables && q.tables.length > 0) {
        console.log(`  Tables: ${q.tables.length}`);
      }
    });
    
    console.log(`\nSuccessfully parsed ${validQuestions.length} questions`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    return validQuestions;
  } catch (error) {
    console.error('Error testing parser:', error);
    
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    throw error;
  }
}

// Run the test
testParser().catch(console.error);
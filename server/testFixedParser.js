import QuizParserFixed from './quizParserFixed.js';
import fs from 'fs';
import path from 'path';

// Create a test document with the issues mentioned
const testContent = `Q1: Research by marine biologists indicates that samples taken from the ocean's depths may not fully _______ details about early aquatic ecosystems, since the extreme pressure and low temperatures can alter the chemical composition of specimens before they reach the surface.

A) Portray
B) Empowered
C) adhere to
D) rusticity

Answer: A

Q2: Which choice completes the sentence below with the most logical conclusion?

The research team spent months collecting data from remote locations, yet their findings were inconsistent and failed to support their original hypothesis. This suggests that _______.

A) the hypothesis was fundamentally flawed
B) more data is needed to confirm the results
C) the research methods were inadequate
D) external factors influenced the outcomes

Answer: D

Q3: The professor emphasized that students should not only memorize formulas but also understand the underlying principles, as this approach would enable them to _______ complex problems more effectively.

A) navigate
B) Empowered
C) rusticate
D) adhere to

Answer: A

Q4: Despite the _______ conditions in the laboratory, the scientists managed to conduct their experiments with remarkable precision, demonstrating their adaptability and expertise.

A) Portray
B) adverse
C) rusticity
D) Empowered

Answer: B

Q5: The author's argument would be strengthened if she could provide more _______ evidence to support her claims about consumer behavior.

A) adhere to
B) concrete
C) rusticity
D) Portray

Answer: B

Q6: f(x) = 3/5(1 - 2x)

What is f(2) ?

A) 9/5
B) 3/5
C) -3/5
D) -9/5

Answer: D
Explanation: f(2) = 3/5(1 - 2(2)) = 3/5(1 - 4) = 3/5(-3) = -9/5.

Q7: What percentage of 300 is 75?

A) 25%
B) 50%
C) 75%
D) 225%

Answer: A
Explanation: x * 300 = 75 => x = 75/300 = 0.25 = 25%.`;

// Write test content to a file
const testFilePath = path.join(process.cwd(), 'test-fragmented-quiz.txt');
fs.writeFileSync(testFilePath, testContent);

console.log('Test content written to file. Content length:', testContent.length);

// Test the fixed parser
async function testParser() {
  try {
    const parser = new QuizParserFixed();
    const questions = await parser.parseDocument(testFilePath, 'test-course', 'Medium');
    
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
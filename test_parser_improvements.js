import QuizParserFixed from './server/quizParserFixed.js';

// Test content that demonstrates the issues we're fixing
const testContent = `
Q1. What is the value of x in the equation 2x + 5 = 15?
A) 5
B) 10
C) 7.5
D) 2.5
Answer: A

Q2. [IMAGE:diagram1.png] Refer to the diagram above. What is the area of the triangle?
A) 12 cm²
B) 24 cm²
C) 36 cm²
D) 48 cm²
Answer: B

Q3. Solve for x: $x^2 - 5x + 6 = 0$
A) x = 2, 3
B) x = -2, -3
C) x = 1, 6
D) x = -1, -6
Answer: A

Q4. [IMAGE:graph1.png] The graph shows the function f(x). What is the value of f(2)?
Answer: 4

Q5. Calculate the integral: \\int_0^1 x^2 dx
A) 1/3
B) 1/2
C) 1
D) 2
Answer: A

Q6. What is the limit of (sin x)/x as x approaches 0?
Answer: 1

Q7. [IMAGE:circuit.png] In the circuit shown, what is the current through the 10Ω resistor?
A) 0.5 A
B) 1.0 A
C) 1.5 A
D) 2.0 A
Answer: B

Q8. [IMAGE:geometry.png] Find the volume of the cylinder shown.
A) πr²h
B) 2πrh
C) 2πr²h
D) 4πr²h
Answer: A

Q9. Evaluate the expression: \\sqrt{16} + \\frac{1}{2} \\times 8
A) 8
B) 12
C) 16
D) 20
Answer: A

Q10. What is the derivative of f(x) = x^3?
A) 3x²
B) x²
C) 3x
D) x^4/4
Answer: A

Q11. Solve the system:
\\begin{cases}
2x + y = 5 \\\\
x - y = 1
\\end{cases}
A) x=2, y=1
B) x=1, y=2
C) x=3, y=-1
D) x=-1, y=3
Answer: A

Q12. [IMAGE:function_graph.png] Identify the type of function shown.
Answer: Quadratic

Q13. Find the roots of: x² - 4 = 0
0 B) C)
A) x = ±2
B) x = ±4
C) x = 0, 4
D) x = 0, -4
Answer: A

Q14. Evaluate: \\lim_{x \\to \\infty} \\frac{3x^2 + 2x + 1}{x^2 + 1}
A) 3
B) 2
C) 1
D) ∞
Answer: A

Q15. [IMAGE:triangle.png] In triangle ABC, if angle A = 30° and side a = 5, what is the length of side b if angle B = 60°?
Answer: 5√3
`;

// Create parser instance
const parser = new QuizParserFixed();

// Test the parsing
try {
  console.log('Testing improved parser with sample content...');
  
  // Mock the parseQuestionsFromText method to work with plain text
  const questions = parser.parseQuestionsFromText(testContent, 'TEST', 'Easy');
  
  console.log(`Parsed ${questions.length} questions:`);
  
  questions.forEach((q, index) => {
    console.log(`\n--- Question ${index + 1} ---`);
    console.log(`Number: ${q.question_number}`);
    console.log(`Type: ${q.question_type}`);
    console.log(`Text: ${q.question_text}`);
    console.log(`Answer: ${q.correct_answer}`);
    if (q.options && q.options.length > 0) {
      console.log('Options:');
      q.options.forEach((opt, i) => {
        console.log(`  ${i}: ${opt}`);
      });
    }
    if (q.image_url) {
      console.log(`Image: ${q.image_url}`);
    }
    if (q.math_expressions && q.math_expressions.length > 0) {
      console.log('Math expressions:');
      q.math_expressions.forEach(expr => {
        console.log(`  ${expr}`);
      });
    }
  });
  
  // Validate questions
  const validQuestions = questions.filter(q => parser.validateQuestion(q));
  console.log(`\nValid questions: ${validQuestions.length}/${questions.length}`);
  
} catch (error) {
  console.error('Error testing parser:', error);
}
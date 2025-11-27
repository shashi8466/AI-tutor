import QuizParserEnhanced from './quizParserEnhanced.js';
import fs from 'fs';
import path from 'path';

/**
 * Test the enhanced DOCX parser with sample content
 */
async function testEnhancedParser() {
  try {
    console.log('🧪 Testing Enhanced DOCX Parser...\n');
    
    const parser = new QuizParserEnhanced();
    
    // Create a sample DOCX-like content for testing
    // In real usage, this would be an actual .docx file
    const sampleContent = `
Algebra

Q1: The area of a rectangle is 2400 cm². The width is 80 cm. What is the length?
A) 25 cm
B) 30 cm
C) 40 cm
D) 50 cm
Answer: B
Explanation: Length = Area / Width = 2400 / 80 = 30 cm.

Geometry & Trigonometry

Q2: Solve: 5x - 2 = 18
Answer: 4
Explanation: 5x = 20 → x = 4

Statistics & Probability

Q3: What is the probability of rolling a sum of 7 with two standard dice?
A) 1/6
B) 1/9
C) 5/36
D) 7/36
Correct Answer: A
Explanation: There are 6 ways to roll a 7 out of 36 total outcomes.

Algebra, Functions

Q4: f(x) = 3/5(1 - 2x)
What is f(2)?
A) 9/5
B) 3/5
C) -3/5
D) -9/5
Ans: D
Explanation: f(2) = 3/5(1 - 2(2)) = 3/5(1 - 4) = 3/5(-3) = -9/5.
    `;
    
    // Write sample content to a temporary file
    const tempFilePath = path.join(process.cwd(), 'temp_sample_quiz.txt');
    fs.writeFileSync(tempFilePath, sampleContent, 'utf8');
    
    console.log('📝 Sample content created for testing\n');
    console.log('Sample content preview:');
    console.log(sampleContent.substring(0, 300) + '...\n');
    
    // Test the parser with a simulated HTML conversion
    // Since we can't test actual DOCX without a file, we'll test the parsing logic
    console.log('🔍 Testing parsing logic...\n');
    
    // Create a mock HTML structure similar to what mammoth would produce
    const mockHtml = `
      <html>
        <body>
          <h1>Algebra</h1>
          <p>Q1: The area of a rectangle is 2400 cm². The width is 80 cm. What is the length?</p>
          <p>A) 25 cm</p>
          <p>B) 30 cm</p>
          <p>C) 40 cm</p>
          <p>D) 50 cm</p>
          <p>Answer: B</p>
          <p>Explanation: Length = Area / Width = 2400 / 80 = 30 cm.</p>
          
          <h1>Geometry & Trigonometry</h1>
          <p>Q2: Solve: 5x - 2 = 18</p>
          <p>Answer: 4</p>
          <p>Explanation: 5x = 20 → x = 4</p>
          
          <h1>Statistics & Probability</h1>
          <p>Q3: What is the probability of rolling a sum of 7 with two standard dice?</p>
          <p>A) 1/6</p>
          <p>B) 1/9</p>
          <p>C) 5/36</p>
          <p>D) 7/36</p>
          <p>Correct Answer: A</p>
          <p>Explanation: There are 6 ways to roll a 7 out of 36 total outcomes.</p>
        </body>
      </html>
    `;
    
    // Test the question extraction logic
    const questions = parser.extractQuestionsFromHtml(mockHtml);
    
    console.log(`✅ Successfully extracted ${questions.length} questions\n`);
    
    // Display each question in the required JSON format
    questions.forEach((q, index) => {
      console.log(`📋 Question ${index + 1}:`);
      console.log(JSON.stringify(q, null, 2));
      console.log('---\n');
    });
    
    // Validate the structure matches requirements
    console.log('🔍 Validation Results:');
    questions.forEach((q, index) => {
      const isValid = validateQuestionStructure(q, index + 1);
      console.log(`  Question ${index + 1}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });
    
    // Test topic extraction
    console.log('\n🏷️  Topics extracted:');
    const topics = [...new Set(questions.map(q => q.topic))];
    topics.forEach(topic => {
      const count = questions.filter(q => q.topic === topic).length;
      console.log(`  ${topic}: ${count} question(s)`);
    });
    
    // Test question types
    console.log('\n📊 Question Types:');
    const mcqCount = questions.filter(q => q.type === 'MCQ').length;
    const shortAnswerCount = questions.filter(q => q.type === 'SHORT_ANSWER').length;
    console.log(`  MCQ: ${mcqCount}`);
    console.log(`  SHORT_ANSWER: ${shortAnswerCount}`);
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
    console.log('\n✅ Enhanced parser test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing enhanced parser:', error);
    throw error;
  }
}

/**
 * Validate question structure matches requirements
 * @param {Object} question - Question object to validate
 * @param {number} questionNum - Question number for logging
 * @returns {boolean} True if structure is valid
 */
function validateQuestionStructure(question, questionNum) {
  const requiredFields = ['topic', 'question', 'image', 'options', 'correct_answer', 'explanation', 'type'];
  
  // Check all required fields exist
  for (const field of requiredFields) {
    if (!(field in question)) {
      console.warn(`    ⚠️  Question ${questionNum}: Missing field '${field}'`);
      return false;
    }
  }
  
  // Validate field types
  if (typeof question.topic !== 'string' || question.topic.trim() === '') {
    console.warn(`    ⚠️  Question ${questionNum}: Invalid topic`);
    return false;
  }
  
  if (typeof question.question !== 'string' || question.question.trim() === '') {
    console.warn(`    ⚠️  Question ${questionNum}: Invalid question text`);
    return false;
  }
  
  if (!Array.isArray(question.options)) {
    console.warn(`    ⚠️  Question ${questionNum}: Options must be an array`);
    return false;
  }
  
  if (!['MCQ', 'SHORT_ANSWER'].includes(question.type)) {
    console.warn(`    ⚠️  Question ${questionNum}: Invalid question type`);
    return false;
  }
  
  // Validate MCQ specific rules
  if (question.type === 'MCQ') {
    if (question.options.length < 2 || question.options.length > 4) {
      console.warn(`    ⚠️  Question ${questionNum}: MCQ must have 2-4 options`);
      return false;
    }
    
    if (question.correct_answer && !/^[A-D]$/i.test(question.correct_answer)) {
      console.warn(`    ⚠️  Question ${questionNum}: MCQ answer should be A, B, C, or D`);
      return false;
    }
  }
  
  // Validate SHORT_ANSWER specific rules
  if (question.type === 'SHORT_ANSWER') {
    if (question.options.length !== 0) {
      console.warn(`    ⚠️  Question ${questionNum}: SHORT_ANSWER should have no options`);
      return false;
    }
  }
  
  return true;
}

// Run the test
testEnhancedParser().catch(console.error);

const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'server', 'storage', 'quiz-docs', 'course_1762414017406', 'Easy', '1762414035144-EOS-Test 18 Math Easy.txt');
const fileContent = fs.readFileSync(filePath, 'utf8');

console.log('File content length:', fileContent.length);
console.log('First 500 characters:');
console.log(fileContent.substring(0, 500));

// Count lines
const lines = fileContent.split('\n');
console.log('Total lines in file:', lines.length);

// Count question markers
let questionCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.match(/^(?:Q\.?\s*)?(\d+)[\.\)]/i)) {
    questionCount++;
    console.log(`Found question ${questionCount}: ${line}`);
  }
}

console.log(`Total question markers found: ${questionCount}`);
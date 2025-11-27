// Debug line processing for a single question block
const block = {
  number: 1,
  lines: [
    "Q. 1) What is the capital of France?",
    "A. Paris",
    "B. London",
    "C. Berlin",
    "D. Madrid",
    "Answer: A"
  ]
};

console.log("Processing block:");
block.lines.forEach((line, i) => {
  console.log(`${i + 1}: "${line}"`);
});

let questionTextLines = [];
let options = [];
let answerText = '';
let explanationLines = [];
let inExplanation = false;

// Process lines in the block
for (let i = 0; i < block.lines.length; i++) {
  const line = block.lines[i];
  
  // Skip empty lines
  if (!line.trim()) continue;
  
  console.log(`\nProcessing line ${i + 1}: "${line}"`);
  
  // Extract text after question header if this is the first line
  let lineText = line;
  if (i === 0) {
    const headerMatch = line.match(/^Q\.\s*\d+\)\s*(.*)/i);
    console.log(`Header match result:`, headerMatch);
    
    if (headerMatch && headerMatch[1]) {
      lineText = headerMatch[1].trim();
      console.log(`Extracted question text: "${lineText}"`);
    } else {
      // Remove the header entirely
      const headerOnly = line.match(/^Q\.\s*\d+\)/i);
      console.log(`Header only match:`, headerOnly);
      
      if (headerOnly) {
        lineText = line.replace(headerOnly[0], '').trim();
        console.log(`Removed header, remaining text: "${lineText}"`);
      }
    }
  }
  
  // Check for explanation start
  const explanationMatch = line.match(/(?:Explanation:|Exp:)\s*(.+)/i);
  if (explanationMatch) {
    inExplanation = true;
    if (explanationMatch[1]) {
      explanationLines.push(explanationMatch[1].trim());
    }
    console.log(`Found explanation: "${explanationMatch[1]}"`);
    continue;
  }
  
  // If we're in explanation mode, collect explanation lines
  if (inExplanation) {
    explanationLines.push(line.trim());
    console.log(`Added to explanation: "${line.trim()}"`);
    continue;
  }
  
  // Check for answer line - FIXED REGEX PATTERN
  const answerMatch = line.match(/Answer:\s*(.+)/i);
  if (answerMatch) {
    answerText = answerMatch[1].trim();
    console.log(`Found answer: "${answerText}"`);
    continue;
  }
  
  // Check if this line looks like an option
  const optionMatch = line.match(/^([A-D])[\.\)\-]?\s*(.+)$/i);
  if (optionMatch) {
    const optionContent = optionMatch[2].trim();
    options.push({
      text: optionContent
    });
    console.log(`Found option ${optionMatch[1]}: "${optionContent}"`);
    continue;
  }
  
  // Otherwise, treat as question text
  if (lineText.trim()) {
    questionTextLines.push(lineText.trim());
    console.log(`Added to question text: "${lineText.trim()}"`);
  }
}

console.log("\nFinal results:");
console.log(`Question text lines:`, questionTextLines);
console.log(`Options:`, options);
console.log(`Answer text: "${answerText}"`);
console.log(`Explanation lines:`, explanationLines);
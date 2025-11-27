// Debug full parsing process
const testContent = `Q. 1) What is the capital of France?
A. Paris
B. London
C. Berlin
D. Madrid
Answer: A`;

const lines = testContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log("Lines after splitting and trimming:");
lines.forEach((line, i) => {
  console.log(`${i + 1}: "${line}"`);
});

// Group lines by question header
const questionBlocks = [];
let currentBlock = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check for question header pattern
  const questionHeaderMatch = line.match(/^Q\.\s*(\d+)\)/i);
  
  if (questionHeaderMatch) {
    // Start of a new question block
    if (currentBlock) {
      questionBlocks.push(currentBlock);
    }
    
    const questionNumber = parseInt(questionHeaderMatch[1]);
    currentBlock = {
      number: questionNumber,
      lines: [line]
    };
    console.log(`\nFound question header: Q.${questionNumber}`);
  } else if (currentBlock) {
    // Accumulate line in current block
    currentBlock.lines.push(line);
    console.log(`Added line to block: "${line}"`);
  } else if (!currentBlock && line.trim()) {
    // Handle lines before first question header
    currentBlock = {
      number: 0,
      lines: [line]
    };
    console.log(`\nStarted initial block: "${line}"`);
  }
}

// Don't forget the last block
if (currentBlock) {
  questionBlocks.push(currentBlock);
}

console.log("\nQuestion blocks:");
questionBlocks.forEach((block, i) => {
  console.log(`Block ${i + 1} (Q.${block.number}):`);
  block.lines.forEach((line, j) => {
    console.log(`  ${j + 1}: "${line}"`);
  });
});